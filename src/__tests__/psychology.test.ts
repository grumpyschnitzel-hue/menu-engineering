import {
  analyzeChoiceArchitecture,
  recommendBadges,
  analyzeAnchoring,
  analyzeDecoys,
  scoreDescription,
  recommendPlacements,
  simulateChange,
  calculateMenuHealth,
  RESEARCH_DEFAULTS,
} from '../lib/psychology'
import { MenuItem } from '../lib/types'

// ===== Test Helpers =====

function makeItem(overrides: Partial<MenuItem> & { id: string; name: string; category: string }): MenuItem {
  return {
    menuPrice: 20,
    foodCost: 8,
    unitsSold: 100,
    periodDays: 30,
    contributionMargin: 12,
    foodCostPercent: 40,
    totalProfit: 1200,
    salesMixPercent: 10,
    classification: 'star',
    recommendedAction: 'Keep & feature',
    ...overrides,
  }
}

function makeCategory(category: string, count: number, classification: MenuItem['classification'] = 'star'): MenuItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeItem({
      id: `${category}-${i}`,
      name: `${category} Item ${i + 1}`,
      category,
      classification,
      contributionMargin: 12 - i,
      totalProfit: (12 - i) * 100,
      unitsSold: 100 - i * 5,
      salesMixPercent: 10 - i * 0.5,
    })
  )
}

// ===== Feature 8: Choice Architecture Alerts =====

describe('analyzeChoiceArchitecture', () => {
  it('returns no alerts when all categories have 7 or fewer items', () => {
    const items = makeCategory('Mains', 5)
    const alerts = analyzeChoiceArchitecture(items)
    expect(alerts).toHaveLength(0)
  })

  it('returns no alert for exactly 7 items', () => {
    const items = makeCategory('Mains', 7)
    const alerts = analyzeChoiceArchitecture(items)
    expect(alerts).toHaveLength(0)
  })

  it('returns warning alert when category has 8 items', () => {
    const items = makeCategory('Mains', 8)
    const alerts = analyzeChoiceArchitecture(items)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].category).toBe('Mains')
    expect(alerts[0].itemCount).toBe(8)
    expect(alerts[0].severity).toBe('warning')
  })

  it('returns critical alert when category has 10+ items', () => {
    const items = makeCategory('Mains', 12)
    const alerts = analyzeChoiceArchitecture(items)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('critical')
    expect(alerts[0].message).toContain('paralysis')
  })

  it('recommends Dogs first for cuts', () => {
    const items = [
      ...makeCategory('Mains', 5, 'star'),
      makeItem({ id: 'dog1', name: 'Dog 1', category: 'Mains', classification: 'dog', contributionMargin: 2, totalProfit: 40, salesMixPercent: 1 }),
      makeItem({ id: 'dog2', name: 'Dog 2', category: 'Mains', classification: 'dog', contributionMargin: 1, totalProfit: 20, salesMixPercent: 0.5 }),
      makeItem({ id: 'ph1', name: 'Plowhorse 1', category: 'Mains', classification: 'plowhorse', contributionMargin: 5, totalProfit: 300, salesMixPercent: 8 }),
    ]
    const alerts = analyzeChoiceArchitecture(items)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].cutRecommendations.length).toBeGreaterThan(0)
    // Dogs should be recommended first
    expect(alerts[0].cutRecommendations[0].item.classification).toBe('dog')
  })

  it('handles multiple categories independently', () => {
    const items = [
      ...makeCategory('Mains', 9),
      ...makeCategory('Starters', 5),
    ]
    const alerts = analyzeChoiceArchitecture(items)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].category).toBe('Mains')
  })

  it('returns empty array for empty items', () => {
    expect(analyzeChoiceArchitecture([])).toHaveLength(0)
  })
})

// ===== Feature 9: Social Proof Recommender =====

