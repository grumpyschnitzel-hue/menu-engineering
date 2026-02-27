'use client'

import { useState, useMemo, useCallback } from 'react'
import { MenuItem } from '@/lib/types'
import { calculateMenuHealth } from '@/lib/psychology'

interface Props {
  items: MenuItem[]
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  layout: { label: 'Layout & Structure', icon: '📐' },
  pricing: { label: 'Pricing Strategy', icon: '💰' },
  descriptions: { label: 'Menu Descriptions', icon: '✍️' },
  psychology: { label: 'Psychology & Nudges', icon: '🧠' },
  data: { label: 'Data & Review', icon: '📊' },
}

export default function MenuHealthChecklist({ items }: Props) {
  const baseHealth = useMemo(() => calculateMenuHealth(items), [items])

  // Track manual overrides for non-auto-scored items
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({})

  const toggleManual = useCallback((id: string) => {
    setManualChecks(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Merge auto-scored with manual overrides
  const healthItems = useMemo(() => {
    return baseHealth.items.map(item => ({
      ...item,
      passed: item.autoScored ? item.passed : (manualChecks[item.id] ?? false),
    }))
  }, [baseHealth.items, manualChecks])

  const totalScore = healthItems.filter(i => i.passed).length
  const maxScore = healthItems.length
  const percentage = Math.round((totalScore / maxScore) * 100)

  const scoreColor = percentage >= 70 ? 'text-green-400' : percentage >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = percentage >= 70 ? 'bg-green-900/20 border-green-800' : percentage >= 40 ? 'bg-yellow-900/20 border-yellow-800' : 'bg-red-900/20 border-red-800'

  // Group items by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof healthItems> = {}
    for (const item of healthItems) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [healthItems])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Menu Health Checklist</h3>
        <p className="text-xs text-steel mt-1">
          15-point audit covering layout, pricing, descriptions, psychology, and data habits. Auto-scored items update from your data. Toggle manual items as you implement them.
        </p>
      </div>

      {/* Overall Score */}
      <div className={`card border ${scoreBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-steel uppercase tracking-wider">Menu Health Score</div>
            <div className={`font-display text-4xl font-bold ${scoreColor}`}>
              {percentage}%
            </div>
            <div className="text-sm text-steel">
              {totalScore} of {maxScore} checks passed
            </div>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1A2D4D"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={percentage >= 70 ? '#22C55E' : percentage >= 40 ? '#EAB308' : '#EF4444'}
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-display text-sm font-bold ${scoreColor}`}>{totalScore}/{maxScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Groups */}
      {Object.entries(grouped).map(([category, categoryItems]) => {
        const catConfig = CATEGORY_LABELS[category] || { label: category, icon: '📋' }
        const catPassed = categoryItems.filter(i => i.passed).length

        return (
          <div key={category} className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-sm font-bold uppercase">
                {catConfig.icon} {catConfig.label}
              </h4>
              <span className="text-xs text-steel">
                {catPassed}/{categoryItems.length} passed
              </span>
            </div>
            <div className="space-y-2">
              {categoryItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    item.passed ? 'bg-green-900/10' : 'bg-navy-light'
                  } ${!item.autoScored ? 'cursor-pointer hover:bg-navy-light/80' : ''}`}
                  onClick={() => { if (!item.autoScored) toggleManual(item.id) }}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center ${
                    item.passed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-navy-border bg-navy-card'
                  }`}>
                    {item.passed && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${item.passed ? 'text-green-400' : 'text-white'}`}>
                        {item.label}
                      </span>
                      {item.autoScored && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400">
                          auto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-steel mt-0.5">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
