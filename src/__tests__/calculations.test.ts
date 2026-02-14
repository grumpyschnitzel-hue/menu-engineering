import {
  calculateItemMetrics,
  calculateBenchmarks,
  classifyItem,
  classifyAllItems,
  getClassificationSummaries,
  calculateForwardPricing,
  calculateReversePricing,
  formatCurrency,
  formatPercent,
} from '../lib/calculations'

describe('calculateItemMetrics', () => {
  it('calculates contribution margin correctly', () => {
    const result = calculateItemMetrics(
      { id: '1', name: 'Test', category: 'Mains', menuPrice: 30, foodCost: 10, unitsSold: 100, periodDays: 30 },
      1000
    )
    expect(result.contributionMargin).toBe(20)
  })

  it('calculates food cost percent correctly', () => {
    const result = calculateItemMetrics(
      { id: '1', name: 'Test', category: 'Mains', menuPrice: 40, foodCost: 12, unitsSold: 100, periodDays: 30 },
      1000
    )
    expect(result.foodCostPercent).toBe(30)
  })

  it('calculates total profit correctly', () => {
    const result = calculateItemMetrics(
      { id: '1', name: 'Test', category: 'Mains', menuPrice: 25, foodCost: 10, unitsSold: 200, periodDays: 30 },
      1000
    )
    expect(result.totalProfit).toBe(3000)
  })

  it('calculates sales mix percent correctly', () => {
    const result = calculateItemMetrics(
      { id: '1', name: 'Test', category: 'Mains', menuPrice: 25, foodCost: 10, unitsSold: 250, periodDays: 30 },
      1000
    )
    expect(result.salesMixPercent).toBe(25)
  })

  it('handles zero total units', () => {
    const result = calculateItemMetrics(
      { id: '1', name: 'Test', category: 'Mains', menuPrice: 25, foodCost: 10, unitsSold: 0, periodDays: 30 },
      0
    )
    expect(result.salesMixPercent).toBe(0)
  })
})

describe('classifyItem', () => {
  const benchmarks = { avgContributionMargin: 15, avgSalesMixPercent: 10, totalUnitsSold: 1000 }

  it('classifies star (high margin, high popularity)', () => {
    expect(classifyItem(20, 15, benchmarks, 'average')).toBe('star')
  })

  it('classifies plowhorse (low margin, high popularity)', () => {
    expect(classifyItem(10, 15, benchmarks, 'average')).toBe('plowhorse')
  })

  it('classifies puzzle (high margin, low popularity)', () => {
    expect(classifyItem(20, 5, benchmarks, 'average')).toBe('puzzle')
  })

  it('classifies dog (low margin, low popularity)', () => {
    expect(classifyItem(10, 5, benchmarks, 'average')).toBe('dog')
  })

  it('uses 70% rule when method is seventyPercent', () => {
    // 70% of 10 = 7. Sales mix of 8 is above 7 but below 10
    expect(classifyItem(10, 8, benchmarks, 'seventyPercent')).toBe('plowhorse')
    expect(classifyItem(10, 8, benchmarks, 'average')).toBe('dog')
  })
})

describe('classifyAllItems', () => {
  const items = [
    { id: '1', name: 'Star Item', category: 'Mains', menuPrice: 40, foodCost: 10, unitsSold: 300, periodDays: 30 },
    { id: '2', name: 'Plowhorse Item', category: 'Mains', menuPrice: 20, foodCost: 12, unitsSold: 400, periodDays: 30 },
    { id: '3', name: 'Puzzle Item', category: 'Mains', menuPrice: 50, foodCost: 15, unitsSold: 50, periodDays: 30 },
    { id: '4', name: 'Dog Item', category: 'Mains', menuPrice: 15, foodCost: 10, unitsSold: 50, periodDays: 30 },
  ]

  it('classifies all items', () => {
    const result = classifyAllItems(items, 'average')
    expect(result).toHaveLength(4)
    expect(result.every(item => item.classification)).toBe(true)
    expect(result.every(item => item.recommendedAction)).toBe(true)
  })

  it('returns empty array for no items', () => {
    expect(classifyAllItems([], 'average')).toEqual([])
  })

  it('handles single item', () => {
    const result = classifyAllItems([items[0]], 'average')
    expect(result).toHaveLength(1)
    // Single item is always at the average, so it should be star (>= average on both)
    expect(result[0].classification).toBe('star')
  })
})

