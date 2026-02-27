/**
 * Psychology-Powered Advisory Engine (Phase 2)
 *
 * Features 8-15: Choice architecture, social proof, anchoring,
 * decoy detection, description scoring, placement, simulation,
 * and menu health checklist.
 *
 * Research basis: Cornell (Wansink), Kahneman & Tversky,
 * Iyengar & Lepper, Thaler & Sunstein, NRA studies.
 */

import {
  MenuItem,
  ChoiceAlert,
  BadgeRecommendation,
  CategoryBadges,
  AnchorAnalysis,
  DecoyAnalysis,
  DecoyOpportunity,
  DescriptionScore,
  DescriptionScoreCriteria,
  PlacementRecommendation,
  CategoryPlacement,
  SimulationInput,
  SimulationResult,
  MenuHealthItem,
  MenuHealthScore,
} from './types'

// ===== Constants =====

const CHOICE_THRESHOLD = 7
const CHOICE_CRITICAL_THRESHOLD = 10
const MAX_BADGES_PER_CATEGORY = 2
const ANCHOR_MIN_GAP_PERCENT = 15
const ANCHOR_WEAK_GAP_PERCENT = 20
const DECOY_MAX_GAP_PERCENT = 15
const DECOY_MIN_GAP_PERCENT = 5

// Research-backed default assumptions for revenue simulation
export const RESEARCH_DEFAULTS = {
  descriptionUpgradeSalesIncrease: 0.27,   // Wansink Cornell: +27%
  socialProofOrderIncrease: 0.23,          // Badge test: +23%
  anchoringCheckIncrease: 0.068,           // NRA: +6.8%
  dollarSignRemovalSpendIncrease: 0.08,    // Cornell: +8%
  repositioningOrderIncrease: 0.20,        // Golden Triangle estimate: +20%
}

// Sensory word lists for description scoring
const SENSORY_WORDS = [
  'crispy', 'velvety', 'smoky', 'tender', 'buttery', 'silky', 'crunchy',
  'creamy', 'flaky', 'golden', 'juicy', 'rich', 'tangy', 'zesty',
  'aromatic', 'fragrant', 'savory', 'succulent', 'charred', 'caramelized',
  'toasted', 'whipped', 'drizzled', 'infused', 'seared', 'roasted',
  'braised', 'smoked', 'grilled', 'wood-fired', 'flame-grilled',
  'slow-braised', 'hand-pulled', 'house-made', 'fresh', 'aged',
]

const PREPARATION_WORDS = [
  'grilled', 'roasted', 'seared', 'braised', 'smoked', 'pan-fried',
  'baked', 'steamed', 'charred', 'slow-cooked', 'poached', 'blackened',
  'wood-fired', 'flame-grilled', 'hand-rolled', 'house-made', 'cured',
  'marinated', 'fermented', 'pickled', 'confit', 'sous-vide',
  'dry-aged', 'cold-pressed', 'stone-ground',
]

const EMOTIONAL_WORDS = [
  'grandma', 'grandmother', 'traditional', 'heritage', 'classic',
  'old-world', 'family', 'homestyle', 'rustic', 'artisan',
  'handcrafted', 'time-honored', 'legendary', 'beloved', 'signature',
  'secret', 'treasured', 'heirloom', 'farmstead', 'countryside',
]

// ===== Feature 8: Choice Architecture Alerts =====

