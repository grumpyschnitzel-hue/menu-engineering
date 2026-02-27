import { NextRequest, NextResponse } from 'next/server'
import { extractTableFromPDFResult } from '@/lib/parsers/pdf-parser'
import type { PDFTableResult } from '@/lib/parsers/pdf-parser'

// Max file size: 50MB
const MAX_SIZE = 50 * 1024 * 1024

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      )
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // pdf-parse v2 doesn't ship TypeScript types
    const pdfParse = await import('pdf-parse')
    const PDFParse = (pdfParse as any).PDFParse || (pdfParse as any).default?.PDFParse

    if (!PDFParse) {
      throw new Error('PDFParse constructor not found in pdf-parse module')
    }

    const parser = new PDFParse(uint8Array, { verbosity: 0 })

    // Get table data
    const tableResult: PDFTableResult = await parser.getTable()

    // Also get text for vendor detection
    const textResult = await parser.getText()
    const fullText = textResult?.text || ''

    // Extract structured data
    const extraction = extractTableFromPDFResult(tableResult, fullText)

    return NextResponse.json({
      success: true,
      data: extraction,
    })
  } catch (err) {
    console.error('PDF parsing error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to parse PDF',
      },
      { status: 500 }
    )
  }
}
