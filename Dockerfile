# Use Python base image
FROM python:3.12.3

# Set working directory inside container
WORKDIR /app

# Copy dependency file and install (better caching)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy everything else
COPY . .

# Expose the port (FastAPI/Flask usually runs on 8000)
EXPOSE 8000

# Start the API
# If it's FastAPI with uvicorn:
CMD ["uvicorn", "maybe_final_api:app", "--host", "0.0.0.0", "--port", "8000"]