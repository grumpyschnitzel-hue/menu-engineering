/**
 * CSV Adapter — wraps existing csv-parser.ts to output ParsedExtraction shape.
 * This allows CSV files to flow through the same unified pipeline
 * as PDF and image files.
 */

import { parseCSVString } from '@/lib/csv-parser'
import type { ParsedExtraction, ParserResult } from './types'

/**
 * Parse a CSV text string and return a ParsedExtraction.
 */
export function adaptCSVToParsedExtraction(csvText: string): ParserResult {
  try {
    const { headers, rows, rawData } = parseCSVString(csvText)

    if (headers.length === 0) {
      return {
        success: false,
        error: 'No columns detected in CSV file. Check that the file has a header row.',
      }
    }

    if (rawData.length === 0) {
      return {
        success: false,
        error: 'CSV file has headers but no data rows.',
      }
    }

    const extraction: ParsedExtraction = {
      sourceType: 'csv',
      headers,
      rows,
      rawData,
      confidence: 1.0, // CSV parsing is deterministic
      metadata: {
        totalItemsFound: rawData.length,
      },
    }

    return { success: true, data: extraction }
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}
