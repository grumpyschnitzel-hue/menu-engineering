'use client'

import { useState, useMemo } from 'react'
import { MenuItem, SimulationAction } from '@/lib/types'
import { simulateChange, RESEARCH_DEFAULTS } from '@/lib/psychology'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  items: MenuItem[]
}

const ACTION_OPTIONS: { value: SimulationAction; label: string; description: string }[] = [
  { value: 'price-change', label: 'Price Change', description: 'What if you raise or lower the price?' },
  { value: 'item-removal', label: 'Item Removal', description: 'What if you remove this item from the menu?' },
  { value: 'repositioning', label: 'Repositioning', description: 'Move to a prime menu position (+20% orders)' },
  { value: 'description-upgrade', label: 'Description Upgrade', description: 'Upgrade to descriptive labels (+27% sales)' },
]

export default function RevenueSimulator({ items }: Props) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [action, setAction] = useState<SimulationAction>('price-change')
  const [newPrice, setNewPrice] = useState('')
  const [customPercent, setCustomPercent] = useState('')

  const selectedItem = items.find(i => i.id === selectedItemId)

  const result = useMemo(() => {
    if (!selectedItemId) return null
    return simulateChange(items, {
      action,
      itemId: selectedItemId,
      newPrice: action === 'price-change' && newPrice ? parseFloat(newPrice) : undefined,
      salesChangePercent: customPercent ? parseFloat(customPercent) / 100 : undefined,
    })
  }, [items, selectedItemId, action, newPrice, customPercent])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Revenue Impact Simulator</h3>
        <p className="text-xs text-steel mt-1">
          Model &quot;what if&quot; scenarios using research-backed defaults. See how changes impact your monthly and annual profit.
        </p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-steel uppercase tracking-wider mb-1">Select Item</label>
              <select
                className="w-full px-3 py-2 bg-navy-light border border-navy-border rounded-lg text-white text-sm focus:outline-none focus:border-gold transition-colors"
                value={selectedItemId}
                onChange={e => { setSelectedItemId(e.target.value); setNewPrice(''); setCustomPercent('') }}
              >
                <option value="">— Choose an item —</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(item.menuPrice)}) — {item.classification}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-steel uppercase tracking-wider mb-2">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {ACTION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      action === opt.value
                        ? 'border-gold bg-gold/10 text-white'
                        : 'border-navy-border bg-navy-light text-steel hover:text-white hover:border-gold/50'
                    }`}
                    onClick={() => { setAction(opt.value); setNewPrice(''); setCustomPercent('') }}
                  >
                    <div className="text-xs font-bold uppercase">{opt.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {action === 'price-change' && selectedItem && (
              <div>
                <label className="block text-xs font-medium text-steel uppercase tracking-wider mb-1">
                  New Price (current: {formatCurrency(selectedItem.menuPrice)})
                </label>
                <input
                  type="number"
                  step="0.50"
                  className="w-full px-3 py-2 bg-navy-light border border-navy-border rounded-lg text-white text-sm focus:outline-none focus:border-gold transition-colors"
                  placeholder="e.g. 32.00"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                />
              </div>
            )}

            {(action === 'repositioning' || action === 'description-upgrade') && (
              <div>
                <label className="block text-xs font-medium text-steel uppercase tracking-wider mb-1">
                  Custom Sales Increase % (optional)
                </label>
                <input
                  type="number"
                  step="1"
                  className="w-full px-3 py-2 bg-navy-light border border-navy-border rounded-lg text-white text-sm focus:outline-none focus:border-gold transition-colors"
                  placeholder={`Default: ${action === 'repositioning'
                    ? `${(RESEARCH_DEFAULTS.repositioningOrderIncrease * 100).toFixed(0)}%`
                    : `${(RESEARCH_DEFAULTS.descriptionUpgradeSalesIncrease * 100).toFixed(0)}%`}`}
                  value={customPercent}
                  onChange={e => setCustomPercent(e.target.value)}
                />
                <p className="text-xs text-steel mt-1">
                  {action === 'repositioning'
                    ? 'Golden Triangle placement typically boosts orders ~20%'
                    : 'Cornell research: descriptive labels increase sales by 27%'}
                </p>
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            {result ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-navy-light border border-navy-border">
                  <div className="text-xs text-steel uppercase tracking-wider mb-1">Current Monthly Profit</div>
                  <div className="font-display text-xl font-bold text-white">
                    {formatCurrency(result.currentMonthlyProfit)}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  result.monthlyDelta >= 0
                    ? 'border-green-800 bg-green-900/10'
                    : 'border-red-800 bg-red-900/10'
                }`}>
                  <div className="text-xs text-steel uppercase tracking-wider mb-1">Projected Monthly Profit</div>
                  <div className={`font-display text-xl font-bold ${
                    result.monthlyDelta >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(result.projectedMonthlyProfit)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-lg border ${
                    result.monthlyDelta >= 0
                      ? 'border-green-800 bg-green-900/10'
                      : 'border-red-800 bg-red-900/10'
                  }`}>
                    <div className="text-xs text-steel uppercase mb-1">Monthly Impact</div>
                    <div className={`font-display text-lg font-bold ${
                      result.monthlyDelta >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.monthlyDelta >= 0 ? '+' : ''}{formatCurrency(result.monthlyDelta)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    result.annualDelta >= 0
                      ? 'border-gold bg-gold/5'
                      : 'border-red-800 bg-red-900/10'
                  }`}>
                    <div className="text-xs text-steel uppercase mb-1">Annual Impact</div>
                    <div className={`font-display text-lg font-bold ${
                      result.annualDelta >= 0 ? 'text-gold' : 'text-red-400'
                    }`}>
                      {result.annualDelta >= 0 ? '+' : ''}{formatCurrency(result.annualDelta)}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
                  <div className="text-xs text-gold uppercase tracking-wider mb-1">Analysis</div>
                  <p className="text-sm text-white/80">{result.explanation}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-steel text-sm p-8">
                {selectedItemId ? 'Configure the scenario to see projected impact' : 'Select an item to start simulating'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