export function analyzeChoiceArchitecture(items: MenuItem[]): ChoiceAlert[] {
  const categoryMap = groupByCategory(items)
  const alerts: ChoiceAlert[] = []

  for (const [category, categoryItems] of Object.entries(categoryMap)) {
    if (categoryItems.length <= CHOICE_THRESHOLD) continue

    const severity = categoryItems.length >= CHOICE_CRITICAL_THRESHOLD ? 'critical' : 'warning'

    // Build cut recommendations: Dogs first, then lowest-margin Plowhorses
    const dogs = categoryItems
      .filter(item => item.classification === 'dog')
      .sort((a, b) => a.totalProfit - b.totalProfit)

    const lowPlowhorses = categoryItems
      .filter(item => item.classification === 'plowhorse')
      .sort((a, b) => a.contributionMargin - b.contributionMargin)

    const cutRecommendations: { item: MenuItem; reason: string }[] = []

    // How many to cut to reach threshold
    const excess = categoryItems.length - CHOICE_THRESHOLD

    for (const dog of dogs) {
      if (cutRecommendations.length >= excess) break
      cutRecommendations.push({
        item: dog,
        reason: `Dog — low profit ($${dog.contributionMargin.toFixed(2)} margin) and low popularity (${dog.salesMixPercent.toFixed(1)}% mix)`,
      })
    }

    for (const ph of lowPlowhorses) {
      if (cutRecommendations.length >= excess) break
      cutRecommendations.push({
        item: ph,
        reason: `Plowhorse — popular but lowest margin in category ($${ph.contributionMargin.toFixed(2)})`,
      })
    }

    const message = severity === 'critical'
      ? `${category} has ${categoryItems.length} items — decision paralysis territory. Customers default to cheapest option.`
      : `${category} has ${categoryItems.length} items — above the 7-item threshold. Customers struggle to choose.`

    alerts.push({
      category,
      itemCount: categoryItems.length,
      threshold: CHOICE_THRESHOLD,
      severity,
      message,
      cutRecommendations,
    })
  }

  return alerts
}

// ===== Feature 9: Social Proof Recommender =====

export function recommendBadges(items: MenuItem[]): CategoryBadges[] {
  const categoryMap = groupByCategory(items)
  const results: CategoryBadges[] = []

  for (const [category, categoryItems] of Object.entries(categoryMap)) {
    if (categoryItems.length === 0) continue

    const badges: BadgeRecommendation[] = []

    // "Most Popular" — highest sales volume item
    const sortedByPopularity = [...categoryItems].sort((a, b) => b.unitsSold - a.unitsSold)
    const mostPopular = sortedByPopularity[0]

    if (mostPopular && mostPopular.unitsSold > 0) {
      badges.push({
        item: mostPopular,
        badgeType: 'most-popular',
        badgeText: 'Most Popular',
        reason: `Highest sales volume in ${category} (${mostPopular.unitsSold} units)`,
      })
    }

    // "Chef's Pick" — highest-margin Star (not same item as Most Popular)
    const stars = categoryItems
      .filter(item => item.classification === 'star' && item.id !== mostPopular?.id)
      .sort((a, b) => b.contributionMargin - a.contributionMargin)

    if (stars.length > 0) {
      badges.push({
        item: stars[0],
        badgeType: 'chef-pick',
        badgeText: "Chef's Pick",
        reason: `Highest-margin Star in ${category} ($${stars[0].contributionMargin.toFixed(2)} margin)`,
      })
    }

    // If no Stars available for Chef's Pick, use highest-margin Puzzle
    if (stars.length === 0) {
      const puzzles = categoryItems
        .filter(item => item.classification === 'puzzle' && item.id !== mostPopular?.id)
        .sort((a, b) => b.contributionMargin - a.contributionMargin)

      if (puzzles.length > 0) {
        badges.push({
          item: puzzles[0],
          badgeType: 'chef-pick',
          badgeText: "Chef's Pick",
          reason: `Highest-margin Puzzle in ${category} — badge can boost visibility ($${puzzles[0].contributionMargin.toFixed(2)} margin)`,
        })
      }
    }

    // Enforce max 2 badges per category
    results.push({
      category,
      badges: badges.slice(0, MAX_BADGES_PER_CATEGORY),
    })
  }

  return results
}

// ===== Feature 10: Price Anchoring Advisor =====

