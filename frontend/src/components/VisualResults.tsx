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

// Circular Progress — muted, brand-aligned
const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 8
}: {
  percentage: number
  size?: number
  strokeWidth?: number
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 300)
    return () => clearTimeout(timer)
  }, [percentage])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference

  // Use brand-accent (violet/indigo) with soft fallbacks
  const getColor = () => {
    if (percentage >= 80) return '#8b5cf6' // violet-500
    if (percentage >= 60) return '#6366f1' // indigo-500
    return '#f87171' // rose-400 (muted red for low score)
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#475569"          // slate-600
          strokeWidth={strokeWidth}
          fill="none"
        />
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
          <div className="text-3xl font-bold text-slate-100">{animatedPercentage}</div>
          <div className="text-xs text-slate-400">ATS Score</div>
        </div>
      </div>
    </div>
  )
}

// Bar Chart — toned down bars
const BarChart = ({
  data,
  maxValue = 10
}: {
  data: { label: string; value: number; color: string }[]
  maxValue?: number
}) => {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 500)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300 font-medium">{item.label}</span>
            <span className="text-slate-400">{item.value}</span>
          </div>
          <div className="w-full bg-slate-700/40 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${item.color}`}
              style={{ width: animated ? `${(item.value / maxValue) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skill Match — subtle fill
const SkillMatchRadar = ({ matched, missing }: { matched: string[]; missing: string[] }) => {
  const total = matched.length + missing.length
  const matchPercentage = total > 0 ? (matched.length / total) * 100 : 0
  return (
    <div className="relative">
      <div className="w-32 h-32 rounded-full border-4 border-slate-600/40 relative overflow-hidden bg-slate-800/30">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-600/60 to-indigo-500/50 transition-all duration-1000 ease-out"
          style={{ height: `${matchPercentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-100">{matched.length}</div>
            <div className="text-xs text-slate-300">Matched</div>
          </div>
        </div>
      </div>
      <div className="text-center mt-2 space-y-1">
        <div className="text-violet-300 text-sm">{matched.length} Keywords Found</div>
        <div className="text-rose-300 text-sm">{missing.length} Missing</div>
      </div>
    </div>
  )
}

// Confidence — violet/indigo gradient instead of bright amber
const ConfidenceMeter = ({ confidence }: { confidence: number }) => {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 800)
    return () => clearTimeout(t)
  }, [])
  const confidencePercentage = confidence * 100
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4 text-violet-300" />
        <span className="text-sm text-slate-300 font-medium">Analysis Confidence</span>
      </div>
      <div className="relative">
        <div className="w-full bg-slate-700/40 rounded-full h-3">
          <div
            className="h-3 bg-gradient-to-r from-violet-600/70 to-indigo-500/70 rounded-full transition-all duration-1000 ease-out"
            style={{ width: animated ? `${confidencePercentage}%` : '0%' }}
          />
        </div>
        <div className="text-right text-sm text-violet-300 mt-1 font-medium">
          {Math.round(confidencePercentage)}%
        </div>
      </div>
    </div>
  )
}

export default function VisualResults({ result }: VisualResultsProps) {
  const { analysis } = result

  // Softer bar colors aligned to theme
  const barData = [
    { label: 'Strengths', value: analysis.strengths.length, color: 'bg-emerald-400/60' },
    { label: 'Improvements', value: analysis.improvements.length, color: 'bg-indigo-400/60' },
    { label: 'Missing Keywords', value: analysis.missing_keywords.length, color: 'bg-rose-400/60' },
    { label: 'Matched Keywords', value: analysis.keyword_matches.length, color: 'bg-violet-400/60' }
  ]

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-violet-300'
    if (score >= 60) return 'text-indigo-300'
    if (score >= 40) return 'text-slate-300'
    return 'text-rose-300'
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* ATS Score */}
          <div className="text-center">
            <CircularProgress percentage={analysis.ats_score} size={140} />
            <div className={`text-xl font-semibold mt-4 ${getScoreColor(analysis.ats_score)}`}>
              {getScoreLabel(analysis.ats_score)}
            </div>
            <div className="text-slate-400 text-sm mt-1">ATS Compatibility Rating</div>
          </div>

          {/* Skill Match */}
          <div className="text-center">
            <SkillMatchRadar matched={analysis.keyword_matches} missing={analysis.missing_keywords} />
          </div>

          {/* Confidence + totals */}
          <div className="space-y-4">
            <ConfidenceMeter confidence={analysis.confidence_score} />
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/40">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-slate-100">
                  {analysis.keyword_matches.length + analysis.missing_keywords.length}
                </div>
                <div className="text-xs text-slate-400">Total Keywords Analyzed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown + Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-violet-300/90" />
            Analysis Breakdown
          </h3>
          <BarChart data={barData} maxValue={Math.max(...barData.map((d) => d.value), 1)} />
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/15 border border-emerald-400/20 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-300/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-200">{analysis.strengths.length}</div>
              <div className="text-xs text-emerald-200/70">Strengths</div>
            </div>

            <div className="bg-indigo-900/15 border border-indigo-400/20 rounded-lg p-4 text-center">
              <Lightbulb className="h-8 w-8 text-indigo-300/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-200">{analysis.improvements.length}</div>
              <div className="text-xs text-indigo-200/70">Improvements</div>
            </div>

            <div className="bg-violet-900/15 border border-violet-400/20 rounded-lg p-4 text-center">
              <Target className="h-8 w-8 text-violet-300/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-violet-200">{analysis.keyword_matches.length}</div>
              <div className="text-xs text-violet-200/70">Keywords Found</div>
            </div>

            <div className="bg-rose-900/15 border border-rose-400/20 rounded-lg p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-rose-300/80 mx-auto mb-2" />
              <div className="text-2xl font-bold text-rose-200">{analysis.missing_keywords.length}</div>
              <div className="text-xs text-rose-200/70">Missing Keywords</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-emerald-300/80" />
            <h3 className="text-lg font-semibold text-slate-100">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-300/70 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300 text-sm leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="h-6 w-6 text-indigo-300/80" />
            <h3 className="text-lg font-semibold text-slate-100">Improvements</h3>
          </div>
          <ul className="space-y-3">
            {analysis.improvements.map((it, i) => (
              <li key={i} className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-indigo-300/70 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300 text-sm leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Keywords */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Missing Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((k, i) => (
              <span
                key={i}
                className="bg-rose-900/15 text-rose-200 px-3 py-2 rounded-full text-sm border border-rose-400/20 hover:bg-rose-900/25 transition-colors"
              >
                {k}
              </span>
            ))}
            {analysis.missing_keywords.length === 0 && (
              <span className="text-slate-400 text-sm italic">No missing keywords identified</span>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Matched Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keyword_matches.map((k, i) => (
              <span
                key={i}
                className="bg-violet-900/15 text-violet-200 px-3 py-2 rounded-full text-sm border border-violet-400/20 hover:bg-violet-900/25 transition-colors"
              >
                {k}
              </span>
            ))}
            {analysis.keyword_matches.length === 0 && (
              <span className="text-slate-400 text-sm italic">No keyword matches found</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">AI Analysis Summary</h3>
        <p className="text-slate-300 leading-relaxed text-base">{analysis.overall_feedback}</p>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-400">
            <div>
              <span className="font-medium">File:</span> {result.file_info.filename}
            </div>
            <div>
              <span className="font-medium">Analysis:</span> {result.metadata.analysis_type}
            </div>
            <div>
              <span className="font-medium">Processed:</span>{' '}
              {new Date(result.file_info.processed_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
