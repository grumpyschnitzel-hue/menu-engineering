'use client'

import { ClassificationSummary, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  summaries: ClassificationSummary[]
}

export default function SummaryCards({ summaries }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaries.map(summary => (
        <div
          key={summary.classification}
          className="card relative overflow-hidden"
          style={{ borderTopColor: CLASSIFICATION_COLORS[summary.classification], borderTopWidth: 3 }}
        >
          <div className="text-2xl mb-1">
            {CLASSIFICATION_LABELS[summary.classification].split(' ')[0]}
          </div>
          <div className="font-display text-sm font-bold uppercase text-white mb-2">
            {CLASSIFICATION_LABELS[summary.classification].split(' ')[1]}
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {summary.count}
            <span className="text-sm text-steel font-body ml-1">items</span>
          </div>
          <div className="text-sm mt-1" style={{ color: CLASSIFICATION_COLORS[summary.classification] }}>
            {formatCurrency(summary.totalProfit)} profit
          </div>
        </div>
      ))}
    </div>
  )
}
