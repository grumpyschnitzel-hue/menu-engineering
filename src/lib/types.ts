export type Classification = 'star' | 'plowhorse' | 'puzzle' | 'dog'
export type BenchmarkMethod = 'average' | 'seventyPercent'

export interface MenuItemInput {
  name: string
  category: string
  menuPrice: number
  foodCost: number
  unitsSold: number
  periodDays: number
}

export interface MenuItem extends MenuItemInput {
  id: string
  contributionMargin: number
  foodCostPercent: number
  totalProfit: number
  salesMixPercent: number
  classification: Classification
  recommendedAction: string
}

export interface ProjectData {
  items: (MenuItemInput & { id: string })[]
  periodLabel: string
  benchmarkMethod: BenchmarkMethod
  createdAt: string
  updatedAt: string
  emailUnlocked: boolean
}

export interface ClassificationSummary {
  classification: Classification
  count: number
  totalProfit: number
  items: MenuItem[]
}

export interface MatrixBenchmarks {
  avgContributionMargin: number
  avgSalesMixPercent: number
  totalUnitsSold: number
}

export interface PricingForwardInput {
  plateCost: number
  targetFoodCostPercent: number
  perceivedValue?: number
  competitorPriceLow?: number
  competitorPriceHigh?: number
}

export interface PricingForwardResult {
  suggestedPrice: number
  conservativePrice: number
  aggressivePrice: number
  premiumPrice: number | null
  contributionMargins: {
    suggested: number
    conservative: number
    aggressive: number
    premium: number | null
  }
  outsideCompetitorRange: boolean | null
}

export interface PricingReverseInput {
  currentPrice: number
  currentFoodCost: number
  newFoodCost?: number
  newPrice?: number
  monthlyUnitsSold?: number
}

export interface PricingReverseResult {
  currentMargin: number
  currentFoodCostPercent: number
  newMargin: number
  newFoodCostPercent: number
  marginChangeDollars: number
  marginChangePercent: number
  suggestedAction: string
  monthlyProfitImpact: number | null
}

export interface DescriptionInput {
  cookingMethod: string
  origin: string
  keyIngredient: string
  flavorProfile: string[]
  dietaryTags: string[]
}

export interface DescriptionOutput {
  description: string
  menuPosition: string
  pairingSuggestion: string | null
}

export const CATEGORIES = [
  'Starters',
  'Mains',
  'Desserts',
  'Drinks',
  'Sides',
] as const

export const COOKING_METHODS = [
  'Grilled', 'Roasted', 'Seared', 'Braised', 'Smoked',
  'House-made', 'Pan-fried', 'Baked', 'Steamed', 'Charred',
  'Slow-cooked', 'Poached', 'Blackened', 'Wood-fired',
] as const

export const FLAVOR_PROFILES = [
  'Rich', 'Smoky', 'Tangy', 'Crispy', 'Creamy',
  'Spicy', 'Fresh', 'Savory', 'Sweet', 'Herby',
  'Zesty', 'Buttery', 'Earthy', 'Bright',
] as const

export const DIETARY_TAGS = [
  'GF', 'V', 'VG', 'DF', 'Contains Nuts', 'Keto', 'Halal',
] as const

export const ACTION_PLAYBOOK: Record<Classification, string> = {
  star: 'Keep & feature — protect quality, prime menu position, consider small price lift',
  plowhorse: 'Re-engineer — review portion size, ingredient cost, or add margin-boosting upsell',
  puzzle: 'Promote — improve description, reposition on menu, consider bundle or special',
  dog: 'Evaluate — de-emphasize, test as re-engineered special, or remove',
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  star: '⭐ Star',
  plowhorse: '🐴 Plowhorse',
  puzzle: '🧩 Puzzle',
  dog: '🐕 Dog',
}

export const CLASSIFICATION_COLORS: Record<Classification, string> = {
  star: '#D4AF37',
  plowhorse: '#3B82F6',
  puzzle: '#8B5CF6',
  dog: '#6B7280',
}
