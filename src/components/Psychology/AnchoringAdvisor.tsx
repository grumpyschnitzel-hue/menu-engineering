'use client'

import { useMemo } from 'react'
import { MenuItem } from '@/lib/types'
import { analyzeAnchoring } from '@/lib/psychology'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  items: MenuItem[]
}

export default function AnchoringAdvisor({ items }: Props) {
  const analyses = useMemo(() => analyzeAnchoring(items), [items])

  if (analyses.length === 0) {
    return (
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-2">Price Anchoring</h3>
        <p className="text-sm text-steel">Add menu items to see anchoring analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Price Anchoring Advisor</h3>
        <p className="text-xs text-steel mt-1">
          Research: A premium anchor item increases average check by 6.8% (NRA). The highest-priced item makes others feel like a deal.
        </p>
      </div>

      {analyses.map(analysis => (
        <div key={analysis.category} className="card">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-display text-sm font-bold uppercase text-gold">{analysis.category}</h4>
            {analysis.hasEffectiveAnchor ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400 font-medium">
                ✓ Effective Anchor
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 font-medium">
                ⚠ Weak/No Anchor
              </span>
            )}
          </div>

          {analysis.warning && (
            <div className="p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/30 mb-4">
              <p className="text-sm text-yellow-400">{analysis.warning}</p>
            </div>
          )}

          {analysis.anchorItem && (
            <div className="p-3 rounded-lg bg-gold/5 border border-gold/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gold uppercase tracking-wider font-bold">Anchor Item</span>
                  <div className="text-sm font-medium text-white mt-0.5">{analysis.anchorItem.name}</div>
                </div>
                <div className="font-display text-xl font-bold text-gold">
                  {formatCurrency(analysis.anchorItem.menuPrice)}
                </div>
              </div>
            </div>
          )}

          {analysis.targetItems.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-steel uppercase tracking-wider">Contrast Effect</div>
              {analysis.targetItems.map((target, i) => {
                const strengthColor = target.contrastPercent >= 30
                  ? 'text-green-400'
                  : target.contrastPercent >= 20
                    ? 'text-yellow-400'
                    : 'text-red-400'

                const barWidth = Math.min(100, target.contrastPercent * 2)

                return (
                  <div key={i} className="p-2 rounded-lg bg-navy-light">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{target.item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{formatCurrency(target.item.menuPrice)}</span>
                        <span className={`text-xs font-bold ${strengthColor}`}>
                          -{target.contrastPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-navy-card rounded-full h-1.5 mb-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          target.contrastPercent >= 30 ? 'bg-green-500' : target.contrastPercent >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-xs text-steel">{target.recommendation}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
