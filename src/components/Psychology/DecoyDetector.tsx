'use client'

import { useMemo } from 'react'
import { MenuItem } from '@/lib/types'
import { analyzeDecoys } from '@/lib/psychology'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  items: MenuItem[]
}

export default function DecoyDetector({ items }: Props) {
  const analyses = useMemo(() => analyzeDecoys(items), [items])

  const totalOpportunities = analyses.reduce((sum, a) => sum + a.opportunities.length, 0)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Decoy Pricing Detector</h3>
        <p className="text-xs text-steel mt-1">
          Research: When a slightly inferior option is priced close to a target, customers upgrade. The &quot;decoy&quot; makes the target look like the smart choice.
        </p>
      </div>

      {totalOpportunities === 0 ? (
        <div className="card">
          <p className="text-sm text-steel mb-2">No active decoy patterns detected in your menu.</p>
          <p className="text-xs text-steel">
            To create a decoy effect: price a mid-tier item within 10-15% of your target high-margin item.
            Customers see the small price gap and upgrade to the &quot;better deal.&quot;
          </p>
        </div>
      ) : (
        analyses.filter(a => a.opportunities.length > 0).map(analysis => (
          <div key={analysis.category} className="card">
            <h4 className="font-display text-sm font-bold uppercase text-gold mb-3">{analysis.category}</h4>
            <div className="space-y-3">
              {analysis.opportunities.map((opp, i) => {
                const effectivenessColor = opp.effectiveness === 'strong'
                  ? 'text-green-400 bg-green-900/20 border-green-700/30'
                  : opp.effectiveness === 'moderate'
                    ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30'
                    : 'text-orange-400 bg-orange-900/20 border-orange-700/30'

                return (
                  <div key={i} className="p-4 rounded-lg bg-navy-light border border-navy-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${effectivenessColor}`}>
                        {opp.effectiveness} effect
                      </span>
                      <span className="text-xs text-steel">
                        {opp.priceGapPercent.toFixed(0)}% price gap
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 p-2 rounded bg-navy-card border border-navy-border text-center">
                        <div className="text-xs text-steel uppercase mb-1">Decoy</div>
                        <div className="text-sm font-medium text-white">{opp.decoyItem.name}</div>
                        <div className="text-lg font-display font-bold text-steel">{formatCurrency(opp.decoyItem.menuPrice)}</div>
                      </div>
                      <div className="text-gold text-lg">→</div>
                      <div className="flex-1 p-2 rounded bg-gold/5 border border-gold/20 text-center">
                        <div className="text-xs text-gold uppercase mb-1">Target (Upgrade)</div>
                        <div className="text-sm font-medium text-white">{opp.targetItem.name}</div>
                        <div className="text-lg font-display font-bold text-gold">{formatCurrency(opp.targetItem.menuPrice)}</div>
                      </div>
                    </div>

                    <p className="text-xs text-steel">{opp.explanation}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {analyses.filter(a => a.recommendation).map(a => (
        <div key={a.category} className="p-3 rounded-lg bg-navy-light border border-navy-border">
          <span className="text-xs font-bold text-steel uppercase">{a.category}:</span>
          <p className="text-xs text-steel mt-1">{a.recommendation}</p>
        </div>
      ))}
    </div>
  )
}
