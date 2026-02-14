import { generateDescription, generateDescriptionWithPosition } from '../lib/descriptions'
import { DescriptionInput, MenuItem } from '../lib/types'

function makeDescriptionInput(overrides: Partial<DescriptionInput> = {}): DescriptionInput {
  return {
    cookingMethod: 'Grilled',
    origin: 'locally sourced',
    keyIngredient: 'salmon',
    flavorProfile: ['Smoky', 'Rich'],
    dietaryTags: ['GF'],
    ...overrides,
  }
}

function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: '1',
    name: 'Test Item',
    category: 'Mains',
    menuPrice: 30,
    foodCost: 10,
    unitsSold: 200,
    periodDays: 30,
    contributionMargin: 20,
    foodCostPercent: 33.33,
    totalProfit: 4000,
    salesMixPercent: 20,
    classification: 'star',
    recommendedAction: 'Keep & feature',
    ...overrides,
  }
}

describe('generateDescription', () => {
  it('returns a non-empty string', () => {
    const result = generateDescription(makeDescriptionInput())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the key ingredient', () => {
    const result = generateDescription(makeDescriptionInput({ keyIngredient: 'ribeye' }))
    expect(result.toLowerCase()).toContain('ribeye')
  })

  it('includes the cooking method', () => {
    const result = generateDescription(makeDescriptionInput({ cookingMethod: 'Braised' }))
    expect(result.toLowerCase()).toContain('brais')
  })

  it('includes dietary tags when provided', () => {
    const result = generateDescription(makeDescriptionInput({ dietaryTags: ['GF', 'V'] }))
    expect(result).toContain('GF')
  })

  it('handles empty dietary tags', () => {
    const result = generateDescription(makeDescriptionInput({ dietaryTags: [] }))
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty flavor profile gracefully', () => {
    const result = generateDescription(makeDescriptionInput({ flavorProfile: [] }))
    expect(typeof result).toBe('string')
  })

  it('includes origin when provided', () => {
    // Run multiple times since template is random — at least one should include origin
    const inputs = makeDescriptionInput({ origin: 'Okanagan Valley' })
    const results = Array.from({ length: 20 }, () => generateDescription(inputs))
    const hasOrigin = results.some(r => r.toLowerCase().includes('okanagan'))
    expect(hasOrigin).toBe(true)
  })

  it('works without origin', () => {
    const result = generateDescription(makeDescriptionInput({ origin: '' }))
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('generateDescriptionWithPosition', () => {
  const allStars = [
    makeMenuItem({ id: 's1', name: 'Star Starter', category: 'Starters', classification: 'star' }),
    makeMenuItem({ id: 's2', name: 'Star Main', category: 'Mains', classification: 'star' }),
  ]

  it('returns description, menuPosition, and pairingSuggestion', () => {
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem(),
      allStars
    )
    expect(result).toHaveProperty('description')
    expect(result).toHaveProperty('menuPosition')
    expect(result).toHaveProperty('pairingSuggestion')
  })

  it('recommends featuring stars', () => {
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem({ classification: 'star' }),
      allStars
    )
    expect(result.menuPosition).toContain('Feature')
  })

  it('recommends repositioning puzzles', () => {
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem({ classification: 'puzzle' }),
      allStars
    )
    expect(result.menuPosition).toContain('Reposition')
  })

  it('gives standard position for plowhorses', () => {
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem({ classification: 'plowhorse' }),
      allStars
    )
    expect(result.menuPosition).toContain('Standard')
  })

  it('gives standard position for dogs', () => {
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem({ classification: 'dog' }),
      allStars
    )
    expect(result.menuPosition).toContain('Standard')
  })

  it('suggests pairing with a star from a different category', () => {
    const mainItem = makeMenuItem({ category: 'Mains', classification: 'puzzle' })
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      mainItem,
      allStars
    )
    // Should pair with a Star from Starters (different category)
    expect(result.pairingSuggestion).toContain('Star Starter')
  })

  it('returns null pairing when no stars exist', () => {
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem(),
      []
    )
    expect(result.pairingSuggestion).toBeNull()
  })

  it('returns null pairing when all stars are same category', () => {
    const sameCategory = [
      makeMenuItem({ id: 's1', name: 'Star 1', category: 'Mains', classification: 'star' }),
      makeMenuItem({ id: 's2', name: 'Star 2', category: 'Mains', classification: 'star' }),
    ]
    const result = generateDescriptionWithPosition(
      makeDescriptionInput(),
      makeMenuItem({ category: 'Mains' }),
      sameCategory
    )
    expect(result.pairingSuggestion).toBeNull()
  })
})
