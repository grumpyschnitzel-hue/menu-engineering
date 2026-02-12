import {
  MenuItem,
  MenuItemInput,
  Classification,
  BenchmarkMethod,
  MatrixBenchmarks,
  ClassificationSummary,
  PricingForwardInput,
  PricingForwardResult,
  PricingReverseInput,
  PricingReverseResult,
  ACTION_PLAYBOOK,
} from './types'

export function calculateItemMetrics(
  item: MenuItemInput & { id: string },
  totalUnitsSold: number
): Omit<MenuItem, 'classification' | 'recommendedAction'> {
  const contributionMargin = item.menuPrice - item.foodCost
  const foodCostPercent = (item.foodCost / item.menuPrice) * 100
  const totalProfit = contributionMargin * item.unitsSold
  const salesMixPercent = totalUnitsSold > 0
    ? (item.unitsSold / totalUnitsSold) * 100
    : 0

  return {
    ...item,
    contributionMargin,
    foodCostPercent,
    totalProfit,
    salesMixPercent,
  }
}

export function calculateBenchmarks(
  items: Omit<MenuItem, 'classification' | 'recommendedAction'>[]
): MatrixBenchmarks {
  if (items.length === 0) {
    return { avgContributionMargin: 0, avgSalesMixPercent: 0, totalUnitsSold: 0 }
  }

  const totalUnitsSold = items.reduce((sum, item) => sum + item.unitsSold, 0)
  const avgContributionMargin =
    items.reduce((sum, item) => sum + item.contributionMargin, 0) / items.length
  const avgSalesMixPercent =
    items.reduce((sum, item) => sum + item.salesMixPercent, 0) / items.length

  return { avgContributionMargin, avgSalesMixPercent, totalUnitsSold }
}

export function classifyItem(
  contributionMargin: number,
  salesMixPercent: number,
  benchmarks: MatrixBenchmarks,
  method: BenchmarkMethod
): Classification {
  const marginThreshold = benchmarks.avgContributionMargin
  const popularityThreshold = method === 'average'
    ? benchmarks.avgSalesMixPercent
    : benchmarks.avgSalesMixPercent * 0.7

  const highMargin = contributionMargin >= marginThreshold
  const highPopularity = salesMixPercent >= popularityThreshold

  if (highMargin && highPopularity) return 'star'
  if (!highMargin && highPopularity) return 'plowhorse'
  if (highMargin && !highPopularity) return 'puzzle'
  return 'dog'
}

export function classifyAllItems(
  rawItems: (MenuItemInput & { id: string })[],
  method: BenchmarkMethod
): MenuItem[] {
  if (rawItems.length === 0) return []

  const totalUnitsSold = rawItems.reduce((sum, item) => sum + item.unitsSold, 0)

  const itemsWithMetrics = rawItems.map(item =>
    calculateItemMetrics(item, totalUnitsSold)
  )

  const benchmarks = calculateBenchmarks(itemsWithMetrics)

  return itemsWithMetrics.map(item => {
    const classification = classifyItem(
      item.contributionMargin,
      item.salesMixPercent,
      benchmarks,
      method
    )
    return {
      ...item,
      classification,
      recommendedAction: ACTION_PLAYBOOK[classification],
    }
  })
}

export function getClassificationSummaries(
  items: MenuItem[]
): ClassificationSummary[] {
  const classifications: Classification[] = ['star', 'plowhorse', 'puzzle', 'dog']

  return classifications.map(cls => {
    const clsItems = items.filter(item => item.classification === cls)
    return {
      classification: cls,
      count: clsItems.length,
      totalProfit: clsItems.reduce((sum, item) => sum + item.totalProfit, 0),
      items: clsItems,
    }
  })
}

export function calculateForwardPricing(
  input: PricingForwardInput
): PricingForwardResult {
  const { plateCost, targetFoodCostPercent, perceivedValue, competitorPriceLow, competitorPriceHigh } = input

  const suggestedPrice = plateCost / (targetFoodCostPercent / 100)
  const conservativePrice = suggestedPrice * 0.9
  const aggressivePrice = suggestedPrice * 1.1
  const premiumPrice = perceivedValue && perceivedValue >= 4
    ? suggestedPrice * 1.2
    : null

  let outsideCompetitorRange: boolean | null = null
  if (competitorPriceLow != null && competitorPriceHigh != null) {
    outsideCompetitorRange =
      suggestedPrice < competitorPriceLow || suggestedPrice > competitorPriceHigh
  }

  return {
    suggestedPrice,
    conservativePrice,
    aggressivePrice,
    premiumPrice,
    contributionMargins: {
      suggested: suggestedPrice - plateCost,
      conservative: conservativePrice - plateCost,
      aggressive: aggressivePrice - plateCost,
      premium: premiumPrice ? premiumPrice - plateCost : null,
    },
    outsideCompetitorRange,
  }
}

export function calculateReversePricing(
  input: PricingReverseInput
): PricingReverseResult {
  const { currentPrice, currentFoodCost, newFoodCost, newPrice, monthlyUnitsSold } = input

  const currentMargin = currentPrice - currentFoodCost
  const currentFoodCostPercent = (currentFoodCost / currentPrice) * 100

  let effectiveNewPrice = currentPrice
  let effectiveNewCost = currentFoodCost

  if (newFoodCost != null) {
    effectiveNewCost = newFoodCost
  }
  if (newPrice != null) {
    effectiveNewPrice = newPrice
  }

  const newMargin = effectiveNewPrice - effectiveNewCost
  const newFoodCostPercent = (effectiveNewCost / effectiveNewPrice) * 100
  const marginChangeDollars = newMargin - currentMargin
  const marginChangePercent = currentMargin !== 0
    ? ((newMargin - currentMargin) / currentMargin) * 100
    : 0

  let suggestedAction: string
  if (marginChangeDollars < 0) {
    const priceIncrease = effectiveNewCost / (currentFoodCostPercent / 100) - currentPrice
    suggestedAction = `Raise price by $${priceIncrease.toFixed(2)} to maintain margin, or reduce cost by $${Math.abs(marginChangeDollars).toFixed(2)}`
  } else {
    suggestedAction = `Margin improved by $${marginChangeDollars.toFixed(2)} per plate`
  }

  const monthlyProfitImpact = monthlyUnitsSold != null
    ? marginChangeDollars * monthlyUnitsSold
    : null

  return {
    currentMargin,
    currentFoodCostPercent,
    newMargin,
    newFoodCostPercent,
    marginChangeDollars,
    marginChangePercent,
    suggestedAction,
    monthlyProfitImpact,
  }
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
