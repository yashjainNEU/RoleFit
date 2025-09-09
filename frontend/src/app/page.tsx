// src/app/page.tsx
'use client'

import { useState } from 'react'
import { Upload, FileText, Brain, CheckCircle } from 'lucide-react'

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setResumeFile(file)
    }
  }

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      alert('Please upload a resume and enter a job description')
      return
    }

    setIsAnalyzing(true)
    
    // Simulate analysis for now
    setTimeout(() => {
      setIsAnalyzing(false)
      alert('Analysis complete! (Backend coming next)')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">RoleFit</h1>
            <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
              AI-Powered
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Optimize Your Resume with AI
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get instant ATS compatibility scores and personalized improvement suggestions 
            powered by advanced AI analysis.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-4">
                <FileText className="inline h-5 w-5 mr-2" />
                Upload Your Resume
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-800/30">
                <input
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-10 w-10 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOC, DOCX (Max 10MB)
                  </span>
                </label>
              </div>
              
              {resumeFile && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500/40 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-green-300">
                      {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-4">
                <Brain className="inline h-5 w-5 mr-2" />
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here...

Example:
We are looking for a Frontend Developer with 3+ years of experience in React, JavaScript, and modern web technologies. The ideal candidate should have experience with TypeScript, Next.js, and responsive design principles."
                className="w-full h-48 p-4 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none bg-gray-800/50 text-gray-100 placeholder-gray-400"
              />
              <div className="mt-2 text-xs text-gray-500">
                {jobDescription.length} characters
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="text-center mt-8">
            <button
              onClick={handleAnalyze}
              disabled={!resumeFile || !jobDescription.trim() || isAnalyzing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isAnalyzing ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Resume...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Analyze with AI</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
            <div className="text-blue-400 mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">ATS Compatibility</h3>
            <p className="text-gray-300 text-sm">
              Get a detailed score on how well your resume passes through Applicant Tracking Systems.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
            <div className="text-purple-400 mb-4">
              <Brain className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">AI-Powered Analysis</h3>
            <p className="text-gray-300 text-sm">
              Advanced AI analyzes your resume against job requirements and industry standards.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
            <div className="text-green-400 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Actionable Insights</h3>
            <p className="text-gray-300 text-sm">
              Receive specific, actionable suggestions to improve your resume's effectiveness.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}