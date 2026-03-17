'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, AlertTriangle, Info } from 'lucide-react'
import { AIRiskScore } from '@/lib/types/ai'

interface RiskScorePanelProps {
  score: AIRiskScore
  onOverride?: (reason: string, notes: string) => void
  showOverrideButton?: boolean
}

export function RiskScorePanel({
  score,
  onOverride,
  showOverrideButton = true,
}: RiskScorePanelProps) {
  const [showFactors, setShowFactors] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideNotes, setOverrideNotes] = useState('')

  const getRiskColor = (value: number) => {
    if (value < 40) return 'text-green-600'
    if (value < 70) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRiskBg = (value: number) => {
    if (value < 40) return 'bg-green-50'
    if (value < 70) return 'bg-amber-50'
    return 'bg-red-50'
  }

  const handleOverride = () => {
    const notesValid = overrideReason === 'OTHER' ? overrideNotes.length >= 50 : overrideNotes.length > 0
    if (overrideReason && notesValid) {
      onOverride?.(overrideReason, overrideNotes)
      setShowOverrideModal(false)
      setOverrideReason('')
      setOverrideNotes('')
    }
  }

  return (
    <Card className={`p-6 ${getRiskBg(score.overall)}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">AI Risk Score</span>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          AI ✦
        </Badge>
      </div>

      {/* Risk Gauge */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          {/* Donut chart representation */}
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted opacity-30"
            />
            {/* Risk indicator */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${(score.overall / 100) * 314} 314`}
              className={getRiskColor(score.overall)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getRiskColor(score.overall)}`}>
              {score.overall}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div className="text-center mb-6">
        <Badge variant="secondary" className="text-xs">
          {score.confidence}% Confidence
        </Badge>
      </div>

      {/* Why This Score Accordion */}
      <button
        onClick={() => setShowFactors(!showFactors)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition text-sm font-medium mb-3"
      >
        <span>Why this score?</span>
        <ChevronDown className={`w-4 h-4 transition ${showFactors ? 'rotate-180' : ''}`} />
      </button>

      {showFactors && (
        <div className="space-y-3 mb-6 pl-3 border-l-2 border-border">
          {score.factors.map((factor, idx) => (
            <div key={idx} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{factor.name}</span>
                <span className={`text-xs font-semibold ${
                  factor.impact === 'INCREASES' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {factor.impact === 'INCREASES' ? '↑ Increases' : '↓ Decreases'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      factor.impact === 'INCREASES' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${factor.weight * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {(factor.weight * 100).toFixed(0)}%
                </span>
              </div>
              {factor.value && (
                <p className="text-xs text-muted-foreground mt-1">{factor.value}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Override Button */}
      {showOverrideButton && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowOverrideModal(true)}
        >
          Human Override
        </Button>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Override AI Score
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Override Category * (IMP-13)</label>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="">Select category...</option>
                  <option value="GUARANTOR_STRENGTH">Guarantor Strength</option>
                  <option value="COLLATERAL_SECURED">Collateral Secured</option>
                  <option value="BANKING_RELATIONSHIP">Banking Relationship</option>
                  <option value="INCOME_UNDECLARED">Income Undeclared</option>
                  <option value="BOARD_DIRECTION">Board Direction</option>
                  <option value="EXCEPTION_APPROVED">Exception Approved</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Override Narrative * {overrideReason === 'OTHER' ? '(min 50 characters)' : ''}</label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Provide detailed reasoning for this override..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-24"
                />
              </div>

              <p className="text-xs text-muted-foreground">This override is being logged and will be reviewed in the quarterly AI bias audit.</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverrideModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!overrideReason || !overrideNotes || (overrideReason === 'OTHER' && overrideNotes.length < 50)}
                  onClick={handleOverride}
                >
                  Confirm Override
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
