# app/services/file_parser.py

import io
from typing import Union
import PyPDF2
from docx import Document
from fastapi import UploadFile, HTTPException

class FileParser:
    """
    Service class for extracting text from different file formats.
    
    Backend Engineering Concept: Service Layer Pattern
    - Separates business logic from API endpoints
    - Reusable across different parts of the application
    - Easier to test and maintain
    """
    
    @staticmethod
    async def extract_text_from_file(file: UploadFile) -> str:
        """
        Extract text from uploaded file based on file type.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Extracted text as string
            
        Raises:
            HTTPException: If file type unsupported or processing fails
        """
        
        # Read file content into memory
        file_content = await file.read()
        
        # Reset file pointer for potential re-reading
        await file.seek(0)
        
        # Get file extension
        filename = file.filename.lower()
        
        try:
            if filename.endswith('.pdf'):
                return FileParser._extract_from_pdf(file_content)
            elif filename.endswith('.docx'):
                return FileParser._extract_from_docx(file_content)
            elif filename.endswith('.txt'):
                return FileParser._extract_from_txt(file_content)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type. Supported: PDF, DOCX, TXT"
                )
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing file: {str(e)}"
            )
    
    @staticmethod
    def _extract_from_pdf(file_content: bytes) -> str:
        """
        Extract text from PDF file.
        
        Learning Concept: Binary File Processing
        - PDFs are binary files, not plain text
        - Need specialized libraries to parse structure
        - Handle potential corruption or password protection
        """
        text_content = []
        
        try:
            # Create file-like object from bytes
            pdf_file = io.BytesIO(file_content)
            
            # Create PDF reader
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Check if PDF is encrypted
            if pdf_reader.is_encrypted:
                raise Exception("PDF is password protected")
            
            # Extract text from each page
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content.append(page.extract_text())
            
            # Join all pages with newlines
            full_text = "\n".join(text_content)
            
            # Clean up text (remove extra whitespace)
            cleaned_text = " ".join(full_text.split())
            
            if not cleaned_text.strip():
                raise Exception("No text found in PDF")
                
            return cleaned_text
            
        except Exception as e:
            raise Exception(f"PDF processing error: {str(e)}")
    
    @staticmethod
    def _extract_from_docx(file_content: bytes) -> str:
        """
        Extract text from Word document.
        
        Learning Concept: Structured Document Processing
        - DOCX files are actually ZIP archives with XML inside
        - python-docx handles the complex structure for us
        - Can access paragraphs, tables, headers separately
        """
        try:
            # Create file-like object from bytes
            docx_file = io.BytesIO(file_content)
            
            # Load document
            doc = Document(docx_file)
            
            # Extract text from all paragraphs
            text_content = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_content.append(paragraph.text)
            
            # Join paragraphs with newlines
            full_text = "\n".join(text_content)
            
            if not full_text.strip():
                raise Exception("No text found in Word document")
                
            return full_text
            
        except Exception as e:
            raise Exception(f"DOCX processing error: {str(e)}")
    
    @staticmethod
    def _extract_from_txt(file_content: bytes) -> str:
        """
        Extract text from plain text file.
        
        Learning Concept: Text Encoding
        - Text files can have different encodings (UTF-8, UTF-16, etc.)
        - Try common encodings if one fails
        - Handle special characters properly
        """
        try:
            # Try UTF-8 first (most common)
            try:
                text = file_content.decode('utf-8')
            except UnicodeDecodeError:
                # Fallback to other common encodings
                try:
                    text = file_content.decode('utf-16')
                except UnicodeDecodeError:
                    text = file_content.decode('latin-1')
            
            if not text.strip():
                raise Exception("Text file is empty")
                
            return text.strip()
            
        except Exception as e:
            raise Exception(f"Text file processing error: {str(e)}")

# Helper function for easy importing
async def parse_resume_file(file: UploadFile) -> str:
    """
    Convenience function to extract text from resume file.
    
    Backend Engineering Concept: Facade Pattern
    - Provides simple interface to complex subsystem
    - Hides implementation details from calling code
    - Makes the service easier to use
    """
    return await FileParser.extract_text_from_file(file)