describe('recommendBadges', () => {
  it('recommends Most Popular badge for highest sales item', () => {
    const items = [
      makeItem({ id: '1', name: 'Popular Burger', category: 'Mains', unitsSold: 300, classification: 'plowhorse' }),
      makeItem({ id: '2', name: 'Premium Steak', category: 'Mains', unitsSold: 100, classification: 'star', contributionMargin: 25 }),
    ]
    const result = recommendBadges(items)
    expect(result).toHaveLength(1)
    const mainsBadges = result[0].badges
    expect(mainsBadges[0].badgeType).toBe('most-popular')
    expect(mainsBadges[0].item.name).toBe('Popular Burger')
  })

  it('recommends Chef Pick for highest-margin Star', () => {
    const items = [
      makeItem({ id: '1', name: 'Popular Burger', category: 'Mains', unitsSold: 300, classification: 'plowhorse' }),
      makeItem({ id: '2', name: 'Premium Steak', category: 'Mains', unitsSold: 100, classification: 'star', contributionMargin: 25 }),
    ]
    const result = recommendBadges(items)
    const mainsBadges = result[0].badges
    expect(mainsBadges).toHaveLength(2)
    expect(mainsBadges[1].badgeType).toBe('chef-pick')
    expect(mainsBadges[1].item.name).toBe('Premium Steak')
  })

  it('enforces max 2 badges per category', () => {
    const items = [
      makeItem({ id: '1', name: 'Item 1', category: 'Mains', unitsSold: 300, classification: 'plowhorse' }),
      makeItem({ id: '2', name: 'Item 2', category: 'Mains', unitsSold: 200, classification: 'star', contributionMargin: 25 }),
      makeItem({ id: '3', name: 'Item 3', category: 'Mains', unitsSold: 150, classification: 'star', contributionMargin: 20 }),
    ]
    const result = recommendBadges(items)
    expect(result[0].badges.length).toBeLessThanOrEqual(2)
  })

  it('falls back to Puzzle for Chef Pick when no Stars', () => {
    const items = [
      makeItem({ id: '1', name: 'Popular', category: 'Mains', unitsSold: 300, classification: 'plowhorse' }),
      makeItem({ id: '2', name: 'Hidden Gem', category: 'Mains', unitsSold: 50, classification: 'puzzle', contributionMargin: 22 }),
    ]
    const result = recommendBadges(items)
    const chefPick = result[0].badges.find(b => b.badgeType === 'chef-pick')
    expect(chefPick).toBeDefined()
    expect(chefPick!.item.name).toBe('Hidden Gem')
  })

  it('handles empty items', () => {
    expect(recommendBadges([])).toHaveLength(0)
  })

  it('handles category with single item', () => {
    const items = [makeItem({ id: '1', name: 'Solo Item', category: 'Mains', unitsSold: 100 })]
    const result = recommendBadges(items)
    expect(result).toHaveLength(1)
    expect(result[0].badges).toHaveLength(1) // only Most Popular, no Chef Pick (same item)
  })
})

// ===== Feature 10: Price Anchoring Advisor =====

describe('analyzeAnchoring', () => {
  it('identifies anchor as highest-priced item', () => {
    const items = [
      makeItem({ id: '1', name: 'Ribeye', category: 'Mains', menuPrice: 48 }),
      makeItem({ id: '2', name: 'Salmon', category: 'Mains', menuPrice: 32 }),
      makeItem({ id: '3', name: 'Chicken', category: 'Mains', menuPrice: 24 }),
    ]
    const result = analyzeAnchoring(items)
    expect(result[0].anchorItem!.name).toBe('Ribeye')
  })

  it('calculates contrast gap correctly', () => {
    const items = [
      makeItem({ id: '1', name: 'Ribeye', category: 'Mains', menuPrice: 48 }),
      makeItem({ id: '2', name: 'Salmon', category: 'Mains', menuPrice: 32 }),
    ]
    const result = analyzeAnchoring(items)
    const salmonTarget = result[0].targetItems.find(t => t.item.name === 'Salmon')
    expect(salmonTarget!.contrastGap).toBe(16)
    // 16/48 = 33.33%
    expect(salmonTarget!.contrastPercent).toBeCloseTo(33.33, 1)
  })

  it('warns when price spread is too narrow', () => {
    const items = [
      makeItem({ id: '1', name: 'Item A', category: 'Mains', menuPrice: 22 }),
      makeItem({ id: '2', name: 'Item B', category: 'Mains', menuPrice: 20 }),
      makeItem({ id: '3', name: 'Item C', category: 'Mains', menuPrice: 21 }),
    ]
    const result = analyzeAnchoring(items)
    expect(result[0].hasEffectiveAnchor).toBe(false)
    expect(result[0].warning).toContain('no anchoring effect')
  })

  it('confirms effective anchor with wide spread', () => {
    const items = [
      makeItem({ id: '1', name: 'Premium', category: 'Mains', menuPrice: 60 }),
      makeItem({ id: '2', name: 'Regular', category: 'Mains', menuPrice: 30 }),
    ]
    const result = analyzeAnchoring(items)
    expect(result[0].hasEffectiveAnchor).toBe(true)
    expect(result[0].warning).toBeNull()
  })

  it('handles single item in category', () => {
    const items = [makeItem({ id: '1', name: 'Solo', category: 'Mains', menuPrice: 30 })]
    const result = analyzeAnchoring(items)
    expect(result[0].hasEffectiveAnchor).toBe(false)
    expect(result[0].warning).toContain('Only 1 item')
  })

  it('handles empty items', () => {
    expect(analyzeAnchoring([])).toHaveLength(0)
  })
})

