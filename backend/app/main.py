# app/main.py - Minimal FastAPI app to test setup

from fastapi import FastAPI

# Create the app
app = FastAPI(title="RoleFit API")

# Simple health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}

# Simple test endpoint
@app.get("/")
def read_root():
    return {"message": "RoleFit Resume Analyzer API", "version": "1.0.0"}

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)