export function analyzeAnchoring(items: MenuItem[]): AnchorAnalysis[] {
  const categoryMap = groupByCategory(items)
  const results: AnchorAnalysis[] = []

  for (const [category, categoryItems] of Object.entries(categoryMap)) {
    if (categoryItems.length < 2) {
      results.push({
        category,
        anchorItem: categoryItems[0] || null,
        targetItems: [],
        hasEffectiveAnchor: false,
        warning: categoryItems.length === 0
          ? 'No items in this category.'
          : 'Only 1 item — no anchoring possible.',
      })
      continue
    }

    const sorted = [...categoryItems].sort((a, b) => b.menuPrice - a.menuPrice)
    const anchorItem = sorted[0]
    const otherItems = sorted.slice(1)

    // Calculate price spread
    const lowestPrice = sorted[sorted.length - 1].menuPrice
    const priceSpread = anchorItem.menuPrice > 0
      ? ((anchorItem.menuPrice - lowestPrice) / anchorItem.menuPrice) * 100
      : 0

    const hasEffectiveAnchor = priceSpread >= ANCHOR_MIN_GAP_PERCENT

    let warning: string | null = null
    if (priceSpread < ANCHOR_MIN_GAP_PERCENT) {
      warning = `All items in ${category} are within ${priceSpread.toFixed(0)}% of each other — no anchoring effect. Consider adding a premium item.`
    } else if (priceSpread < ANCHOR_WEAK_GAP_PERCENT) {
      warning = `Weak anchor in ${category} — only ${priceSpread.toFixed(0)}% price spread. A stronger premium item would increase contrast.`
    }

    const targetItems = otherItems.map(item => {
      const gap = anchorItem.menuPrice - item.menuPrice
      const gapPercent = anchorItem.menuPrice > 0
        ? (gap / anchorItem.menuPrice) * 100
        : 0

      let recommendation: string
      if (gapPercent >= 30) {
        recommendation = `Strong contrast — $${anchorItem.menuPrice.toFixed(0)} anchor makes $${item.menuPrice.toFixed(0)} ${item.name} look like a deal`
      } else if (gapPercent >= 20) {
        recommendation = `Moderate contrast — the ${gapPercent.toFixed(0)}% gap creates some anchoring effect`
      } else {
        recommendation = `Weak contrast — only ${gapPercent.toFixed(0)}% below anchor. Consider widening the gap`
      }

      return {
        item,
        contrastGap: gap,
        contrastPercent: gapPercent,
        recommendation,
      }
    })

    results.push({
      category,
      anchorItem,
      targetItems,
      hasEffectiveAnchor,
      warning,
    })
  }

  return results
}

// ===== Feature 11: Decoy Pricing Detector =====

export function analyzeDecoys(items: MenuItem[]): DecoyAnalysis[] {
  const categoryMap = groupByCategory(items)
  const results: DecoyAnalysis[] = []

  for (const [category, categoryItems] of Object.entries(categoryMap)) {
    if (categoryItems.length < 3) {
      results.push({
        category,
        opportunities: [],
        recommendation: categoryItems.length < 3
          ? `${category} needs at least 3 items for decoy pricing to work.`
          : null,
      })
      continue
    }

    const sorted = [...categoryItems].sort((a, b) => a.menuPrice - b.menuPrice)
    const opportunities: DecoyOpportunity[] = []

    // Look for pairs where a more expensive item is within 10-15% of another
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const cheaper = sorted[i]
        const pricier = sorted[j]
        const gapPercent = pricier.menuPrice > 0
          ? ((pricier.menuPrice - cheaper.menuPrice) / pricier.menuPrice) * 100
          : 0

        // Decoy zone: gap between 5% and 15%
        if (gapPercent >= DECOY_MIN_GAP_PERCENT && gapPercent <= DECOY_MAX_GAP_PERCENT) {
          // The cheaper item with lower margin is the decoy, pricier is the target
          const decoyIsLowerMargin = cheaper.contributionMargin < pricier.contributionMargin

          if (decoyIsLowerMargin) {
            let effectiveness: 'strong' | 'moderate' | 'weak'
            if (gapPercent <= 8) effectiveness = 'strong'
            else if (gapPercent <= 12) effectiveness = 'moderate'
            else effectiveness = 'weak'

            opportunities.push({
              category,
              decoyItem: cheaper,
              targetItem: pricier,
              priceGapPercent: gapPercent,
              effectiveness,
              explanation: `${pricier.name} at $${pricier.menuPrice.toFixed(0)} is only ${gapPercent.toFixed(0)}% more than ${cheaper.name} at $${cheaper.menuPrice.toFixed(0)} — customers will upgrade. ${cheaper.name} is the decoy.`,
            })
          }
        }
      }
    }

    const recommendation = opportunities.length === 0
      ? `No decoy patterns found in ${category}. Consider pricing a mid-tier item within 10-15% of your target to create an upgrade effect.`
      : null

    results.push({ category, opportunities, recommendation })
  }

  return results
}

