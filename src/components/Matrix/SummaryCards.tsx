'use client'

import { Classification, ClassificationSummary, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  summaries: ClassificationSummary[]
  activeFilter: Classification | null
  onFilterChange: (classification: Classification | null) => void
}

export default function SummaryCards({ summaries, activeFilter, onFilterChange }: Props) {
  function handleClick(classification: Classification) {
    onFilterChange(activeFilter === classification ? null : classification)
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaries.map(summary => {
        const isActive = activeFilter === summary.classification
        const label = CLASSIFICATION_LABELS[summary.classification]
        const [emoji, name] = label.split(' ')
        return (
          <button
            key={summary.classification}
            aria-label={`Filter by ${name}: ${summary.count} items, ${formatCurrency(summary.totalProfit)} profit${isActive ? ' (active filter)' : ''}`}
            aria-pressed={isActive}
            className={`card relative overflow-hidden text-left transition-all cursor-pointer ${
              isActive ? 'ring-2 ring-offset-2 ring-offset-navy' : 'hover:scale-[1.02]'
            } ${activeFilter && !isActive ? 'opacity-50' : ''}`}
            style={{
              borderTopColor: CLASSIFICATION_COLORS[summary.classification],
              borderTopWidth: 3,
              '--tw-ring-color': CLASSIFICATION_COLORS[summary.classification],
            } as React.CSSProperties}
            onClick={() => handleClick(summary.classification)}
          >
            <div className="text-2xl mb-1" aria-hidden="true">
              {emoji}
            </div>
            <div className="font-display text-sm font-bold uppercase text-white mb-2">
              {name}
            </div>
            <div className="font-display text-2xl font-bold text-white">
              {summary.count}
              <span className="text-sm text-steel font-body ml-1">items</span>
            </div>
            <div className="text-sm mt-1" style={{ color: CLASSIFICATION_COLORS[summary.classification] }}>
              {formatCurrency(summary.totalProfit)} profit
            </div>
          </button>
        )
      })}
    </div>
  )
}
