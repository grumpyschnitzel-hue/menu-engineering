/**
 * Shared types for the multi-format data ingestion pipeline.
 * All parsers (CSV, PDF, image) output ParsedExtraction,
 * which feeds into the existing column mapping + preview UI.
 */

export type FileSourceType = 'csv' | 'pdf' | 'image'

export type ImportMode = 'merge' | 'replace' | 'update-costs'

export interface ParsedExtraction {
  sourceType: FileSourceType
  headers: string[]
  rows: string[][]
  rawData: Record<string, string>[]
  confidence?: number // 0-1, how confident the parser is in extraction quality
  warnings?: string[]
  metadata?: {
    pageCount?: number
    vendorDetected?: string
    totalItemsFound?: number
  }
}

export interface ParserResult {
  success: boolean
  data?: ParsedExtraction
  error?: string
}

export interface ColumnMappingSuggestion {
  field: 'name' | 'category' | 'menuPrice' | 'foodCost' | 'unitsSold'
  columnIndex: number
  confidence: number // 0-1
  reason: string
}

export interface PartialColumnMapping {
  name: number
  category?: number
  menuPrice?: number
  foodCost: number
  unitsSold?: number
  // Optional invoice-specific fields for display/context
  packSize?: number
  brand?: number
  itemCode?: number
}
