'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { MenuItem, MatrixBenchmarks, CLASSIFICATION_COLORS } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'

interface Props {
  items: MenuItem[]
  benchmarks: MatrixBenchmarks
}

interface TooltipPayloadItem {
  payload: MenuItem
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload

  return (
    <div className="bg-navy-card border border-navy-border rounded-lg p-3 shadow-xl text-sm">
      <p className="font-semibold text-white mb-1">{item.name}</p>
      <p className="text-steel">Category: {item.category}</p>
      <p className="text-steel">Margin: {formatCurrency(item.contributionMargin)}</p>
      <p className="text-steel">Sales Mix: {formatPercent(item.salesMixPercent)}</p>
      <p className="text-steel">Total Profit: {formatCurrency(item.totalProfit)}</p>
    </div>
  )
}

export default function ScatterPlotChart({ items, benchmarks }: Props) {
  if (items.length === 0) return null

  const data = items.map(item => ({
    ...item,
    x: item.contributionMargin,
    y: item.salesMixPercent,
  }))

  return (
    <div className="card">
      <h3 className="font-display text-lg font-bold uppercase mb-4">Menu Matrix</h3>
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-steel">
        <div className="text-right pr-4">🧩 Puzzle <span className="text-classification-puzzle">(high margin, low sales)</span></div>
        <div>⭐ Star <span className="text-classification-star">(high margin, high sales)</span></div>
        <div className="text-right pr-4">🐕 Dog <span className="text-classification-dog">(low margin, low sales)</span></div>
        <div>🐴 Plowhorse <span className="text-classification-plowhorse">(low margin, high sales)</span></div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D4D" />
          <XAxis
            type="number"
            dataKey="x"
            name="Contribution Margin"
            unit="$"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            label={{ value: 'Contribution Margin ($)', position: 'bottom', fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Sales Mix"
            unit="%"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            label={{ value: 'Sales Mix (%)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={benchmarks.avgContributionMargin}
            stroke="#D4AF37"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={benchmarks.avgSalesMixPercent}
            stroke="#D4AF37"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
          <Scatter data={data} fill="#D4AF37">
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={CLASSIFICATION_COLORS[entry.classification]}
                r={6}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
