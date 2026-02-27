/**
 * PDF Parser — Pure functions for transforming pdf-parse table output
 * into ParsedExtraction format.
 *
 * Works with pdf-parse v2's getTable() output which returns structured
 * rows from PDF tables. Tested against real Sysco purchase history PDFs.
 *
 * Sysco table structure (confirmed from real data):
 * Row 0 (header): Combined header text in first cell
 * Row 1+: [#, Agr., Date, (empty), Product Name, Sysco UPC, Pack/Size, Brand, (empty), (empty), Price ($), ...]
 */

import type { ParsedExtraction } from './types'

/** Raw table output from pdf-parse getTable() */
export interface PDFTableResult {
  pages: {
    num: number
    tables: string[][][]  // tables[tableIndex][rowIndex][cellIndex]
  }[]
  total: number
}

/**
 * Known vendor formats for specialized parsing.
 */
export type VendorFormat = 'sysco' | 'usfoods' | 'generic'

/**
 * Detect vendor format from raw PDF text or table headers.
 */
export function detectVendorFormat(text: string): VendorFormat {
  const lower = text.toLowerCase()
  if (lower.includes('sysco') || lower.includes('opco name')) return 'sysco'
  if (lower.includes('us foods') || lower.includes('usfoods')) return 'usfoods'
  return 'generic'
}

/**
 * Clean a Sysco table row by extracting the useful columns.
 *
 * Raw Sysco rows look like:
 * ["1", "No", "11/27/2024", "", "Bread Crumb Plain", "5516812", "1/6.8KG", "SYS CLS\n(Sysco Brand)", "", "", "42.23", "", ...]
 *
 * We extract: #, Date, Product Name, Sysco UPC, Pack/Size, Brand, Price
 */
export function cleanSyscoRow(rawRow: string[]): Record<string, string> | null {
  // Skip rows that don't start with a number (headers, footers, disclaimers)
  const lineNum = rawRow[0]?.trim()
  if (!lineNum || !/^\d+$/.test(lineNum)) return null

  // Extract fields from known positions
  const date = rawRow[2]?.trim() || ''
  const productName = rawRow[4]?.trim() || ''
  const syscoUPC = rawRow[5]?.trim() || ''
  const packSize = rawRow[6]?.trim() || ''
  const brand = (rawRow[7] || '').replace(/\n/g, ' ').trim()

  // Price is in column 10 for Sysco format
  const priceStr = rawRow[10]?.trim() || ''

  if (!productName) return null

  return {
    '#': lineNum,
    'Date': date,
    'Product Name': productName,
    'Sysco UPC': syscoUPC,
    'Pack / Size': packSize,
    'Brand': brand,
    'Price ($)': priceStr,
  }
}

/**
 * Clean a generic table row — uses all non-empty cells.
 */
export function cleanGenericRow(rawRow: string[], headers: string[]): Record<string, string> | null {
  // Skip completely empty rows
  if (rawRow.every(cell => !cell?.trim())) return null

  const result: Record<string, string> = {}
  headers.forEach((header, i) => {
    result[header] = (rawRow[i] || '').replace(/\n/g, ' ').trim()
  })
  return result
}

/**
 * Extract headers from a Sysco-format table.
 * The first row of Sysco tables has a combined header string.
 * We return our cleaned column names.
 */
const SYSCO_HEADERS = ['#', 'Date', 'Product Name', 'Sysco UPC', 'Pack / Size', 'Brand', 'Price ($)']

/**
 * Extract generic headers from the first row of a table.
 * Splits multi-value cells and cleans up.
 */
export function extractGenericHeaders(firstRow: string[]): string[] {
  return firstRow
    .map(cell => (cell || '').replace(/\n/g, ' ').trim())
    .filter(cell => cell.length > 0)
}

/**
 * Main extraction function — transforms pdf-parse getTable() output
 * into a ParsedExtraction that can feed into the column mapping UI.
 */
export function extractTableFromPDFResult(
  tableResult: PDFTableResult,
  fullText?: string
): ParsedExtraction {
  const vendor = detectVendorFormat(
    fullText || tableResult.pages.map(p => p.tables.map(t => t.map(r => r.join(' ')).join(' ')).join(' ')).join(' ')
  )

  if (vendor === 'sysco') {
    return extractSyscoTable(tableResult)
  }

  return extractGenericTable(tableResult)
}

/**
 * Sysco-specific extraction.
 */
function extractSyscoTable(tableResult: PDFTableResult): ParsedExtraction {
  const headers = SYSCO_HEADERS
  const rawData: Record<string, string>[] = []
  const rows: string[][] = []
  const warnings: string[] = []

  for (const page of tableResult.pages) {
    for (const table of page.tables) {
      for (const rawRow of table) {
        const cleaned = cleanSyscoRow(rawRow)
        if (cleaned) {
          rawData.push(cleaned)
          rows.push(headers.map(h => cleaned[h] || ''))
        }
      }
    }
  }

  if (rawData.length === 0) {
    warnings.push('No data rows found in PDF. The table structure may not be recognized.')
  }

  return {
    sourceType: 'pdf',
    headers,
    rows,
    rawData,
    confidence: 0.9,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      pageCount: tableResult.total,
      vendorDetected: 'Sysco',
      totalItemsFound: rawData.length,
    },
  }
}

/**
 * Generic extraction for non-Sysco PDFs.
 * Takes the first row as headers, remaining as data.
 */
function extractGenericTable(tableResult: PDFTableResult): ParsedExtraction {
  const allRows: string[][] = []
  const warnings: string[] = []

  // Collect all rows from all pages
  for (const page of tableResult.pages) {
    for (const table of page.tables) {
      allRows.push(...table)
    }
  }

  if (allRows.length === 0) {
    return {
      sourceType: 'pdf',
      headers: [],
      rows: [],
      rawData: [],
      confidence: 0.3,
      warnings: ['No tables detected in this PDF.'],
      metadata: {
        pageCount: tableResult.total,
        vendorDetected: 'Unknown',
        totalItemsFound: 0,
      },
    }
  }

  // First row is headers
  const headers = extractGenericHeaders(allRows[0])
  const rawData: Record<string, string>[] = []
  const dataRows: string[][] = []

  for (let i = 1; i < allRows.length; i++) {
    const cleaned = cleanGenericRow(allRows[i], headers)
    if (cleaned) {
      rawData.push(cleaned)
      dataRows.push(headers.map(h => cleaned[h] || ''))
    }
  }

  if (rawData.length === 0) {
    warnings.push('Headers detected but no valid data rows found.')
  }

  return {
    sourceType: 'pdf',
    headers,
    rows: dataRows,
    rawData,
    confidence: 0.7,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      pageCount: tableResult.total,
      vendorDetected: 'Unknown',
      totalItemsFound: rawData.length,
    },
  }
}
