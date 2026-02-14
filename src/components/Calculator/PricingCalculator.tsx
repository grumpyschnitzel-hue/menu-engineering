'use client'

import { useState, useMemo } from 'react'
import { MenuItem } from '@/lib/types'
import {
  calculateForwardPricing,
  calculateReversePricing,
  formatCurrency,
  formatPercent,
} from '@/lib/calculations'

interface Props {
  items: MenuItem[]
}

export default function PricingCalculator({ items }: Props) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-4">Price a New Item</h3>
        <ForwardCalculator />
      </div>
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-4">Adjust Existing Item</h3>
        <ReverseCalculator items={items} />
      </div>
    </div>
  )
}

function ForwardCalculator() {
  const [plateCost, setPlateCost] = useState<number>(0)
  const [targetPercent, setTargetPercent] = useState<number>(30)
  const [perceivedValue, setPerceivedValue] = useState<number>(3)
  const [compLow, setCompLow] = useState<string>('')
  const [compHigh, setCompHigh] = useState<string>('')

  const result = useMemo(() => {
    if (plateCost <= 0 || targetPercent <= 0 || targetPercent >= 100) return null
    return calculateForwardPricing({
      plateCost,
      targetFoodCostPercent: targetPercent,
      perceivedValue,
      competitorPriceLow: compLow ? parseFloat(compLow) : undefined,
      competitorPriceHigh: compHigh ? parseFloat(compHigh) : undefined,
    })
  }, [plateCost, targetPercent, perceivedValue, compLow, compHigh])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="input-label">Plate Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-field"
            placeholder="e.g. 8.50"
            value={plateCost || ''}
            onChange={e => setPlateCost(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="input-label">Target Food Cost %</label>
          <input
            type="number"
            step="1"
            min="1"
            max="99"
            className="input-field"
            value={targetPercent}
            onChange={e => setTargetPercent(parseInt(e.target.value) || 30)}
          />
          <div className="flex gap-2 mt-2">
            {[25, 28, 30, 33, 35].map(v => (
              <button
                key={v}
                className={`text-xs px-2 py-1 rounded ${targetPercent === v ? 'bg-gold text-navy font-bold' : 'bg-navy-light text-steel hover:text-white'}`}
                onClick={() => setTargetPercent(v)}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="input-label">Perceived Value (1-5)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                className={`w-10 h-10 rounded-lg text-sm font-bold ${perceivedValue === v ? 'bg-gold text-navy' : 'bg-navy-light text-steel hover:text-white border border-navy-border'}`}
                onClick={() => setPerceivedValue(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Competitor Low ($)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              placeholder="Optional"
              value={compLow}
              onChange={e => setCompLow(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Competitor High ($)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              placeholder="Optional"
              value={compHigh}
              onChange={e => setCompHigh(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        {result ? (
          <div className="space-y-3">
            <PriceResult
              label="Suggested Price"
              price={result.suggestedPrice}
              margin={result.contributionMargins.suggested}
              highlight
            />
            <PriceResult
              label="Conservative (−10%)"
              price={result.conservativePrice}
              margin={result.contributionMargins.conservative}
            />
            <PriceResult
              label="Aggressive (+10%)"
              price={result.aggressivePrice}
              margin={result.contributionMargins.aggressive}
            />
            {result.premiumPrice && (
              <PriceResult
                label="Premium (+20%)"
                price={result.premiumPrice}
                margin={result.contributionMargins.premium!}
              />
            )}
            {result.outsideCompetitorRange === true && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-400 text-sm">
                Suggested price falls outside the competitor range
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-steel text-sm">
            Enter a plate cost to see pricing suggestions
          </div>
        )}
      </div>
    </div>
  )
}

function PriceResult({ label, price, margin, highlight }: { label: string; price: number; margin: number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-gold bg-gold/5' : 'border-navy-border bg-navy-light'}`}>
      <div className="text-xs text-steel uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-display text-2xl font-bold ${highlight ? 'text-gold' : 'text-white'}`}>
        {formatCurrency(price)}
      </div>
      <div className="text-sm text-steel mt-1">
        Margin: {formatCurrency(margin)} per plate
      </div>
    </div>
  )
}

function ReverseCalculator({ items }: { items: MenuItem[] }) {
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [currentCost, setCurrentCost] = useState<number>(0)
  const [newCost, setNewCost] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')
  const [monthlyUnits, setMonthlyUnits] = useState<string>('')

  function handleSelectItem(id: string) {
    setSelectedItemId(id)
    const item = items.find(i => i.id === id)
    if (item) {
      setCurrentPrice(item.menuPrice)
      setCurrentCost(item.foodCost)
      const estimatedMonthly = Math.round(item.unitsSold / (item.periodDays / 30))
      setMonthlyUnits(String(estimatedMonthly))
    }
  }

  const result = useMemo(() => {
    if (currentPrice <= 0 || currentCost <= 0) return null
    if (!newCost && !newPrice) return null
    return calculateReversePricing({
      currentPrice,
      currentFoodCost: currentCost,
      newFoodCost: newCost ? parseFloat(newCost) : undefined,
      newPrice: newPrice ? parseFloat(newPrice) : undefined,
      monthlyUnitsSold: monthlyUnits ? parseInt(monthlyUnits) : undefined,
    })
  }, [currentPrice, currentCost, newCost, newPrice, monthlyUnits])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {items.length > 0 && (
          <div>
            <label className="input-label">Select Existing Item</label>
            <select
              className="select-field"
              value={selectedItemId}
              onChange={e => handleSelectItem(e.target.value)}
            >
              <option value="">— Or enter manually below —</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({formatCurrency(item.menuPrice)})</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Current Price ($)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={currentPrice || ''}
              onChange={e => setCurrentPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="input-label">Current Food Cost ($)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={currentCost || ''}
              onChange={e => setCurrentCost(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div>
          <label className="input-label">New Food Cost ($) — if cost went up</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            placeholder="Leave empty if adjusting price instead"
            value={newCost}
            onChange={e => setNewCost(e.target.value)}
          />
        </div>
        <div>
          <label className="input-label">New Target Price ($) — if you want to reprice</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            placeholder="Leave empty if adjusting cost instead"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="input-label">Est. Monthly Units Sold</label>
          <input
            type="number"
            className="input-field"
            placeholder="For monthly impact calculation"
            value={monthlyUnits}
            onChange={e => setMonthlyUnits(e.target.value)}
          />
        </div>
      </div>

      <div>
        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-navy-border bg-navy-light">
                <div className="text-xs text-steel uppercase mb-1">Current Margin</div>
                <div className="font-display text-xl font-bold">{formatCurrency(result.currentMargin)}</div>
                <div className="text-sm text-steel">{formatPercent(result.currentFoodCostPercent)} food cost</div>
              </div>
              <div className={`p-4 rounded-lg border ${result.marginChangeDollars < 0 ? 'border-red-800 bg-red-900/10' : 'border-green-800 bg-green-900/10'}`}>
                <div className="text-xs text-steel uppercase mb-1">New Margin</div>
                <div className="font-display text-xl font-bold">{formatCurrency(result.newMargin)}</div>
                <div className="text-sm text-steel">{formatPercent(result.newFoodCostPercent)} food cost</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${result.marginChangeDollars < 0 ? 'border-red-800 bg-red-900/10' : 'border-green-800 bg-green-900/10'}`}>
              <div className="text-xs text-steel uppercase mb-1">Margin Change Per Plate</div>
              <div className={`font-display text-lg font-bold ${result.marginChangeDollars < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {result.marginChangeDollars >= 0 ? '+' : ''}{formatCurrency(result.marginChangeDollars)}
                <span className="text-sm font-body ml-2">
                  ({result.marginChangePercent >= 0 ? '+' : ''}{formatPercent(result.marginChangePercent)})
                </span>
              </div>
            </div>

            {result.monthlyProfitImpact != null && (
              <div className={`p-4 rounded-lg border ${result.monthlyProfitImpact < 0 ? 'border-red-800 bg-red-900/10' : 'border-green-800 bg-green-900/10'}`}>
                <div className="text-xs text-steel uppercase mb-1">Monthly Profit Impact</div>
                <div className={`font-display text-lg font-bold ${result.monthlyProfitImpact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {result.monthlyProfitImpact >= 0 ? '+' : ''}{formatCurrency(result.monthlyProfitImpact)}
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg border border-gold/20 bg-gold/5">
              <div className="text-xs text-gold uppercase mb-1">Suggested Action</div>
              <p className="text-white text-sm">{result.suggestedAction}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-steel text-sm">
            Enter current values and a new cost or price to see impact
          </div>
        )}
      </div>
    </div>
  )
}
