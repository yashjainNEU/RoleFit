// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types for API responses
export interface AnalysisResult {
  success: boolean
  analysis: {
    ats_score: number
    strengths: string[]
    improvements: string[]
    missing_keywords: string[]
    keyword_matches: string[]
    overall_feedback: string
    confidence_score: number
  }
  file_info: {
    filename: string
    file_type: string
    size_mb: number
    text_length: number
    processed_at: string
  }
  metadata: {
    api_version: string
    analysis_type: string
  }
}

export interface ApiError {
  detail: string
}

// API service class
export class ResumeAnalyzerAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Analyze resume against job description
   */
  async analyzeResume(resumeFile: File, jobDescription: string): Promise<AnalysisResult> {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('job_description', jobDescription)

      // Make API call
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for multipart
      })

      // Check if response is ok
      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse successful response
      const result: AnalysisResult = await response.json()
      return result

    } catch (error) {
      // Handle network errors, parsing errors, etc.
      if (error instanceof Error) {
        throw new Error(`Analysis failed: ${error.message}`)
      }
      throw new Error('Analysis failed: Unknown error occurred')
    }
  }

  /**
   * Test file upload and text extraction
   */
  async testFileUpload(file: File): Promise<any> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${this.baseUrl}/upload-test`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload test failed')
      }

      return await response.json()

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Upload test failed: ${error.message}`)
      }
      throw new Error('Upload test failed: Unknown error')
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API connection failed: ${error.message}`)
      }
      throw new Error('API connection failed')
    }
  }
}

// Export singleton instance
export const apiService = new ResumeAnalyzerAPI()