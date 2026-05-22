<div align="center">

# 🏠 AI Powered Search Engine

### Conversational Real Estate Search — powered by LLMs & fuzzy matching

Search for properties the way you'd talk to a real estate agent.
Type *"3 BHK ready to move flat on Tonk Road Jaipur under 1 crore"* and get
structured, relevant results typos and vague phrasing welcome.

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-OpenAI-1C3C3C?logo=langchain&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

</div>

---

## ✨ Overview

**AI Powered Search Engine** turns free form, natural language property queries into
precise, filtered results. It blends three layers:

1. **🧠 LLM understanding** — an OpenAI model (`gpt-4.1-nano`) parses messy user input
   into a clean, structured query, correcting typos and disambiguating *locality vs. city*.
2. **🎯 Smart filtering** — hard constraints (BHK, area, budget, type) plus exact &
   fuzzy text matching (`rapidfuzz`) over a property dataset.
3. **🪄 Graceful fallback** — if a strict search returns nothing, filters are relaxed
   automatically so the user still gets useful results.

A lightweight web frontend is bundled so you can try it straight from the browser.

---

## 🚀 Features

- 💬 **Conversational queries** — understands natural language, not rigid forms
- ✍️ **Typo & vagueness tolerant** — "redy to mov flat" still works
- 🗺️ **Locality-aware** — separates *"Tonk Road"* (location) from *"Jaipur"* (city)
- 🏢 **Residential & commercial** — villas, plots, apartments, shops, office space
- 🔁 **Automatic filter relaxation** — never leaves the user with an empty screen
- 🌐 **CORS-enabled REST API** — drop-in for any frontend
- 🐳 **Docker-ready** — one command to containerize

---

## 🧩 Tech Stack

| Layer        | Technology |
|--------------|------------|
| API          | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| LLM          | [LangChain](https://www.langchain.com/) + OpenAI (`gpt-4.1-nano`) |
| Matching     | [RapidFuzz](https://github.com/maxbachmann/RapidFuzz) |
| Data         | [pandas](https://pandas.pydata.org/) over `rand_cities_data.csv` |
| Frontend     | Vanilla HTML / CSS / JavaScript |
| Validation   | [Pydantic](https://docs.pydantic.dev/) |

---

## 📁 Project Structure

```
.
├── maybe_final_api.py      # FastAPI app — "Conversational Real Estate Search API"
├── rand_cities_data.csv    # Property dataset (city, location, price, BHK, ...)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container build for the API
└── web_application/        # Static frontend
    ├── index.html
    ├── script.js
    ├── style.css
    └── images/
```

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/saifahmed8521/AI-Powered-Search-Engine.git
cd AI-Powered-Search-Engine
```

### 2. Create a virtual environment & install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure your OpenAI API key

Create a `.env` file in the project root:

```env
OPENAI_API_KEY="your-openai-api-key-here"
```

> 🔒 The `.env` file is git-ignored — never commit your API key.

---

## ▶️ Running the App

### Run the API locally

```bash
uvicorn maybe_final_api:app --host 0.0.0.0 --port 8000 --reload
```

- API base URL: <http://localhost:8000>
- Interactive docs (Swagger UI): <http://localhost:8000/docs>

### Run with Docker

```bash
docker build -t ai-powered-search-engine .
docker run -p 8000:8000 --env-file .env ai-powered-search-engine
```

### Open the frontend

Open `web_application/index.html` in your browser, or serve the folder with any
static server — it talks to the API for conversational search.

---

## 📡 API Reference

### `POST /chat-search`

Parse a natural language query and return matching properties.

**Request body**

```json
{
  "session_id": "user-123",
  "user_input": "3 bhk ready to move flat on Tonk Road Jaipur under 1 crore"
}
```

**Response** — a JSON array of matching property records:

```json
[
  {
    "id": 143489,
    "city": "jaipur",
    "location": "tonk road",
    "property_type": "residential",
    "display_price": 40000000,
    "area": 452,
    "property_status": "new launch",
    "rating": 4,
    "developer_name": "lodha group",
    "bhk": 1,
    "name": "dreamland apartments"
  }
]
```

| Status | Meaning |
|--------|---------|
| `200`  | Matches found |
| `400`  | Irrelevant query (e.g. shoes, laptops) |
| `404`  | No matching property |
| `500`  | Server / parsing error |

### `DELETE /reset-history/{session_id}`

Clears stored conversation history for a session.

---

## 🔮 How It Works

```
User query
   │
   ▼
🧠 LLM (structured output)  ──►  PropertyQuery {bhk, budget, location, city, ...}
   │
   ▼
🎯 apply_filters()          ──►  exact + fuzzy matching on the dataset
   │
   ├─ results found ───────────►  ✅ return records
   │
   └─ empty ──► 🪄 relax filters ──► retry ──► return / 404
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an
issue or submit a pull request.

---

<div align="center">

Made with ❤️ and ☕

</div>
