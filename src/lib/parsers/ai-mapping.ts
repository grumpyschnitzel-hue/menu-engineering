/**
 * AI Column Mapping — client-side function to call the AI column mapping API.
 * Used when alias-based detection doesn't find all required columns.
 * Falls back gracefully if the API is unavailable.
 */

import type { ColumnMappingSuggestion } from './types'

/**
 * Get AI-powered column mapping suggestions.
 * Sends headers and sample rows to Claude for analysis.
 *
 * @returns Array of suggestions, or empty array if AI is unavailable
 */
export async function getAIMappingSuggestions(
  headers: string[],
  sampleRows: string[][]
): Promise<ColumnMappingSuggestion[]> {
  try {
    const res = await fetch('/api/ai/column-mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, sampleRows: sampleRows.slice(0, 3) }),
    })

    if (!res.ok) {
      // AI not available — fail silently
      return []
    }

    const data = await res.json()

    if (!data.success || !data.suggestions) {
      return []
    }

    return data.suggestions as ColumnMappingSuggestion[]
  } catch {
    // Network error or API unavailable — fail silently
    return []
  }
}

/**
 * Apply AI suggestions to a mapping state.
 * Only applies suggestions that don't override existing (user or alias-detected) mappings.
 */
export function applyAISuggestions(
  currentMapping: Record<string, number | null>,
  suggestions: ColumnMappingSuggestion[]
): { mapping: Record<string, number | null>; applied: ColumnMappingSuggestion[] } {
  const newMapping = { ...currentMapping }
  const applied: ColumnMappingSuggestion[] = []

  for (const suggestion of suggestions) {
    // Only apply if the field isn't already mapped
    if (newMapping[suggestion.field] == null && suggestion.confidence >= 0.5) {
      newMapping[suggestion.field] = suggestion.columnIndex
      applied.push(suggestion)
    }
  }

  return { mapping: newMapping, applied }
}
