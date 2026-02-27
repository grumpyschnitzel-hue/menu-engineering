import { applyAISuggestions } from '@/lib/parsers/ai-mapping'
import type { ColumnMappingSuggestion } from '@/lib/parsers/types'

// Note: getAIMappingSuggestions makes fetch calls and is tested via integration.
// These tests focus on the pure logic in applyAISuggestions.

describe('applyAISuggestions', () => {
  it('applies suggestions to empty mapping fields', () => {
    const currentMapping = {
      name: null,
      category: null,
      menuPrice: null,
      foodCost: null,
      unitsSold: null,
    }

    const suggestions: ColumnMappingSuggestion[] = [
      { field: 'name', columnIndex: 4, confidence: 0.95, reason: 'Product Name column' },
      { field: 'foodCost', columnIndex: 10, confidence: 0.85, reason: 'Price column' },
    ]

    const { mapping, applied } = applyAISuggestions(currentMapping, suggestions)

    expect(mapping.name).toBe(4)
    expect(mapping.foodCost).toBe(10)
    expect(mapping.category).toBeNull()
    expect(applied.length).toBe(2)
  })

  it('does not override existing mappings', () => {
    const currentMapping = {
      name: 0, // Already mapped by alias detection
      category: null,
      menuPrice: null,
      foodCost: null,
      unitsSold: null,
    }

    const suggestions: ColumnMappingSuggestion[] = [
      { field: 'name', columnIndex: 4, confidence: 0.95, reason: 'AI thinks this is name' },
      { field: 'foodCost', columnIndex: 10, confidence: 0.85, reason: 'Price column' },
    ]

    const { mapping, applied } = applyAISuggestions(currentMapping, suggestions)

    expect(mapping.name).toBe(0) // Kept original
    expect(mapping.foodCost).toBe(10) // Applied AI suggestion
    expect(applied.length).toBe(1) // Only foodCost was applied
  })

  it('ignores suggestions with low confidence', () => {
    const currentMapping = {
      name: null,
      category: null,
      menuPrice: null,
      foodCost: null,
      unitsSold: null,
    }

    const suggestions: ColumnMappingSuggestion[] = [
      { field: 'name', columnIndex: 0, confidence: 0.9, reason: 'High confidence' },
      { field: 'category', columnIndex: 1, confidence: 0.3, reason: 'Low confidence' },
    ]

    const { mapping, applied } = applyAISuggestions(currentMapping, suggestions)

    expect(mapping.name).toBe(0)
    expect(mapping.category).toBeNull() // Not applied (confidence < 0.5)
    expect(applied.length).toBe(1)
  })

  it('applies all fields when all are suggested with high confidence', () => {
    const currentMapping = {
      name: null,
      category: null,
      menuPrice: null,
      foodCost: null,
      unitsSold: null,
    }

    const suggestions: ColumnMappingSuggestion[] = [
      { field: 'name', columnIndex: 0, confidence: 0.95, reason: 'Name column' },
      { field: 'category', columnIndex: 1, confidence: 0.8, reason: 'Category column' },
      { field: 'menuPrice', columnIndex: 2, confidence: 0.9, reason: 'Price column' },
      { field: 'foodCost', columnIndex: 3, confidence: 0.85, reason: 'Cost column' },
      { field: 'unitsSold', columnIndex: 4, confidence: 0.7, reason: 'Quantity column' },
    ]

    const { mapping, applied } = applyAISuggestions(currentMapping, suggestions)

    expect(mapping.name).toBe(0)
    expect(mapping.category).toBe(1)
    expect(mapping.menuPrice).toBe(2)
    expect(mapping.foodCost).toBe(3)
    expect(mapping.unitsSold).toBe(4)
    expect(applied.length).toBe(5)
  })

  it('handles empty suggestions array', () => {
    const currentMapping = {
      name: null,
      category: null,
      menuPrice: null,
      foodCost: null,
      unitsSold: null,
    }

    const { mapping, applied } = applyAISuggestions(currentMapping, [])

    expect(mapping.name).toBeNull()
    expect(applied.length).toBe(0)
  })

  it('handles suggestion at exact 0.5 confidence threshold', () => {
    const currentMapping = {
      name: null,
      category: null,
      menuPrice: null,
      foodCost: null,
      unitsSold: null,
    }

    const suggestions: ColumnMappingSuggestion[] = [
      { field: 'name', columnIndex: 0, confidence: 0.5, reason: 'Exactly at threshold' },
    ]

    const { mapping, applied } = applyAISuggestions(currentMapping, suggestions)

    expect(mapping.name).toBe(0) // 0.5 is >= 0.5, so applied
    expect(applied.length).toBe(1)
  })
})