// ===== Feature 12: Description Quality Scorer =====

export function scoreDescription(description: string): DescriptionScore {
  const lower = description.toLowerCase()
  const words = description.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  // 1. Sensory words (max 25 points)
  const foundSensory = SENSORY_WORDS.filter(word => lower.includes(word))
  const sensoryScore = Math.min(25, foundSensory.length * 8)

  // 2. Geographic origin (max 20 points)
  const hasOrigin = /\b(valley|mountain|farm|region|local|island|coast|forest|river|imported|hudson|vermont|italian|french|japanese|mexican|thai|spanish|greek|indian|korean|black forest|bavarian|yukon|pacific|atlantic|mediterranean)\b/i.test(description)
  const originScore = hasOrigin ? 20 : 0

  // 3. Preparation method (max 20 points)
  const foundPrep = PREPARATION_WORDS.filter(word => lower.includes(word))
  const prepScore = Math.min(20, foundPrep.length * 10)

  // 4. Emotional/nostalgic language (max 15 points)
  const foundEmotional = EMOTIONAL_WORDS.filter(word => lower.includes(word))
  const emotionalScore = Math.min(15, foundEmotional.length * 8)

  // 5. Optimal length: 8-25 words is ideal (max 10 points)
  let lengthScore = 0
  if (wordCount >= 8 && wordCount <= 25) lengthScore = 10
  else if (wordCount >= 5 && wordCount <= 35) lengthScore = 5

  // 6. No price pain triggers (max 10 points)
  const hasPricePain = /\$|€|£|\bprice\b|\bcost\b|\bcheap\b|\bbudget\b|\baffordable\b/i.test(description)
  const pricePainScore = hasPricePain ? 0 : 10

  const criteria: DescriptionScoreCriteria = {
    sensoryWords: { score: sensoryScore, maxScore: 25, found: foundSensory },
    geographicOrigin: { score: originScore, maxScore: 20, found: hasOrigin },
    preparationMethod: { score: prepScore, maxScore: 20, found: foundPrep },
    emotionalLanguage: { score: emotionalScore, maxScore: 15, found: foundEmotional },
    optimalLength: { score: lengthScore, maxScore: 10, wordCount },
    noPricePain: { score: pricePainScore, maxScore: 10, clean: !hasPricePain },
  }

  const totalScore = sensoryScore + originScore + prepScore + emotionalScore + lengthScore + pricePainScore
  const maxScore = 100

  // Build improvement suggestions
  const improvements: string[] = []
  if (sensoryScore < 16) improvements.push('Add sensory adjectives (crispy, velvety, smoky, tender, golden)')
  if (originScore === 0) improvements.push('Reference geographic origin of key ingredients (e.g., "Hudson Valley," "Black Forest")')
  if (prepScore < 10) improvements.push('Include preparation method (slow-braised, wood-fired, house-made)')
  if (emotionalScore === 0) improvements.push('Add nostalgic or storytelling elements (heritage, traditional, family recipe)')
  if (lengthScore < 10) {
    if (wordCount < 8) improvements.push('Description is too short — aim for 8-25 words with sensory detail')
    else improvements.push('Description is too long — tighten to 8-25 words for best results')
  }
  if (pricePainScore === 0) improvements.push('Remove price references and dollar signs from the description')

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    criteria,
    improvements,
  }
}

