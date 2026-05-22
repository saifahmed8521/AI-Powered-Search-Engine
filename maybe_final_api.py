from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from rapidfuzz import process,fuzz
import pandas as pd

# ===================== LOAD ENVIRONMENT ======================
load_dotenv()

# =============== INITIALIZE FASTAPI APP ======================

app = FastAPI(title="Conversational Real Estate Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================== LOAD CSV DATA ========================

DF_PATH = "rand_cities_data.csv"
try:
    df = pd.read_csv(DF_PATH)
except FileNotFoundError:
    raise RuntimeError(f"CSV file not found at path: {DF_PATH}")


# Normalize for consistent matching
for col in ["location", "property_type", "property_status", "developer_name", "city","name"]:
    if col in df.columns:
        df[col] = df[col].astype(str).str.lower()


# ======================= DATA MODELS =========================


class ResidentialDetails(BaseModel):
    sub_type: Optional[Literal["plot", "villa", "apartment"]] = None
    bhk: Optional[float] = None

class CommercialDetails(BaseModel):
    sub_type: Optional[Literal["shop", "office space"]] = None

class PropertyQuery(BaseModel):
    name: Optional[str] = None
    area: Optional[float] = None
    bhk: Optional[float] = None
    location: Optional[str] = None
    city: Optional[str] = None  
    budget: Optional[int] = None
    property_type: Literal["residential", "commercial"]
    residential_details: Optional[ResidentialDetails] = Field(default_factory=ResidentialDetails)
    commercial_details: Optional[CommercialDetails] = None
    availability_status: Optional[Literal["ready to move", "under construction", "new launch"]] = None
    developed_by: Optional[str] = None

# ==================== LANGCHAIN MODEL ========================

model = ChatOpenAI(model="gpt-4.1-nano-2025-04-14", temperature=0.2)
structured_model = model.with_structured_output(PropertyQuery)

class ConversationalInput(BaseModel):
    session_id: str
    user_input: str
    previous_state: Optional[PropertyQuery] = None

conversation_history: Dict[str, PropertyQuery] = {}

# =================== HELPER FUNCTIONS ========================


# Check for irrelevant queries
def is_invalid_query(text: str) -> bool:
    invalid_keywords = ["shoes", "iphone", "laptop", "nike", "shirt", "t-shirt"]
    return any(word in text.lower() for word in invalid_keywords)

# Fuzzy location match

#  Maybe Not getting BHK filtering because if this

def fuzzy_filter(df, column, value, threshold=70):
    if not value or column not in df.columns:
        return df  # Nothing to filter

    try:

        scores = df[column].fillna("").apply(lambda x: fuzz.token_sort_ratio(str(value).lower(), str(x).lower()))
        filtered_df = df[scores >= threshold]
        print(f"Fuzzy match for '{value}' in '{column}': {len(filtered_df)} matches with threshold {threshold}")
        return filtered_df
    except Exception as e:
        print(f"Fuzzy filter error on column '{column}': {e}")
        return df
    

def apply_filters(df, query: PropertyQuery, relax_filters=None):
    if relax_filters is None:
        relax_filters = []

    temp_df = df.copy()
    print("🔍 Initial dataset size:", len(temp_df))

    # -------------------- Exact filters (hard constraints) --------------------
    if query.bhk and "bhk" not in relax_filters:
        temp_df = temp_df[temp_df["bhk"] == query.bhk]
        print("✅ After BHK filter:", len(temp_df))

    if query.area and "area" not in relax_filters:
        temp_df = temp_df[temp_df["area"] >= query.area]
        print("✅ After Area filter:", len(temp_df))

    if query.budget and "budget" not in relax_filters:
        temp_df = temp_df[temp_df["display_price"] <= query.budget + 200000]
        print("✅ After Budget filter:", len(temp_df))

    if query.property_type and "type" not in relax_filters:
        temp_df = temp_df[temp_df["property_type"].str.lower() == query.property_type.lower()]
        print("✅ After Property Type filter:", len(temp_df))

    # -------------------- Text filters (intersection logic) --------------------
    def filter_text(df, column, value, threshold=90):
        if not value or column not in df.columns:
            return df

        # First try exact match
        exact_df = df[df[column].str.lower().str.strip() == value.lower().strip()]
        if not exact_df.empty:
            print(f"✅ Exact match for '{value}' in {column}: {len(exact_df)} rows")
            return exact_df

        # Fallback: fuzzy
        scores = df[column].fillna("").apply(lambda x: fuzz.token_sort_ratio(value.lower(), str(x).lower()))
        filtered_df = df[scores >= threshold]
        print(f"⚠️ Fuzzy match for '{value}' in {column}: {len(filtered_df)} rows (threshold={threshold})")
        return filtered_df

    if query.location and "location" not in relax_filters:
        temp_df = filter_text(temp_df, "location", query.location, threshold=85)
        print("✅ After Location filter:", len(temp_df))

    if query.city and "city" not in relax_filters:
        temp_df = filter_text(temp_df, "city", query.city, threshold=90)
        print("✅ After City filter:", len(temp_df))

    if query.developed_by and "developer_name" not in relax_filters:
        temp_df = filter_text(temp_df, "developer_name", query.developed_by, threshold=90)
        print("✅ After Developer filter:", len(temp_df))

    if query.availability_status and "status" not in relax_filters:
        temp_df = filter_text(temp_df, "property_status", query.availability_status, threshold=95)
        print("✅ After Status filter:", len(temp_df))
    
    if query.name and "name" not in relax_filters:
        temp_df = filter_text(temp_df, "name", query.name, threshold=85)
        print("✅ After Name filter:", len(temp_df))

    print(f"🎯 Final result count: {len(temp_df)}")
    return temp_df

# ==================== MAIN SEARCH ENDPOINT ===================

@app.post("/chat-search", response_model=List[Dict[str, Any]])
def conversational_search(input: ConversationalInput):
    try:
        # Step 0: Reject irrelevant query
        if is_invalid_query(input.user_input):
            raise HTTPException(status_code=400, detail="Your question is wrong.")

        # 🔄 RESET: Always start fresh - ignore previous state for standalone search
        # Each search is treated as completely independent, no conversation history maintained
        print(f"🔄 STANDALONE SEARCH: '{input.user_input}' - Ignoring previous context")
        
        # prev_state = (
        #     input.previous_state or
        #     conversation_history.get(input.session_id) or
        #     PropertyQuery(property_type="residential")
        # )
        
        # 🔄 NEW: Always start with default state for standalone search
        prev_state = PropertyQuery(property_type="residential")

        # Step 2: Parse updated structured query
        parsed_query: PropertyQuery = structured_model.invoke(f"""
        You are a real estate assistant for the general public.
        Users might make typos or use vague terms — correct them and only extract relevant fields.

        Correct misspellings and update only the fields that the user explicitly mentioned.

        Current state:
        {prev_state.model_dump_json(indent=2, exclude_none=False)}

        User said:
        \"{input.user_input}\"

        Rules:
        - Budget is in INR.
        - Location can be either a city or a locality.
        - If user input has both a locality/road/area and a city, 
          assign the smaller area name to "location" 
          and the larger region name to "city" in city there should always an state/UT name. 
          Example: "Tonk Road Jaipur" → location="Tonk Road", city="Jaipur".
          city are : Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow
        - Only use residential sub_type if user mentions apartment, plot, or villa.
        - Availability status:
            * Map phrases like "ready", "possession now", → "ready to move"
            "under construction", "ongoing project" → "under construction"
            "new launch", "just started" → "new launch"
        - every column is in lowercase
        """)


        # ✅ Print structured query before filtering
        print("🔎 Structured Query Parsed:\n", parsed_query.model_dump_json(indent=2, exclude_none=False))

        # 🔄 RESET: Don't update conversation history - treat as standalone
        # conversation_history[input.session_id] = parsed_query

        # Step 4: Apply filtering with fallback logic
        # 1. Exact match: location + bhk + budget + property_type
        result = apply_filters(df, parsed_query, relax_filters=[])
        if not result.empty:
            return result.to_dict(orient="records")

        # # 2. Relax location
        # result = apply_filters(df, parsed_query, relax_filters=["location"])
        # if not result.empty:
        #     return result.to_dict(orient="records")

        # # 3. Relax bhk
        # result = apply_filters(df, parsed_query, relax_filters=["bhk"])
        # if not result.empty:
        #     return result.to_dict(orient="records")

        # Relaxed location
        result = apply_filters(df, parsed_query, relax_filters=["location"])
        if not result.empty:
            return result.to_dict(orient="records")
        # # 4. Relax bhk + location
        # result = apply_filters(df, parsed_query, relax_filters=["bhk", "location"])
        # if not result.empty:
        #     return result.to_dict(orient="records")
        
        # # 4.5 Relax bhk + location + city
        # result = apply_filters(df, parsed_query, relax_filters=["bhk", "location","city"])
        # if not result.empty:
        #     return result.to_dict(orient="records")

        # # 5. Fully relaxed (everything except property_type)
        # result = apply_filters(df, parsed_query, relax_filters=["bhk", "location", "availability", "developer"])
        # if not result.empty:
        #     return result.to_dict(orient="records")

        # 6. No match
        raise HTTPException(status_code=404, detail="No match found.")

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================
# ================= RESET SESSION ENDPOINT ====================
# =============================================================

@app.delete("/reset-history/{session_id}")
def reset_conversation_history(session_id: str):
    if session_id in conversation_history:
        del conversation_history[session_id]
        print(conversation_history)
        return {"message": f"History reset for session '{session_id}'"}
    else:
        raise HTTPException(status_code=500, detail="Server break down.")


