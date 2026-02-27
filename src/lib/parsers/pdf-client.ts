/**
 * Client-side PDF parser — sends the file to the API route
 * and returns a ParserResult.
 */

import type { ParserResult } from './types'

/**
 * Send a PDF file to the server for parsing.
 * Returns structured extraction data for the column mapping UI.
 */
export async function parsePDFFile(file: File): Promise<ParserResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/parse/pdf', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Server error: ${res.status}`,
      }
    }

    return {
      success: true,
      data: data.data,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect to PDF parser',
    }
  }
}
