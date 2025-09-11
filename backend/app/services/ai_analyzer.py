# app/services/ai_analyzer.py - Enhanced Validation Version

import os
import json
import asyncio
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from pydantic import BaseModel
from fastapi import HTTPException
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnalysisResult(BaseModel):
    ats_score: int
    strengths: List[str]
    improvements: List[str]
    missing_keywords: List[str]
    keyword_matches: List[str]
    overall_feedback: str
    confidence_score: float

class AIAnalyzer:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("DEFAULT_MODEL", "gpt-3.5-turbo")
        self.max_tokens = 2000
        
    async def analyze_resume(self, resume_text: str, job_description: str) -> AnalysisResult:
        # Input validation
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume text is empty")
        
        if not job_description.strip():
            raise HTTPException(status_code=400, detail="Job description is empty")
        
        # Debug logging
        logger.info(f"Resume length: {len(resume_text)} characters")
        logger.info(f"Job description length: {len(job_description)} characters")
        logger.info(f"Job description preview: {job_description[:100]}...")
        
        # Enhanced validation with dummy text detection
        is_meaningful = self._is_meaningful_job_description(job_description)
        logger.info(f"Job description is meaningful: {is_meaningful}")
        
        if not is_meaningful:
            logger.info("Returning no-job-description analysis")
            return self._generate_no_job_description_analysis(resume_text)
        
        # Truncate inputs if too long
        resume_text = self._truncate_text(resume_text, 3000)
        job_description = self._truncate_text(job_description, 2000)
        
        try:
            # Generate analysis using AI
            logger.info("Calling OpenAI API for analysis")
            analysis_data = await self._generate_analysis(resume_text, job_description)
            
            # Parse and validate response
            result = self._parse_analysis_response(analysis_data)
            logger.info(f"Final analysis result: missing_keywords={len(result.missing_keywords)}, keyword_matches={len(result.keyword_matches)}")
            
            return result
            
        except Exception as e:
            logger.error(f"AI analysis failed: {str(e)}")
            return self._generate_fallback_analysis(resume_text, job_description)
    
    def _is_meaningful_job_description(self, job_description: str) -> bool:
        """
        ENHANCED: Detects dummy text, Lorem Ipsum, and other non-job content.
        """
        cleaned = job_description.strip().lower()
        
        # Check minimum length
        if len(cleaned) < 30:
            logger.info("Job description too short")
            return False
        
        # CRITICAL FIX: Detect Lorem Ipsum and dummy text patterns
        lorem_ipsum_indicators = [
            'lorem ipsum', 'dolor sit amet', 'consectetur adipiscing',
            'sed do eiusmod', 'tempor incididunt', 'labore et dolore',
            'magna aliqua', 'enim ad minim', 'veniam quis nostrud',
            'exercitation ullamco', 'laboris nisi', 'aliquip ex ea',
            'commodo consequat', 'duis aute irure', 'reprehenderit in voluptate',
            'esse cillum', 'fugiat nulla pariatur', 'excepteur sint occaecat',
            'cupidatat non proident', 'sunt in culpa'
        ]
        
        # Check for Lorem Ipsum
        lorem_count = sum(1 for phrase in lorem_ipsum_indicators if phrase in cleaned)
        if lorem_count >= 2:
            logger.info(f"Detected Lorem Ipsum text ({lorem_count} indicators found)")
            return False
        
        # Check for other dummy text patterns
        dummy_text_patterns = [
            'dummy text', 'placeholder text', 'sample text',
            'test content', 'filler text', 'example text',
            'typesetting industry', 'printing industry',
            'galley of type', 'type specimen book',
            'letraset sheets', 'aldus pagemaker',
            'desktop publishing software'
        ]
        
        dummy_count = sum(1 for pattern in dummy_text_patterns if pattern in cleaned)
        if dummy_count >= 2:
            logger.info(f"Detected dummy/placeholder text ({dummy_count} patterns found)")
            return False
        
        # Check for repetitive random patterns
        words = cleaned.split()
        if len(words) < 5:
            logger.info("Job description has too few words")
            return False
        
        # Detect obviously fake content
        random_patterns = 0
        for word in words[:15]:  # Check first 15 words
            if len(word) > 3:
                # Check if word is mostly repeated characters
                if len(set(word)) <= 2 and len(word) > 4:
                    random_patterns += 1
                # Check for keyboard patterns
                if word in ['asdf', 'qwerty', 'zxcv', 'asdfgh', 'qwertyui']:
                    random_patterns += 5
        
        if random_patterns > 2:
            logger.info("Job description contains random keyboard patterns")
            return False
        
        # Check for actual job-related content (more comprehensive)
        job_indicators = [
            # Core job terms
            'experience', 'required', 'responsibilities', 'qualifications', 'skills',
            'role', 'position', 'candidate', 'team', 'work', 'job',
            
            # Action words
            'develop', 'manage', 'support', 'create', 'build', 'design',
            'implement', 'maintain', 'collaborate', 'lead', 'analyze',
            
            # Technical terms
            'technical', 'development', 'engineering', 'programming',
            'software', 'application', 'system', 'technology', 'tools',
            
            # Business terms
            'business', 'project', 'client', 'customer', 'product',
            'service', 'solutions', 'requirements', 'processes',
            
            # Qualification terms
            'degree', 'education', 'certification', 'training',
            'knowledge', 'ability', 'expertise', 'proficiency'
        ]
        
        indicator_count = sum(1 for indicator in job_indicators if indicator in cleaned)
        logger.info(f"Found {indicator_count} job indicators")
        
        # Need at least 3 real job indicators (increased from 1)
        if indicator_count < 3:
            logger.info("Not enough job indicators found")
            
            # Additional check for professional terms
            professional_terms = [
                'company', 'organization', 'department', 'office',
                'salary', 'benefits', 'remote', 'onsite', 'hybrid',
                'full-time', 'part-time', 'contract', 'permanent'
            ]
            
            professional_count = sum(1 for term in professional_terms if term in cleaned)
            logger.info(f"Found {professional_count} professional terms")
            
            # Need both job indicators AND professional terms
            if indicator_count < 2 or professional_count < 1:
                return False
        
        # Final check: ensure it's not just marketing copy or generic text
        # Real job descriptions should mention specific requirements or skills
        specific_terms = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue',
            'sql', 'database', 'api', 'aws', 'azure', 'docker',
            'git', 'agile', 'scrum', 'testing', 'debugging',
            'bachelor', 'master', 'degree', 'years of experience',
            'minimum', 'preferred', 'must have', 'should have'
        ]
        
        specific_count = sum(1 for term in specific_terms if term in cleaned)
        logger.info(f"Found {specific_count} specific job terms")
        
        # Either have good job indicators OR specific requirements
        if indicator_count >= 3 or (indicator_count >= 2 and specific_count >= 1):
            return True
        
        return False
    
    def _generate_no_job_description_analysis(self, resume_text: str) -> AnalysisResult:
        """Return analysis when job description is not meaningful."""
        logger.info("Generating no-job-description analysis")
        return AnalysisResult(
            ats_score=0,  # Changed to 0 for invalid input
            strengths=[
                "Resume successfully uploaded and processed",
                "Document structure is readable"
            ],
            improvements=[
                "Please provide a real job description for analysis",
                "Job description should contain actual job requirements, responsibilities, and qualifications",
                "Avoid using placeholder text, Lorem Ipsum, or dummy content",
                "Include specific skills, experience requirements, and role details"
            ],
            missing_keywords=[],
            keyword_matches=[],
            overall_feedback="Cannot perform analysis with placeholder or dummy text. Please provide a genuine job posting with specific requirements, responsibilities, and qualifications.",
            confidence_score=0.0
        )
    
    async def _generate_analysis(self, resume_text: str, job_description: str) -> Dict:
        """Generate AI analysis with strict instructions."""
        
        system_prompt = """You are an expert ATS analyst. Your job is to compare the resume against the SPECIFIC job description provided.

CRITICAL INSTRUCTIONS:
1. ONLY analyze if the job description appears to be a real job posting
2. If the job description contains Lorem Ipsum, placeholder text, or dummy content, respond with an error
3. Extract specific skills, technologies, and requirements ONLY from the actual job description
4. Do NOT add general industry knowledge or assume requirements
5. Be literal and precise in your keyword matching

You must respond with a JSON object containing:
- ats_score: Integer 0-100 based on actual job requirements match
- strengths: Array of specific strengths found in resume relative to job description
- improvements: Array of specific improvements needed for this job
- missing_keywords: Array of terms from job description not found in resume
- keyword_matches: Array of terms found in both resume and job description
- overall_feedback: Brief summary based on actual comparison
- confidence_score: Float 0.0-1.0

If job description appears to be placeholder/dummy text, return ats_score: 0 and explain the issue."""

        user_prompt = f"""
RESUME TEXT:
{resume_text}

JOB DESCRIPTION:
{job_description}

Analyze this resume against the specific job description. Only extract keywords and requirements that are explicitly mentioned in the job description above.

Respond with JSON only."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.1,  # Very low temperature for precise analysis
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            analysis_data = json.loads(content)
            
            # If AI detected dummy text, return appropriate response
            if analysis_data.get("ats_score", 0) == 0:
                logger.info("AI detected invalid job description")
                return {
                    "ats_score": 0,
                    "strengths": ["Resume processed successfully"],
                    "improvements": ["Please provide a real job description"],
                    "missing_keywords": [],
                    "keyword_matches": [],
                    "overall_feedback": "Invalid job description provided. Please use a real job posting.",
                    "confidence_score": 0.0
                }
            
            logger.info(f"AI returned {len(analysis_data.get('missing_keywords', []))} missing keywords and {len(analysis_data.get('keyword_matches', []))} matches")
            
            return analysis_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise HTTPException(status_code=500, detail="AI response parsing failed")
        
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise HTTPException(status_code=500, detail="AI analysis service unavailable")
    
    def _parse_analysis_response(self, analysis_data: Dict) -> AnalysisResult:
        """Parse and validate AI response into structured format."""
        
        try:
            ats_score = max(0, min(100, int(analysis_data.get("ats_score", 0))))
            
            strengths = analysis_data.get("strengths", [])[:5]
            improvements = analysis_data.get("improvements", [])[:5]
            missing_keywords = analysis_data.get("missing_keywords", [])[:10]
            keyword_matches = analysis_data.get("keyword_matches", [])[:10]
            
            overall_feedback = analysis_data.get("overall_feedback", "Analysis completed")
            confidence_score = max(0.0, min(1.0, float(analysis_data.get("confidence_score", 0.0))))
            
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
            return self._generate_no_job_description_analysis("")
    
    def _generate_fallback_analysis(self, resume_text: str, job_description: str) -> AnalysisResult:
        """Generate fallback analysis when AI fails."""
        
        logger.info("Generating fallback analysis")
        
        if not self._is_meaningful_job_description(job_description):
            return self._generate_no_job_description_analysis(resume_text)
        
        # Simple fallback only for valid job descriptions
        return AnalysisResult(
            ats_score=40,
            strengths=[
                "Resume processed successfully",
                "Document format is readable"
            ],
            improvements=[
                "AI analysis temporarily unavailable",
                "Please try again later for detailed feedback"
            ],
            missing_keywords=[],
            keyword_matches=[],
            overall_feedback="Fallback analysis mode. AI service temporarily unavailable.",
            confidence_score=0.2
        )
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to prevent API token limits."""
        if len(text) <= max_length:
            return text
        
        truncated = text[:max_length]
        last_period = truncated.rfind('.')
        
        if last_period > max_length * 0.8:
            return truncated[:last_period + 1]
        
        return truncated + "..."

# Singleton instance
_ai_analyzer_instance = None

async def get_ai_analyzer() -> AIAnalyzer:
    global _ai_analyzer_instance
    
    if _ai_analyzer_instance is None:
        _ai_analyzer_instance = AIAnalyzer()
    
    return _ai_analyzer_instance

async def analyze_resume_with_ai(resume_text: str, job_description: str) -> AnalysisResult:
    analyzer = await get_ai_analyzer()
    return await analyzer.analyze_resume(resume_text, job_description)