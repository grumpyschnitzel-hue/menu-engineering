'use client'

import { useMemo } from 'react'
import { MenuItem, PlacementZone, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/types'
import { recommendPlacements } from '@/lib/psychology'

interface Props {
  items: MenuItem[]
}

const ZONE_CONFIG: Record<PlacementZone, { label: string; icon: string; color: string }> = {
  'golden-center': { label: 'Golden Center', icon: '⭐', color: '#D4AF37' },
  'golden-top-right': { label: 'Top Right', icon: '↗️', color: '#D4AF37' },
  'golden-top-left': { label: 'Top Left', icon: '↖️', color: '#D4AF37' },
  'first-in-category': { label: 'First Position', icon: '🥇', color: '#3B82F6' },
  'last-in-category': { label: 'Last Position', icon: '🔚', color: '#8B5CF6' },
  'middle': { label: 'Middle', icon: '📍', color: '#6B7280' },
  'bottom': { label: 'Bottom', icon: '⬇️', color: '#6B7280' },
  'remove': { label: 'Remove', icon: '❌', color: '#EF4444' },
}

export default function PlacementAdvisor({ items }: Props) {
  const categoryPlacements = useMemo(() => recommendPlacements(items), [items])

  if (categoryPlacements.length === 0) {
    return (
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-2">Menu Placement</h3>
        <p className="text-sm text-steel">Add menu items to see placement recommendations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Golden Triangle Placement</h3>
        <p className="text-xs text-steel mt-1">
          Research: Eye-tracking studies show diners scan menus in a &quot;Golden Triangle&quot; — center first, then top-right, then top-left. Place high-margin items there.
        </p>
      </div>

      {/* Visual Legend */}
      <div className="card">
        <div className="text-xs font-bold text-steel uppercase tracking-wider mb-3">Menu Scan Pattern</div>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
          <div className="p-2 rounded bg-gold/10 border border-gold/30 text-center">
            <div className="text-xs text-gold">↖️ 3rd</div>
          </div>
          <div className="p-2 rounded bg-gold/20 border border-gold/50 text-center">
            <div className="text-xs text-gold font-bold">⭐ 1st</div>
          </div>
          <div className="p-2 rounded bg-gold/10 border border-gold/30 text-center">
            <div className="text-xs text-gold">↗️ 2nd</div>
          </div>
          <div className="col-span-3 p-2 rounded bg-navy-light border border-navy-border text-center">
            <div className="text-xs text-steel">Rest of menu ↓</div>
          </div>
        </div>
      </div>

      {categoryPlacements.map(cp => (
        <div key={cp.category} className="card">
          <h4 className="font-display text-sm font-bold uppercase text-gold mb-3">{cp.category}</h4>
          <div className="space-y-2">
            {cp.placements.map((p, i) => {
              const zone = ZONE_CONFIG[p.zone]
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-navy-light">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${zone.color}15`, border: `1px solid ${zone.color}40` }}
                  >
                    {zone.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{p.item.name}</span>
                      <span className="classification-badge text-xs" style={{
                        backgroundColor: `${CLASSIFICATION_COLORS[p.item.classification]}20`,
                        color: CLASSIFICATION_COLORS[p.item.classification],
                      }}>
                        {CLASSIFICATION_LABELS[p.item.classification]}
                      </span>
                    </div>
                    <p className="text-xs text-steel truncate">{p.reason}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-bold uppercase px-2 py-1 rounded" style={{ color: zone.color }}>
                      {zone.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
