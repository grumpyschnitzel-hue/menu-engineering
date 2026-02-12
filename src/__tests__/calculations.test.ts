import {
  calculateItemMetrics,
  calculateBenchmarks,
  classifyItem,
  classifyAllItems,
  calculateForwardPricing,
  calculateReversePricing,
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
})
