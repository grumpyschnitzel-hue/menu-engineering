/**
 * Cost Matcher — Fuzzy matches invoice items to existing menu items
 * for the "Update Costs Only" import mode.
 *
 * Used when importing Sysco/vendor invoices that only have cost data
 * (no menu prices or units sold).
 */

import type { MenuItemInput } from '@/lib/types'

export interface CostMatch {
  invoiceItemName: string
  invoiceCost: number
  matchedMenuItemId: string | null
  matchedMenuItemName: string | null
  oldCost: number | null
  newCost: number
  costChange: number | null
  costChangePercent: number | null
  confidence: number // 0-1
}

/**
 * Normalize a product name for matching.
 * Strips common invoice noise: pack sizes, UPCs, brand suffixes.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common Sysco suffixes like "(Sysco Brand)"
    .replace(/\(.*?\)/g, '')
    // Remove pack sizes like "2/3 KG", "48/82 GR", "1/6.8KG"
    .replace(/\d+\/[\d.]+\s*(?:kg|gr|oz|lb|ml|lt|ct|sl|g)\b/gi, '')
    // Remove standalone measurements (including trailing periods like "in.")
    .replace(/\b\d+\.?\d*\s*(?:in|inch|oz|lb|kg|gr|ml|lt|ct|g)\.?\b/gi, '')
    // Remove UPC-like numbers (6+ digits)
    .replace(/\b\d{6,}\b/g, '')
    // Remove percentage notations like "20% MF"
    .replace(/\d+%\s*\w*/g, '')
    // Remove stray periods and punctuation left behind
    .replace(/\s*\.\s*/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate token overlap between two normalized names.
 * Returns a score from 0-1 based on shared words.
 */
export function tokenOverlap(a: string, b: string): number {
  const arrA = a.split(/\s+/).filter(t => t.length > 1)
  const arrB = b.split(/\s+/).filter(t => t.length > 1)
  const tokensB = new Set(arrB)

  if (arrA.length === 0 || arrB.length === 0) return 0

  let matches = 0
  arrA.forEach(token => {
    if (tokensB.has(token)) matches++
  })

  // Score based on how many tokens from the shorter name are found in the longer
  const minSize = Math.min(arrA.length, arrB.length)
  return matches / minSize
}

/**
 * Match invoice items to existing menu items using fuzzy name matching.
 *
 * Matching strategy:
 * 1. Exact match on normalized names (confidence: 1.0)
 * 2. One name contains the other (confidence: 0.85)
 * 3. Token overlap > 50% (confidence: scaled 0.5-0.8)
 */
export function matchInvoiceToMenu(
  invoiceItems: { name: string; cost: number }[],
  existingItems: (MenuItemInput & { id: string })[]
): CostMatch[] {
  const normalizedExisting = existingItems.map(item => ({
    ...item,
    normalized: normalizeName(item.name),
  }))

  return invoiceItems.map(invoiceItem => {
    const normalizedInvoice = normalizeName(invoiceItem.name)

    let bestMatch: {
      item: typeof normalizedExisting[0]
      confidence: number
    } | null = null

    for (const existing of normalizedExisting) {
      let confidence = 0

      // Strategy 1: Exact match
      if (normalizedInvoice === existing.normalized) {
        confidence = 1.0
      }
      // Strategy 2: Contains match
      else if (normalizedInvoice.includes(existing.normalized) || existing.normalized.includes(normalizedInvoice)) {
        confidence = 0.85
      }
      // Strategy 3: Token overlap
      else {
        const overlap = tokenOverlap(normalizedInvoice, existing.normalized)
        if (overlap >= 0.5) {
          confidence = 0.5 + (overlap * 0.3) // Scale to 0.5-0.8
        }
      }

      if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { item: existing, confidence }
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.5) {
      const oldCost = bestMatch.item.foodCost
      const costChange = invoiceItem.cost - oldCost
      const costChangePercent = oldCost > 0 ? (costChange / oldCost) * 100 : null

      return {
        invoiceItemName: invoiceItem.name,
        invoiceCost: invoiceItem.cost,
        matchedMenuItemId: bestMatch.item.id,
        matchedMenuItemName: bestMatch.item.name,
        oldCost,
        newCost: invoiceItem.cost,
        costChange,
        costChangePercent,
        confidence: bestMatch.confidence,
      }
    }

    return {
      invoiceItemName: invoiceItem.name,
      invoiceCost: invoiceItem.cost,
      matchedMenuItemId: null,
      matchedMenuItemName: null,
      oldCost: null,
      newCost: invoiceItem.cost,
      costChange: null,
      costChangePercent: null,
      confidence: 0,
    }
  })
}
