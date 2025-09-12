// frontend/src/components/VisualResults.tsx
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Target, Lightbulb, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

interface AnalysisResult {
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

interface VisualResultsProps {
  result: AnalysisResult
}

// Circular Progress Component with refined colors
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8 }: {
  percentage: number
  size?: number
  strokeWidth?: number
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 80) return '#059669' // Emerald-600 (professional green)
    if (percentage >= 60) return '#D97706' // Amber-600 (warm orange)
    return '#DC2626' // Red-600 (professional red)
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{animatedPercentage}</div>
          <div className="text-xs text-gray-400">ATS Score</div>
        </div>
      </div>
    </div>
  )
}

// Refined Bar Chart Component
const BarChart = ({ data, maxValue = 10 }: { data: { label: string, value: number, color: string }[], maxValue?: number }) => {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300 font-medium">{item.label}</span>
            <span className="text-gray-400">{item.value}</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${item.color}`}
              style={{
                width: animated ? `${(item.value / maxValue) * 100}%` : '0%'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Refined Skill Match Radar Component
const SkillMatchRadar = ({ matched, missing }: { matched: string[], missing: string[] }) => {
  const total = matched.length + missing.length
  const matchPercentage = total > 0 ? (matched.length / total) * 100 : 0

  return (
    <div className="relative">
      <div className="w-32 h-32 rounded-full border-4 border-gray-600/50 relative overflow-hidden bg-gray-800/30">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-600/80 to-emerald-500/60 transition-all duration-1000 ease-out"
          style={{ height: `${matchPercentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{matched.length}</div>
            <div className="text-xs text-gray-300">Matched</div>
          </div>
        </div>
      </div>
      <div className="text-center mt-2 space-y-1">
        <div className="text-emerald-400 text-sm">{matched.length} Keywords Found</div>
        <div className="text-rose-400 text-sm">{missing.length} Missing</div>
      </div>
    </div>
  )
}

// Refined Confidence Meter Component
const ConfidenceMeter = ({ confidence }: { confidence: number }) => {
  const [animated, setAnimated] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const confidencePercentage = confidence * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <span className="text-sm text-gray-300 font-medium">Analysis Confidence</span>
      </div>
      <div className="relative">
        <div className="w-full bg-gray-700/50 rounded-full h-3">
          <div
            className="h-3 bg-gradient-to-r from-amber-600/80 to-amber-500/70 rounded-full transition-all duration-1000 ease-out"
            style={{ width: animated ? `${confidencePercentage}%` : '0%' }}
          />
        </div>
        <div className="text-right text-sm text-amber-400 mt-1 font-medium">
          {Math.round(confidencePercentage)}%
        </div>
      </div>
    </div>
  )
}

// Main Visual Results Component with refined styling
export default function VisualResults({ result }: VisualResultsProps) {
  const { analysis } = result

  // Prepare data for visualizations with refined colors
  const barData = [
    { label: 'Strengths', value: analysis.strengths.length, color: 'bg-emerald-500/80' },
    { label: 'Improvements', value: analysis.improvements.length, color: 'bg-amber-500/80' },
    { label: 'Missing Keywords', value: analysis.missing_keywords.length, color: 'bg-rose-500/80' },
    { label: 'Matched Keywords', value: analysis.keyword_matches.length, color: 'bg-blue-500/80' }
  ]

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  return (
    <div className="space-y-8">
      {/* Hero Score Section with refined styling */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Main ATS Score */}
          <div className="text-center">
            <CircularProgress percentage={analysis.ats_score} size={140} />
            <div className={`text-xl font-semibold mt-4 ${getScoreColor(analysis.ats_score)}`}>
              {getScoreLabel(analysis.ats_score)}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              ATS Compatibility Rating
            </div>
          </div>

          {/* Skill Match Visualization */}
          <div className="text-center">
            <SkillMatchRadar 
              matched={analysis.keyword_matches} 
              missing={analysis.missing_keywords} 
            />
          </div>

          {/* Confidence Score */}
          <div className="space-y-4">
            <ConfidenceMeter confidence={analysis.confidence_score} />
            
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-white">
                  {analysis.keyword_matches.length + analysis.missing_keywords.length}
                </div>
                <div className="text-xs text-gray-400">
                  Total Keywords Analyzed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics with refined colors */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Analysis Breakdown Chart */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-400/80" />
            Analysis Breakdown
          </h3>
          <BarChart data={barData} maxValue={Math.max(...barData.map(d => d.value))} />
        </div>

        {/* Quick Stats with refined colors */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-400/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">{analysis.strengths.length}</div>
              <div className="text-xs text-emerald-300/80">Strengths</div>
            </div>
            
            <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-4 text-center">
              <Lightbulb className="h-8 w-8 text-amber-400/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-400">{analysis.improvements.length}</div>
              <div className="text-xs text-amber-300/80">Improvements</div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 text-center">
              <Target className="h-8 w-8 text-blue-400/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{analysis.keyword_matches.length}</div>
              <div className="text-xs text-blue-300/80">Keywords Found</div>
            </div>
            
            <div className="bg-rose-900/20 border border-rose-500/20 rounded-lg p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-rose-400/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-rose-400">{analysis.missing_keywords.length}</div>
              <div className="text-xs text-rose-300/80">Missing Keywords</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Lists with refined styling */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-emerald-400/80" />
            <h3 className="text-lg font-semibold text-white">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-400/70 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="h-6 w-6 text-amber-400/80" />
            <h3 className="text-lg font-semibold text-white">Improvements</h3>
          </div>
          <ul className="space-y-3">
            {analysis.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-amber-400/70 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Keywords Analysis with refined colors */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Missing Keywords */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Missing Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((keyword, index) => (
              <span key={index} className="bg-rose-900/20 text-rose-300/90 px-3 py-2 rounded-full text-sm border border-rose-500/20 hover:bg-rose-900/30 transition-colors">
                {keyword}
              </span>
            ))}
            {analysis.missing_keywords.length === 0 && (
              <span className="text-gray-400 text-sm italic">No missing keywords identified</span>
            )}
          </div>
        </div>

        {/* Matched Keywords */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Matched Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keyword_matches.map((keyword, index) => (
              <span key={index} className="bg-emerald-900/20 text-emerald-300/90 px-3 py-2 rounded-full text-sm border border-emerald-500/20 hover:bg-emerald-900/30 transition-colors">
                {keyword}
              </span>
            ))}
            {analysis.keyword_matches.length === 0 && (
              <span className="text-gray-400 text-sm italic">No keyword matches found</span>
            )}
          </div>
        </div>
      </div>

      {/* Overall Feedback with refined styling */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">AI Analysis Summary</h3>
        <p className="text-gray-300 leading-relaxed text-base">{analysis.overall_feedback}</p>
        
        {/* File Info Footer */}
        <div className="mt-6 pt-6 border-t border-gray-600/50">
          <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-400">
            <div>
              <span className="font-medium">File:</span> {result.file_info.filename}
            </div>
            <div>
              <span className="font-medium">Analysis:</span> {result.metadata.analysis_type}
            </div>
            <div>
              <span className="font-medium">Processed:</span> {new Date(result.file_info.processed_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}