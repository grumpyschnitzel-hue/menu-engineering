'use client'

import { useMemo } from 'react'
import { MenuItem, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/types'
import { analyzeChoiceArchitecture } from '@/lib/psychology'

interface Props {
  items: MenuItem[]
}

export default function ChoiceAlerts({ items }: Props) {
  const alerts = useMemo(() => analyzeChoiceArchitecture(items), [items])

  if (alerts.length === 0) {
    return (
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-2">Choice Architecture</h3>
        <p className="text-sm text-green-400">
          ✓ All categories are within the 7-item threshold. No decision paralysis risk.
        </p>
        <p className="text-xs text-steel mt-2">
          Research: Iyengar & Lepper found too many choices reduces purchase decisions by 90%.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold uppercase">Choice Architecture Alerts</h3>
      <p className="text-xs text-steel">
        Research: Categories with 7+ items cause decision paralysis (Iyengar &amp; Lepper, 2000)
      </p>
      {alerts.map(alert => (
        <div
          key={alert.category}
          className={`card border-l-4 ${
            alert.severity === 'critical'
              ? 'border-l-red-500 bg-red-900/10'
              : 'border-l-yellow-500 bg-yellow-900/10'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {alert.severity === 'critical' ? '🚨 Critical' : '⚠️ Warning'}
              </span>
              <h4 className="font-display text-base font-bold uppercase mt-1">{alert.category}</h4>
            </div>
            <div className="text-right">
              <span className={`font-display text-2xl font-bold ${
                alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {alert.itemCount}
              </span>
              <span className="text-xs text-steel block">items (max 7)</span>
            </div>
          </div>

          <p className="text-sm text-white/80 mb-4">{alert.message}</p>

          {alert.cutRecommendations.length > 0 && (
            <div>
              <div className="text-xs font-bold text-steel uppercase tracking-wider mb-2">
                Consider Removing:
              </div>
              <div className="space-y-2">
                {alert.cutRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-navy-light">
                    <span className="classification-badge text-xs" style={{
                      backgroundColor: `${CLASSIFICATION_COLORS[rec.item.classification]}20`,
                      color: CLASSIFICATION_COLORS[rec.item.classification],
                    }}>
                      {CLASSIFICATION_LABELS[rec.item.classification]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">{rec.item.name}</span>
                      <p className="text-xs text-steel truncate">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