describe('calculateForwardPricing', () => {
  it('calculates suggested price correctly', () => {
    const result = calculateForwardPricing({
      plateCost: 10,
      targetFoodCostPercent: 30,
    })
    expect(result.suggestedPrice).toBeCloseTo(33.33, 1)
  })

  it('calculates conservative and aggressive prices', () => {
    const result = calculateForwardPricing({
      plateCost: 10,
      targetFoodCostPercent: 30,
    })
    expect(result.conservativePrice).toBeCloseTo(30, 0)
    expect(result.aggressivePrice).toBeCloseTo(36.67, 0)
  })

  it('shows premium price only for high perceived value', () => {
    const low = calculateForwardPricing({
      plateCost: 10,
      targetFoodCostPercent: 30,
      perceivedValue: 3,
    })
    expect(low.premiumPrice).toBeNull()

    const high = calculateForwardPricing({
      plateCost: 10,
      targetFoodCostPercent: 30,
      perceivedValue: 4,
    })
    expect(high.premiumPrice).toBeCloseTo(40, 0)
  })

  it('detects when price is outside competitor range', () => {
    const result = calculateForwardPricing({
      plateCost: 10,
      targetFoodCostPercent: 30,
      competitorPriceLow: 35,
      competitorPriceHigh: 45,
    })
    // Suggested is ~33.33, which is below 35
    expect(result.outsideCompetitorRange).toBe(true)
  })
})

describe('calculateReversePricing', () => {
  it('calculates margin change when cost increases', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newFoodCost: 12,
    })
    expect(result.currentMargin).toBe(20)
    expect(result.newMargin).toBe(18)
    expect(result.marginChangeDollars).toBe(-2)
  })

  it('calculates monthly profit impact', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newFoodCost: 12,
      monthlyUnitsSold: 100,
    })
    expect(result.monthlyProfitImpact).toBe(-200)
  })

  it('provides suggestion when margin decreases', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newFoodCost: 12,
    })
    expect(result.suggestedAction).toContain('Raise price')
  })

  it('provides positive message when margin improves', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newPrice: 35,
    })
    expect(result.suggestedAction).toContain('improved')
  })

  it('handles both new price and new cost at once', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newPrice: 35,
      newFoodCost: 12,
    })
    expect(result.newMargin).toBe(23) // 35 - 12
    expect(result.marginChangeDollars).toBe(3) // 23 - 20
  })

  it('returns null monthly impact when no units provided', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newFoodCost: 12,
    })
    expect(result.monthlyProfitImpact).toBeNull()
  })

  it('calculates new food cost percent correctly', () => {
    const result = calculateReversePricing({
      currentPrice: 30,
      currentFoodCost: 10,
      newFoodCost: 15,
    })
    expect(result.newFoodCostPercent).toBe(50) // 15/30 * 100
  })
})