// ===== Feature 11: Decoy Pricing Detector =====

describe('analyzeDecoys', () => {
  it('detects decoy when items are within 10-15% of each other', () => {
    const items = [
      makeItem({ id: '1', name: 'Small', category: 'Mains', menuPrice: 20, contributionMargin: 10 }),
      makeItem({ id: '2', name: 'Medium', category: 'Mains', menuPrice: 70, contributionMargin: 30 }),
      makeItem({ id: '3', name: 'Large', category: 'Mains', menuPrice: 80, contributionMargin: 45 }),
    ]
    const result = analyzeDecoys(items)
    expect(result[0].opportunities.length).toBeGreaterThan(0)
    const decoy = result[0].opportunities[0]
    expect(decoy.decoyItem.name).toBe('Medium')
    expect(decoy.targetItem.name).toBe('Large')
  })

  it('requires at least 3 items for decoy analysis', () => {
    const items = [
      makeItem({ id: '1', name: 'Item A', category: 'Mains', menuPrice: 20 }),
      makeItem({ id: '2', name: 'Item B', category: 'Mains', menuPrice: 25 }),
    ]
    const result = analyzeDecoys(items)
    expect(result[0].opportunities).toHaveLength(0)
    expect(result[0].recommendation).toContain('at least 3 items')
  })

  it('returns no opportunities when prices are too spread out', () => {
    const items = [
      makeItem({ id: '1', name: 'Cheap', category: 'Mains', menuPrice: 10, contributionMargin: 5 }),
      makeItem({ id: '2', name: 'Mid', category: 'Mains', menuPrice: 30, contributionMargin: 15 }),
      makeItem({ id: '3', name: 'Premium', category: 'Mains', menuPrice: 60, contributionMargin: 35 }),
    ]
    const result = analyzeDecoys(items)
    expect(result[0].opportunities).toHaveLength(0)
  })

  it('handles empty items', () => {
    expect(analyzeDecoys([])).toHaveLength(0)
  })
})

// ===== Feature 12: Description Quality Scorer =====

describe('scoreDescription', () => {
  it('scores a basic description low', () => {
    const result = scoreDescription('Grilled chicken')
    expect(result.totalScore).toBeLessThan(30)
    expect(result.improvements.length).toBeGreaterThan(3)
  })

  it('scores a rich description high', () => {
    const result = scoreDescription(
      'Slow-braised Black Forest heritage chicken with roasted garlic and fresh thyme, served on a bed of creamy polenta'
    )
    expect(result.totalScore).toBeGreaterThan(60)
  })

  it('detects sensory words', () => {
    const result = scoreDescription('Crispy golden chicken with velvety sauce')
    expect(result.criteria.sensoryWords.found).toContain('crispy')
    expect(result.criteria.sensoryWords.found).toContain('golden')
    expect(result.criteria.sensoryWords.found).toContain('velvety')
    expect(result.criteria.sensoryWords.score).toBeGreaterThan(0)
  })

  it('detects geographic origin', () => {
    const result = scoreDescription('Hudson Valley duck breast with Italian truffle')
    expect(result.criteria.geographicOrigin.found).toBe(true)
    expect(result.criteria.geographicOrigin.score).toBe(20)
  })

  it('detects preparation methods', () => {
    const result = scoreDescription('Wood-fired and slow-cooked pork shoulder')
    expect(result.criteria.preparationMethod.found.length).toBeGreaterThan(0)
    expect(result.criteria.preparationMethod.score).toBeGreaterThan(0)
  })

  it('detects emotional/nostalgic language', () => {
    const result = scoreDescription("Grandma's traditional farmstead apple pie")
    expect(result.criteria.emotionalLanguage.found).toContain('grandma')
    expect(result.criteria.emotionalLanguage.found).toContain('traditional')
    expect(result.criteria.emotionalLanguage.found).toContain('farmstead')
  })

  it('penalizes dollar signs in description', () => {
    const result = scoreDescription('Premium steak $45 with truffle butter')
    expect(result.criteria.noPricePain.clean).toBe(false)
    expect(result.criteria.noPricePain.score).toBe(0)
  })

  it('rewards appropriate length (8-25 words)', () => {
    const result = scoreDescription('Slow-braised heritage chicken with roasted garlic and fresh thyme on creamy polenta garnished with microgreens')
    expect(result.criteria.optimalLength.score).toBe(10)
  })

  it('penalizes very short descriptions', () => {
    const result = scoreDescription('Chicken')
    expect(result.criteria.optimalLength.score).toBe(0)
  })

  it('provides specific improvement suggestions', () => {
    const result = scoreDescription('Grilled chicken breast')
    expect(result.improvements.some(i => i.toLowerCase().includes('sensory'))).toBe(true)
    expect(result.improvements.some(i => i.toLowerCase().includes('origin'))).toBe(true)
  })

  it('maxes out at 100', () => {
    const result = scoreDescription(
      "Grandma's traditional slow-braised Black Forest heritage chicken with crispy golden skin, velvety roasted garlic cream, and fresh Italian thyme from our farmstead garden"
    )
    expect(result.maxScore).toBe(100)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })
})