// ===== Feature 13: Golden Triangle Placement Advisor =====

export function recommendPlacements(items: MenuItem[]): CategoryPlacement[] {
  const categoryMap = groupByCategory(items)
  const results: CategoryPlacement[] = []

  for (const [category, categoryItems] of Object.entries(categoryMap)) {
    if (categoryItems.length === 0) continue

    const placements: PlacementRecommendation[] = []

    // Sort by classification priority: stars first, then puzzles, plowhorses, dogs
    const prioritized = [...categoryItems].sort((a, b) => {
      const order = { star: 0, puzzle: 1, plowhorse: 2, dog: 3 }
      return order[a.classification] - order[b.classification]
    })

    for (let i = 0; i < prioritized.length; i++) {
      const item = prioritized[i]
      let zone: PlacementRecommendation['zone']
      let priority: number
      let reason: string

      switch (item.classification) {
        case 'star':
          if (i === 0) {
            zone = 'golden-center'
            priority = 1
            reason = 'Star item — place in Golden Triangle center for maximum visibility'
          } else {
            zone = 'first-in-category'
            priority = 2
            reason = 'Star item — first position in category (primacy effect)'
          }
          break
        case 'puzzle':
          zone = 'last-in-category'
          priority = 3
          reason = 'Puzzle — high margin, needs visibility boost. Last position uses recency effect.'
          break
        case 'plowhorse':
          zone = 'middle'
          priority = 4
          reason = 'Plowhorse — already popular, middle position frees prime spots for higher-margin items'
          break
        case 'dog':
          if (item.totalProfit <= 0) {
            zone = 'remove'
            priority = 6
            reason = 'Dog with zero/negative profit — remove from menu'
          } else {
            zone = 'bottom'
            priority = 5
            reason = 'Dog — bottom position, de-emphasize. Consider removing if no improvement after 30 days.'
          }
          break
      }

      placements.push({ item, zone, priority, reason })
    }

    // Sort by priority for display
    placements.sort((a, b) => a.priority - b.priority)

    results.push({ category, placements })
  }

  return results
}

// ===== Feature 14: Revenue Impact Simulator =====

export function simulateChange(items: MenuItem[], input: SimulationInput): SimulationResult | null {
  const item = items.find(i => i.id === input.itemId)
  if (!item) return null

  const currentMonthlyUnits = item.unitsSold
  const currentMonthlyProfit = item.totalProfit

  let projectedMonthlyProfit: number
  let explanation: string

  switch (input.action) {
    case 'price-change': {
      const newPrice = input.newPrice ?? item.menuPrice
      const newMargin = newPrice - item.foodCost
      projectedMonthlyProfit = newMargin * currentMonthlyUnits
      const delta = projectedMonthlyProfit - currentMonthlyProfit
      explanation = `Price change $${item.menuPrice.toFixed(2)} → $${newPrice.toFixed(2)}: ${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}/month at current volume`
      break
    }
    case 'item-removal': {
      projectedMonthlyProfit = 0
      explanation = `Removing ${item.name} eliminates $${currentMonthlyProfit.toFixed(2)}/month profit but frees menu space and reduces kitchen complexity`
      break
    }
    case 'repositioning': {
      const salesIncrease = input.salesChangePercent ?? RESEARCH_DEFAULTS.repositioningOrderIncrease
      const newUnits = Math.round(currentMonthlyUnits * (1 + salesIncrease))
      projectedMonthlyProfit = item.contributionMargin * newUnits
      explanation = `Repositioning to prime menu spot: +${(salesIncrease * 100).toFixed(0)}% orders (${currentMonthlyUnits} → ${newUnits} units). Research: Golden Triangle placement boosts orders ~20%.`
      break
    }
    case 'description-upgrade': {
      const salesIncrease = input.salesChangePercent ?? RESEARCH_DEFAULTS.descriptionUpgradeSalesIncrease
      const newUnits = Math.round(currentMonthlyUnits * (1 + salesIncrease))
      projectedMonthlyProfit = item.contributionMargin * newUnits
      explanation = `Description upgrade: +${(salesIncrease * 100).toFixed(0)}% orders (${currentMonthlyUnits} → ${newUnits} units). Cornell research: descriptive labels increase sales by 27%.`
      break
    }
    default:
      return null
  }

  const monthlyDelta = projectedMonthlyProfit - currentMonthlyProfit

  return {
    action: input.action,
    itemName: item.name,
    currentMonthlyProfit,
    projectedMonthlyProfit,
    monthlyDelta,
    annualDelta: monthlyDelta * 12,
    explanation,
  }
}

