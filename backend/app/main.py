# app/main.py

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our services
from app.services.file_parser import parse_resume_file
from app.services.ai_analyzer import analyze_resume_with_ai

# Create FastAPI instance
app = FastAPI(
    title="RoleFit Resume Analyzer API",
    description="AI-powered resume analysis for job compatibility",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "RoleFit API is running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.get("/")
async def read_root():
    """Root endpoint with API information."""
    return {
        "message": "RoleFit Resume Analyzer API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "analyze": "/analyze",
            "upload_test": "/upload-test",
            "debug_extract": "/debug/extract-text"
        }
    }

@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Main endpoint for AI-powered resume analysis.
    
    This is where the magic happens:
    1. Validate inputs
    2. Extract text from resume
    3. Analyze with AI
    4. Return structured results
    """
    
    # Input validation
    if not resume.filename:
        raise HTTPException(status_code=400, detail="No resume file provided")
    
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")
    
    # Validate file type
    allowed_types = ['.pdf', '.docx', '.txt']
    file_extension = os.path.splitext(resume.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(allowed_types)}"
        )
    
    # Check file size (10MB limit)
    file_content = await resume.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    
    if file_size_mb > 10:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum: 10MB"
        )
    
    # Reset file pointer for processing
    await resume.seek(0)
    
    try:
        # Step 1: Extract text from resume
        resume_text = await parse_resume_file(resume)
        
        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the resume"
            )
        
        # Step 2: Analyze with AI
        analysis_result = await analyze_resume_with_ai(resume_text, job_description)
        
        # Step 3: Format response
        response_data = {
            "success": True,
            "analysis": {
                "ats_score": analysis_result.ats_score,
                "strengths": analysis_result.strengths,
                "improvements": analysis_result.improvements,
                "missing_keywords": analysis_result.missing_keywords,
                "keyword_matches": analysis_result.keyword_matches,
                "overall_feedback": analysis_result.overall_feedback,
                "confidence_score": analysis_result.confidence_score
            },
            "file_info": {
                "filename": resume.filename,
                "file_type": file_extension,
                "size_mb": round(file_size_mb, 2),
                "text_length": len(resume_text),
                "processed_at": datetime.now().isoformat()
            },
            "metadata": {
                "api_version": "1.0.0",
                "analysis_type": "ai_powered" if os.getenv("OPENAI_API_KEY") else "fallback"
            }
        }
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log and handle unexpected errors
        print(f"Analysis error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/upload-test")
async def upload_file_test(file: UploadFile = File(...)):
    """Test endpoint for file upload and text extraction."""
    
    # Validate file type
    allowed_types = ['.pdf', '.docx', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_extension}'. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    
    if file_size_mb > 10:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum: 10MB"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    try:
        # Extract text
        extracted_text = await parse_resume_file(file)
        
        return {
            "success": True,
            "file_info": {
                "filename": file.filename,
                "file_type": file_extension,
                "size_mb": round(file_size_mb, 2),
                "content_length": len(extracted_text),
                "word_count": len(extracted_text.split())
            },
            "preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File processing failed: {str(e)}"
        )

@app.post("/debug/extract-text")
async def debug_extract_text(file: UploadFile = File(...)):
    """Debug endpoint to see full extracted text."""
    try:
        text = await parse_resume_file(file)
        return {
            "filename": file.filename,
            "extracted_text": text,
            "character_count": len(text),
            "word_count": len(text.split()),
            "preview_lines": text.split('\n')[:10]  # First 10 lines
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/config")
async def debug_config():
    """Debug endpoint to check configuration."""
    return {
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "api_key_length": len(os.getenv("OPENAI_API_KEY", "")) if os.getenv("OPENAI_API_KEY") else 0,
        "default_model": os.getenv("DEFAULT_MODEL", "gpt-3.5-turbo"),
        "debug_mode": os.getenv("DEBUG_MODE", "False"),
        "environment_loaded": True
    }