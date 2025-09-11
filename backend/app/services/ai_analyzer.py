# app/services/ai_analyzer.py

import os
import json
import asyncio
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from pydantic import BaseModel
from fastapi import HTTPException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for structured responses
class AnalysisResult(BaseModel):
    """
    Structured model for AI analysis results.
    
    Backend Engineering Concept: Data Transfer Objects (DTOs)
    - Ensures consistent response structure
    - Type safety and validation
    - Easy serialization to JSON
    """
    ats_score: int
    strengths: List[str]
    improvements: List[str]
    missing_keywords: List[str]
    keyword_matches: List[str]
    overall_feedback: str
    confidence_score: float

class AIAnalyzer:
    """
    Service class for AI-powered resume analysis.
    
    Key Learning Concepts:
    - Singleton pattern for API client
    - Async programming for external API calls
    - Prompt engineering for specific tasks
    - Error handling and retry logic
    """
    
    def __init__(self):
        """Initialize OpenAI client with API key from environment."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("DEFAULT_MODEL", "gpt-3.5-turbo")
        self.max_tokens = 2000
        
    async def analyze_resume(self, resume_text: str, job_description: str) -> AnalysisResult:
        """
        Analyze resume against job description using AI.
        
        Args:
            resume_text: Extracted text from resume
            job_description: Job posting text
            
        Returns:
            AnalysisResult with scores and recommendations
        """
        
        # Input validation
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume text is empty")
        
        if not job_description.strip():
            raise HTTPException(status_code=400, detail="Job description is empty")
        
        # Truncate inputs if too long (cost optimization)
        resume_text = self._truncate_text(resume_text, 3000)
        job_description = self._truncate_text(job_description, 2000)
        
        try:
            # Generate analysis using AI
            analysis_data = await self._generate_analysis(resume_text, job_description)
            
            # Parse and validate response
            return self._parse_analysis_response(analysis_data)
            
        except Exception as e:
            logger.error(f"AI analysis failed: {str(e)}")
            # Return fallback analysis instead of failing completely
            return self._generate_fallback_analysis(resume_text, job_description)
    
    async def _generate_analysis(self, resume_text: str, job_description: str) -> Dict:
        """
        Generate AI analysis using OpenAI API.
        
        Learning Concept: Prompt Engineering
        - Structured prompts for consistent outputs
        - JSON format requests for structured data
        - Context setting for domain expertise
        """
        
        system_prompt = """You are an expert ATS (Applicant Tracking System) analyst and career counselor. 
        Your job is to analyze resumes against job descriptions and provide actionable feedback.

        Analyze the resume and job description, then respond with a JSON object containing:
        - ats_score: Integer from 0-100 (how well resume matches job requirements)
        - strengths: Array of 3-5 specific strengths found in the resume
        - improvements: Array of 3-5 specific, actionable improvement suggestions
        - missing_keywords: Array of important keywords from job description missing in resume
        - keyword_matches: Array of keywords that match between resume and job description
        - overall_feedback: 2-3 sentence summary of the analysis
        - confidence_score: Float from 0.0-1.0 indicating analysis confidence

        Focus on:
        1. ATS compatibility (formatting, keywords, structure)
        2. Job requirement alignment
        3. Quantifiable achievements
        4. Industry-specific terminology
        5. Professional presentation

        Be specific and actionable in recommendations."""

        user_prompt = f"""
        RESUME:
        {resume_text}

        JOB DESCRIPTION:
        {job_description}

        Provide detailed analysis as JSON only."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower temperature for more consistent responses
                response_format={"type": "json_object"}  # Ensures JSON response
            )
            
            # Extract and parse JSON response
            content = response.choices[0].message.content
            analysis_data = json.loads(content)
            
            logger.info("AI analysis completed successfully")
            return analysis_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise HTTPException(status_code=500, detail="AI response parsing failed")
        
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise HTTPException(status_code=500, detail="AI analysis service unavailable")
    
    def _parse_analysis_response(self, analysis_data: Dict) -> AnalysisResult:
        """
        Parse and validate AI response into structured format.
        
        Learning Concept: Data Validation
        - Ensure AI responses meet expected structure
        - Handle missing or invalid fields gracefully
        - Type conversion and bounds checking
        """
        
        try:
            # Validate and extract required fields with defaults
            ats_score = max(0, min(100, int(analysis_data.get("ats_score", 50))))
            
            strengths = analysis_data.get("strengths", [])[:5]  # Limit to 5
            improvements = analysis_data.get("improvements", [])[:5]
            missing_keywords = analysis_data.get("missing_keywords", [])[:10]
            keyword_matches = analysis_data.get("keyword_matches", [])[:10]
            
            overall_feedback = analysis_data.get("overall_feedback", "Analysis completed")
            confidence_score = max(0.0, min(1.0, float(analysis_data.get("confidence_score", 0.8))))
            
            return AnalysisResult(
                ats_score=ats_score,
                strengths=strengths,
                improvements=improvements,
                missing_keywords=missing_keywords,
                keyword_matches=keyword_matches,
                overall_feedback=overall_feedback,
                confidence_score=confidence_score
            )
            
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Failed to parse analysis response: {e}")
            # Return fallback if parsing fails
            return self._generate_fallback_analysis("", "")
    
    def _generate_fallback_analysis(self, resume_text: str, job_description: str) -> AnalysisResult:
        """
        Generate fallback analysis when AI fails.
        
        Learning Concept: Graceful Degradation
        - Always provide value to users, even when external services fail
        - Basic analysis using simple algorithms
        - Clearly indicate when fallback is used
        """
        
        # Simple keyword matching for fallback
        resume_words = set(resume_text.lower().split())
        job_words = set(job_description.lower().split())
        
        # Common tech keywords to look for
        tech_keywords = {
            'python', 'javascript', 'react', 'fastapi', 'sql', 'api', 
            'machine learning', 'ai', 'backend', 'frontend', 'database'
        }
        
        job_tech_words = job_words.intersection(tech_keywords)
        resume_tech_words = resume_words.intersection(tech_keywords)
        matches = list(job_tech_words.intersection(resume_tech_words))
        missing = list(job_tech_words - resume_tech_words)
        
        # Calculate basic score
        match_ratio = len(matches) / max(len(job_tech_words), 1)
        basic_score = int(match_ratio * 70 + 30)  # Base score of 30
        
        return AnalysisResult(
            ats_score=basic_score,
            strengths=[
                "Resume successfully uploaded and processed",
                "Basic formatting appears readable",
                f"Found {len(matches)} relevant skill matches" if matches else "Content structure is parseable"
            ],
            improvements=[
                "Consider adding more specific technical keywords",
                "Include quantifiable achievements and metrics",
                "Ensure ATS-friendly formatting (AI analysis unavailable)"
            ],
            missing_keywords=missing[:5],
            keyword_matches=matches[:5],
            overall_feedback="Basic analysis completed. AI-powered analysis temporarily unavailable, showing keyword-based results.",
            confidence_score=0.3
        )
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """
        Truncate text to prevent API token limits.
        
        Learning Concept: Cost Optimization
        - API calls are charged per token
        - Truncate intelligently to preserve important content
        - Balance between cost and analysis quality
        """
        if len(text) <= max_length:
            return text
        
        # Try to truncate at sentence boundary
        truncated = text[:max_length]
        last_period = truncated.rfind('.')
        
        if last_period > max_length * 0.8:  # If we can preserve 80% and end on sentence
            return truncated[:last_period + 1]
        
        return truncated + "..."

# Singleton instance for reuse
_ai_analyzer_instance = None

async def get_ai_analyzer() -> AIAnalyzer:
    """
    Get or create AIAnalyzer instance.
    
    Learning Concept: Dependency Injection
    - Reuse expensive-to-create objects
    - Easy to mock for testing
    - Centralized configuration
    """
    global _ai_analyzer_instance
    
    if _ai_analyzer_instance is None:
        _ai_analyzer_instance = AIAnalyzer()
    
    return _ai_analyzer_instance

# Main function for easy importing
async def analyze_resume_with_ai(resume_text: str, job_description: str) -> AnalysisResult:
    """
    Convenience function for resume analysis.
    
    This is the main function other parts of your application will call.
    """
    analyzer = await get_ai_analyzer()
    return await analyzer.analyze_resume(resume_text, job_description)