// ===== Feature 15: Menu Health Checklist =====

export function calculateMenuHealth(items: MenuItem[]): MenuHealthScore {
  const categoryMap = groupByCategory(items)
  const categories = Object.keys(categoryMap)
  const healthItems: MenuHealthItem[] = []

  // --- Layout (3 items) ---
  // 1. Categories within 7-item threshold
  const allCategoriesUnder7 = categories.every(cat => categoryMap[cat].length <= CHOICE_THRESHOLD)
  healthItems.push({
    id: 'layout-category-size',
    label: 'All categories have 7 or fewer items',
    category: 'layout',
    autoScored: true,
    passed: allCategoriesUnder7,
    details: allCategoriesUnder7
      ? 'Good — all categories within choice architecture threshold'
      : `${categories.filter(c => categoryMap[c].length > CHOICE_THRESHOLD).join(', ')} exceed${categories.filter(c => categoryMap[c].length > CHOICE_THRESHOLD).length === 1 ? 's' : ''} 7 items`,
  })

  // 2. Has items classified (data entered)
  const hasClassifiedItems = items.length >= 5
  healthItems.push({
    id: 'layout-items-classified',
    label: 'At least 5 menu items classified',
    category: 'layout',
    autoScored: true,
    passed: hasClassifiedItems,
    details: hasClassifiedItems
      ? `${items.length} items classified`
      : `Only ${items.length} items — need at least 5 for meaningful analysis`,
  })

  // 3. Golden Triangle placement applied (manual check)
  healthItems.push({
    id: 'layout-golden-triangle',
    label: 'High-margin items placed in Golden Triangle zones',
    category: 'layout',
    autoScored: false,
    passed: false,
    details: 'Check your physical menu: are Stars in center, top-right, or top-left positions?',
  })

  // --- Pricing (4 items) ---
  // 4. No dollar signs (manual)
  healthItems.push({
    id: 'pricing-no-dollar-signs',
    label: 'Menu prices shown without dollar signs',
    category: 'pricing',
    autoScored: false,
    passed: false,
    details: 'Removing $ reduces price pain. Use "32" instead of "$32". Research shows 8% average spend increase.',
  })

  // 5. No price column (manual)
  healthItems.push({
    id: 'pricing-no-column',
    label: 'Prices embedded in descriptions, not in a column',
    category: 'pricing',
    autoScored: false,
    passed: false,
    details: 'Price columns encourage comparison shopping. Nest the price at the end of each description.',
  })

  // 6. Anchor item per category
  const anchorAnalysis = analyzeAnchoring(items)
  const categoriesWithAnchor = anchorAnalysis.filter(a => a.hasEffectiveAnchor).length
  const anchorPassed = categories.length > 0 && categoriesWithAnchor >= Math.ceil(categories.length * 0.5)
  healthItems.push({
    id: 'pricing-anchoring',
    label: 'Price anchoring present in most categories',
    category: 'pricing',
    autoScored: true,
    passed: anchorPassed,
    details: anchorPassed
      ? `${categoriesWithAnchor} of ${categories.length} categories have effective price anchors`
      : `Only ${categoriesWithAnchor} of ${categories.length} categories have anchoring. Add premium items to create contrast.`,
  })

  // 7. Contribution margins calculated for all items
  const allMarginsPositive = items.length > 0 && items.every(item => item.contributionMargin > 0)
  healthItems.push({
    id: 'pricing-margins',
    label: 'All items have positive contribution margins',
    category: 'pricing',
    autoScored: true,
    passed: allMarginsPositive,
    details: allMarginsPositive
      ? 'All items contribute positive margin'
      : `${items.filter(i => i.contributionMargin <= 0).length} items have zero or negative margins — reprice or remove`,
  })

  // --- Descriptions (3 items, all manual) ---
  healthItems.push({
    id: 'desc-sensory',
    label: 'Menu descriptions use sensory language',
    category: 'descriptions',
    autoScored: false,
    passed: false,
    details: 'Use words like crispy, velvety, smoky, tender. Increases sales 27% (Cornell research).',
  })

  healthItems.push({
    id: 'desc-origin',
    label: 'Key ingredients reference geographic origin',
    category: 'descriptions',
    autoScored: false,
    passed: false,
    details: 'e.g., "Hudson Valley duck," "aged Vermont cheddar." Origin labels boost sales up to 20%.',
  })

  healthItems.push({
    id: 'desc-length',
    label: 'Descriptions are 2-3 lines (8-25 words)',
    category: 'descriptions',
    autoScored: false,
    passed: false,
    details: 'Too short loses persuasion. Too long loses attention. 2-3 lines is the sweet spot.',
  })

  // --- Psychology (3 items) ---
  // 11. Social proof badges used sparingly
  healthItems.push({
    id: 'psych-badges',
    label: 'Social proof badges on 1-2 items per category',
    category: 'psychology',
    autoScored: false,
    passed: false,
    details: '"Most Popular" or "Chef\'s Pick" on 1-2 items per section. Increases orders 23%. Overuse dilutes effect.',
  })

  // 12. Has Stars to protect
  const starCount = items.filter(i => i.classification === 'star').length
  healthItems.push({
    id: 'psych-stars-identified',
    label: 'Star items identified and protected',
    category: 'psychology',
    autoScored: true,
    passed: starCount >= 1,
    details: starCount >= 1
      ? `${starCount} Star items identified — feature and protect these`
      : 'No Stars found. Review pricing and popularity data.',
  })

  // 13. Dogs addressed
  const dogCount = items.filter(i => i.classification === 'dog').length
  const dogsPassed = items.length > 0 && (dogCount / items.length) < 0.25
  healthItems.push({
    id: 'psych-dogs-managed',
    label: 'Dog items under 25% of total menu',
    category: 'psychology',
    autoScored: true,
    passed: dogsPassed,
    details: dogsPassed
      ? `${dogCount} Dogs out of ${items.length} items (${((dogCount / items.length) * 100).toFixed(0)}%)`
      : `${dogCount} Dogs out of ${items.length} items (${((dogCount / items.length) * 100).toFixed(0)}%) — too many low performers. Cut or re-engineer.`,
  })

  // --- Data (2 items) ---
  // 14. Regular review cycle (manual)
  healthItems.push({
    id: 'data-review-cycle',
    label: 'Menu reviewed on a regular schedule (monthly)',
    category: 'data',
    autoScored: false,
    passed: false,
    details: 'Block 30 minutes monthly for menu performance review. No exceptions.',
  })

  // 15. Multi-category coverage
  const hasMultipleCategories = categories.length >= 3
  healthItems.push({
    id: 'data-categories',
    label: 'At least 3 menu categories analyzed',
    category: 'data',
    autoScored: true,
    passed: hasMultipleCategories,
    details: hasMultipleCategories
      ? `${categories.length} categories analyzed`
      : `Only ${categories.length} categories — add more for a complete picture`,
  })

  // Calculate score
  const totalScore = healthItems.filter(item => item.passed).length
  const maxScore = healthItems.length

  return {
    items: healthItems,
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
  }
}

// ===== Utility =====

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  const map: Record<string, MenuItem[]> = {}
  for (const item of items) {
    if (!map[item.category]) map[item.category] = []
    map[item.category].push(item)
  }
  return map
}
