'use client'

import { useMemo } from 'react'
import { MenuItem, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/types'
import { recommendBadges } from '@/lib/psychology'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  items: MenuItem[]
}

export default function SocialProofBadges({ items }: Props) {
  const categoryBadges = useMemo(() => recommendBadges(items), [items])

  const totalBadges = categoryBadges.reduce((sum, cb) => sum + cb.badges.length, 0)

  if (totalBadges === 0) {
    return (
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-2">Social Proof Badges</h3>
        <p className="text-sm text-steel">No badge recommendations available. Add more items to see suggestions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Social Proof Badges</h3>
        <p className="text-xs text-steel mt-1">
          Research: Social proof badges increase orders by 23%. Max 2 per category to avoid dilution.
        </p>
      </div>

      {categoryBadges.filter(cb => cb.badges.length > 0).map(cb => (
        <div key={cb.category} className="card">
          <h4 className="font-display text-sm font-bold uppercase text-gold mb-3">{cb.category}</h4>
          <div className="space-y-3">
            {cb.badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-navy-light border border-navy-border">
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  badge.badgeType === 'most-popular'
                    ? 'bg-gold/20 text-gold'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {badge.badgeType === 'most-popular' ? '\uD83D\uDD25' : '\uD83D\uDC68\u200D\uD83C\uDF73'} {badge.badgeText}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{badge.item.name}</span>
                    <span className="classification-badge text-xs" style={{
                      backgroundColor: `${CLASSIFICATION_COLORS[badge.item.classification]}20`,
                      color: CLASSIFICATION_COLORS[badge.item.classification],
                    }}>
                      {CLASSIFICATION_LABELS[badge.item.classification]}
                    </span>
                  </div>
                  <p className="text-xs text-steel mt-0.5">{badge.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white">{formatCurrency(badge.item.menuPrice)}</div>
                  <div className="text-xs text-steel">{formatCurrency(badge.item.contributionMargin)} margin</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-3 rounded-lg bg-gold/5 border border-gold/20">
        <p className="text-xs text-gold">
          {'\uD83D\uDCA1'} Print these badges next to the item name on your physical menu. Keep it to 1-2 per category — overuse kills the effect.
        </p>
      </div>
    </div>
  )
}