// ===== Feature 13: Golden Triangle Placement Advisor =====

describe('recommendPlacements', () => {
  it('places Stars in golden center / first position', () => {
    const items = [
      makeItem({ id: '1', name: 'Star Item', category: 'Mains', classification: 'star' }),
      makeItem({ id: '2', name: 'Dog Item', category: 'Mains', classification: 'dog' }),
    ]
    const result = recommendPlacements(items)
    const starPlacement = result[0].placements.find(p => p.item.name === 'Star Item')
    expect(starPlacement!.zone).toBe('golden-center')
    expect(starPlacement!.priority).toBe(1)
  })

  it('places Puzzles in last position (recency effect)', () => {
    const items = [
      makeItem({ id: '1', name: 'Star', category: 'Mains', classification: 'star' }),
      makeItem({ id: '2', name: 'Puzzle', category: 'Mains', classification: 'puzzle' }),
    ]
    const result = recommendPlacements(items)
    const puzzlePlacement = result[0].placements.find(p => p.item.name === 'Puzzle')
    expect(puzzlePlacement!.zone).toBe('last-in-category')
  })

  it('places Plowhorses in middle', () => {
    const items = [
      makeItem({ id: '1', name: 'Plowhorse', category: 'Mains', classification: 'plowhorse' }),
    ]
    const result = recommendPlacements(items)
    expect(result[0].placements[0].zone).toBe('middle')
  })

  it('places Dogs at bottom or recommends removal', () => {
    const items = [
      makeItem({ id: '1', name: 'Bad Dog', category: 'Mains', classification: 'dog', totalProfit: 0 }),
    ]
    const result = recommendPlacements(items)
    expect(result[0].placements[0].zone).toBe('remove')
  })

  it('sorts placements by priority', () => {
    const items = [
      makeItem({ id: '1', name: 'Dog', category: 'Mains', classification: 'dog', totalProfit: 50 }),
      makeItem({ id: '2', name: 'Star', category: 'Mains', classification: 'star' }),
      makeItem({ id: '3', name: 'Puzzle', category: 'Mains', classification: 'puzzle' }),
    ]
    const result = recommendPlacements(items)
    const priorities = result[0].placements.map(p => p.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })

  it('handles empty items', () => {
    expect(recommendPlacements([])).toHaveLength(0)
  })
})

// ===== Feature 14: Revenue Impact Simulator =====

describe('simulateChange', () => {
  const items = [
    makeItem({
      id: '1',
      name: 'Salmon',
      category: 'Mains',
      menuPrice: 32,
      foodCost: 12,
      contributionMargin: 20,
      unitsSold: 100,
      totalProfit: 2000,
    }),
  ]

  it('simulates price change correctly', () => {
    const result = simulateChange(items, {
      action: 'price-change',
      itemId: '1',
      newPrice: 35,
    })
    expect(result).not.toBeNull()
    expect(result!.projectedMonthlyProfit).toBe(2300) // (35 - 12) * 100
    expect(result!.monthlyDelta).toBe(300)
    expect(result!.annualDelta).toBe(3600)
  })

  it('simulates item removal', () => {
    const result = simulateChange(items, {
      action: 'item-removal',
      itemId: '1',
    })
    expect(result!.projectedMonthlyProfit).toBe(0)
    expect(result!.monthlyDelta).toBe(-2000)
  })

  it('simulates repositioning with default +20%', () => {
    const result = simulateChange(items, {
      action: 'repositioning',
      itemId: '1',
    })
    // 100 * 1.2 = 120 units, 120 * 20 = 2400
    expect(result!.projectedMonthlyProfit).toBe(2400)
    expect(result!.monthlyDelta).toBe(400)
  })

  it('simulates description upgrade with default +27%', () => {
    const result = simulateChange(items, {
      action: 'description-upgrade',
      itemId: '1',
    })
    // 100 * 1.27 = 127 units, 127 * 20 = 2540
    expect(result!.projectedMonthlyProfit).toBe(2540)
    expect(result!.explanation).toContain('27%')
  })

  it('allows custom sales change percent', () => {
    const result = simulateChange(items, {
      action: 'repositioning',
      itemId: '1',
      salesChangePercent: 0.5,
    })
    // 100 * 1.5 = 150 units, 150 * 20 = 3000
    expect(result!.projectedMonthlyProfit).toBe(3000)
  })

  it('returns null for unknown item', () => {
    const result = simulateChange(items, {
      action: 'price-change',
      itemId: 'nonexistent',
      newPrice: 40,
    })
    expect(result).toBeNull()
  })
})

// ===== Feature 15: Menu Health Checklist =====

describe('calculateMenuHealth', () => {
  it('returns 15 health items', () => {
    const items = makeCategory('Mains', 5)
    const result = calculateMenuHealth(items)
    expect(result.items).toHaveLength(15)
  })

  it('auto-scores category size check', () => {
    const items = makeCategory('Mains', 5)
    const result = calculateMenuHealth(items)
    const categorySizeItem = result.items.find(i => i.id === 'layout-category-size')
    expect(categorySizeItem!.autoScored).toBe(true)
    expect(categorySizeItem!.passed).toBe(true)
  })

  it('fails category size check when exceeding threshold', () => {
    const items = makeCategory('Mains', 10)
    const result = calculateMenuHealth(items)
    const categorySizeItem = result.items.find(i => i.id === 'layout-category-size')
    expect(categorySizeItem!.passed).toBe(false)
  })

  it('calculates percentage correctly', () => {
    const items = [
      ...makeCategory('Mains', 5, 'star'),
      ...makeCategory('Starters', 4, 'star'),
      ...makeCategory('Desserts', 3, 'star'),
    ]
    const result = calculateMenuHealth(items)
    expect(result.percentage).toBe(Math.round((result.totalScore / result.maxScore) * 100))
  })

  it('manual items default to not passed', () => {
    const items = makeCategory('Mains', 5)
    const result = calculateMenuHealth(items)
    const manualItems = result.items.filter(i => !i.autoScored)
    expect(manualItems.every(i => !i.passed)).toBe(true)
  })

  it('scores higher with more complete data', () => {
    // Sparse data
    const sparse = calculateMenuHealth([makeItem({ id: '1', name: 'Solo', category: 'Mains' })])

    // Rich data
    const richItems = [
      ...makeCategory('Mains', 5, 'star'),
      ...makeCategory('Starters', 4, 'puzzle'),
      ...makeCategory('Desserts', 3, 'plowhorse'),
    ]
    const rich = calculateMenuHealth(richItems)

    expect(rich.totalScore).toBeGreaterThan(sparse.totalScore)
  })

  it('handles empty items', () => {
    const result = calculateMenuHealth([])
    expect(result.items).toHaveLength(15)
    expect(result.totalScore).toBeLessThanOrEqual(result.maxScore)
  })
})

// ===== Research Defaults =====

describe('RESEARCH_DEFAULTS', () => {
  it('has all expected research-backed values', () => {
    expect(RESEARCH_DEFAULTS.descriptionUpgradeSalesIncrease).toBe(0.27)
    expect(RESEARCH_DEFAULTS.socialProofOrderIncrease).toBe(0.23)
    expect(RESEARCH_DEFAULTS.anchoringCheckIncrease).toBe(0.068)
    expect(RESEARCH_DEFAULTS.dollarSignRemovalSpendIncrease).toBe(0.08)
    expect(RESEARCH_DEFAULTS.repositioningOrderIncrease).toBe(0.20)
  })
})
