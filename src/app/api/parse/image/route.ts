import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ParsedExtraction } from '@/lib/parsers/types'

// Max file size: 20MB
const MAX_SIZE = 20 * 1024 * 1024

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI features not configured. ANTHROPIC_API_KEY is missing.' },
        { status: 503 }
      )
    }

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
        { success: false, error: `Image too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      )
    }

    if (!SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported image type: ${file.type}. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      )
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mediaType = file.type as ImageMediaType

    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `You are a restaurant data extraction expert. This image shows a restaurant document (receipt, invoice, delivery ticket, menu, or price list).

Extract ALL food/ingredient items visible as a structured table. Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "headers": ["Item Name", "Category", "Price", "Quantity"],
  "rows": [["Caesar Salad", "Starters", "16.00", "340"], ["Ribeye Steak", "Mains", "48.00", "180"]],
  "documentType": "invoice",
  "vendor": "Sysco",
  "notes": "any relevant context about the data"
}

Rules:
- Include ALL items visible, even if partially readable
- Use empty string "" for fields you cannot determine
- Prices should be numbers only (no $ or currency symbols)
- Include whatever columns are visible in the image (you don't have to force all 4 columns)
- Use appropriate headers based on what you see (e.g., "Cost" for purchase invoices, "Price" for menus)
- documentType must be one of: invoice, receipt, menu, delivery_ticket, price_list, unknown
- vendor should be the supplier name if visible, otherwise "unknown"
- Be generous with extraction — include items even if some fields are uncertain`,
          },
        ],
      }],
    })

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response. The image may not contain recognizable food/ingredient data.')
      }
    }

    const headers: string[] = parsed.headers || []
    const rows: string[][] = parsed.rows || []

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items found in the image. Try a clearer photo or a different angle.',
      })
    }

    // Convert to rawData format (Record<string, string>[])
    const rawData: Record<string, string>[] = rows.map((row: string[]) => {
      const record: Record<string, string> = {}
      headers.forEach((h: string, i: number) => {
        record[h] = row[i] || ''
      })
      return record
    })

    const extraction: ParsedExtraction = {
      sourceType: 'image',
      headers,
      rows,
      rawData,
      confidence: 0.7, // Image OCR is inherently less precise
      metadata: {
        vendorDetected: parsed.vendor || 'Unknown',
        totalItemsFound: rows.length,
      },
      warnings: parsed.notes ? [parsed.notes] : undefined,
    }

    return NextResponse.json({
      success: true,
      data: extraction,
    })
  } catch (err) {
    console.error('Image parsing error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to analyze image',
      },
      { status: 500 }
    )
  }
}