describe('calculateBenchmarks', () => {
  it('returns zeros for empty array', () => {
    const result = calculateBenchmarks([])
    expect(result.avgContributionMargin).toBe(0)
    expect(result.avgSalesMixPercent).toBe(0)
    expect(result.totalUnitsSold).toBe(0)
  })

  it('calculates average contribution margin', () => {
    const items = [
      { id: '1', name: 'A', category: 'Mains', menuPrice: 30, foodCost: 10, unitsSold: 100, periodDays: 30, contributionMargin: 20, foodCostPercent: 33.33, totalProfit: 2000, salesMixPercent: 50 },
      { id: '2', name: 'B', category: 'Mains', menuPrice: 20, foodCost: 10, unitsSold: 100, periodDays: 30, contributionMargin: 10, foodCostPercent: 50, totalProfit: 1000, salesMixPercent: 50 },
    ]
    const result = calculateBenchmarks(items)
    expect(result.avgContributionMargin).toBe(15) // (20 + 10) / 2
  })

  it('calculates total units sold', () => {
    const items = [
      { id: '1', name: 'A', category: 'Mains', menuPrice: 30, foodCost: 10, unitsSold: 200, periodDays: 30, contributionMargin: 20, foodCostPercent: 33.33, totalProfit: 4000, salesMixPercent: 40 },
      { id: '2', name: 'B', category: 'Mains', menuPrice: 20, foodCost: 10, unitsSold: 300, periodDays: 30, contributionMargin: 10, foodCostPercent: 50, totalProfit: 3000, salesMixPercent: 60 },
    ]
    const result = calculateBenchmarks(items)
    expect(result.totalUnitsSold).toBe(500)
  })
})

describe('getClassificationSummaries', () => {
  const items = [
    { id: '1', name: 'Star 1', category: 'Mains', menuPrice: 40, foodCost: 10, unitsSold: 300, periodDays: 30, contributionMargin: 30, foodCostPercent: 25, totalProfit: 9000, salesMixPercent: 30, classification: 'star' as const, recommendedAction: 'Keep' },
    { id: '2', name: 'Star 2', category: 'Mains', menuPrice: 35, foodCost: 10, unitsSold: 200, periodDays: 30, contributionMargin: 25, foodCostPercent: 28.57, totalProfit: 5000, salesMixPercent: 20, classification: 'star' as const, recommendedAction: 'Keep' },
    { id: '3', name: 'Dog 1', category: 'Mains', menuPrice: 15, foodCost: 10, unitsSold: 50, periodDays: 30, contributionMargin: 5, foodCostPercent: 66.67, totalProfit: 250, salesMixPercent: 5, classification: 'dog' as const, recommendedAction: 'Evaluate' },
  ]

  it('returns summaries for all 4 classifications', () => {
    const result = getClassificationSummaries(items)
    expect(result).toHaveLength(4)
    expect(result.map(s => s.classification)).toEqual(['star', 'plowhorse', 'puzzle', 'dog'])
  })

  it('counts items per classification', () => {
    const result = getClassificationSummaries(items)
    const starSummary = result.find(s => s.classification === 'star')!
    const dogSummary = result.find(s => s.classification === 'dog')!
    const plowSummary = result.find(s => s.classification === 'plowhorse')!

    expect(starSummary.count).toBe(2)
    expect(dogSummary.count).toBe(1)
    expect(plowSummary.count).toBe(0)
  })

  it('sums total profit per classification', () => {
    const result = getClassificationSummaries(items)
    const starSummary = result.find(s => s.classification === 'star')!

    expect(starSummary.totalProfit).toBe(14000) // 9000 + 5000
  })

  it('includes items array per classification', () => {
    const result = getClassificationSummaries(items)
    const starSummary = result.find(s => s.classification === 'star')!

    expect(starSummary.items).toHaveLength(2)
    expect(starSummary.items[0].name).toBe('Star 1')
  })

  it('handles empty items array', () => {
    const result = getClassificationSummaries([])
    expect(result).toHaveLength(4)
    result.forEach(s => {
      expect(s.count).toBe(0)
      expect(s.totalProfit).toBe(0)
      expect(s.items).toEqual([])
    })
  })
})

describe('formatCurrency', () => {
  it('formats whole numbers', () => {
    expect(formatCurrency(20)).toBe('$20.00')
  })

  it('formats decimals to 2 places', () => {
    expect(formatCurrency(15.5)).toBe('$15.50')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(33.333)).toBe('$33.33')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

describe('formatPercent', () => {
  it('formats with one decimal place', () => {
    expect(formatPercent(33.33)).toBe('33.3%')
  })

  it('formats whole numbers', () => {
    expect(formatPercent(50)).toBe('50.0%')
  })

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
})
