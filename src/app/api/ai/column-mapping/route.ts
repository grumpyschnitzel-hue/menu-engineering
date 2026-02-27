import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI features not configured. ANTHROPIC_API_KEY is missing.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { headers, sampleRows } = body

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Headers array is required' },
        { status: 400 }
      )
    }

    if (!sampleRows || !Array.isArray(sampleRows) || sampleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one sample row is required' },
        { status: 400 }
      )
    }

    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a restaurant data expert. Given column headers and sample data from a restaurant document (invoice, menu, spreadsheet, or receipt), determine which columns map to these target fields:

- name: The menu item or ingredient name
- category: The category, section, or type
- menuPrice: The selling price to customers (what they pay)
- foodCost: The cost to the restaurant (purchase/ingredient cost)
- unitsSold: Number of units sold in a period

Column headers: ${JSON.stringify(headers)}
Sample data rows (first 3):
${sampleRows.slice(0, 3).map((row: string[], i: number) => `Row ${i + 1}: ${JSON.stringify(row)}`).join('\n')}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"suggestions":[{"field":"name","columnIndex":0,"confidence":0.95,"reason":"Column header matches item name"},{"field":"foodCost","columnIndex":3,"confidence":0.8,"reason":"Contains dollar values typical of cost data"}]}

Rules:
- Only include fields you're confident about (confidence > 0.5)
- columnIndex is 0-based, matching the headers array
- If a column clearly contains prices but you can't tell if it's menu price or food cost, prefer "foodCost" for invoice/purchase data
- If no column matches a field, omit that field from suggestions
- "confidence" is 0-1: 1.0 = exact header match, 0.7+ = likely match, 0.5-0.7 = possible match`
      }],
    })

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Try to extract JSON from the response
    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch {
      // Try to find JSON in markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    const suggestions = parsed.suggestions || []

    // Validate suggestions
    const validFields = ['name', 'category', 'menuPrice', 'foodCost', 'unitsSold']
    const validatedSuggestions = suggestions
      .filter((s: { field: string; columnIndex: number; confidence: number }) =>
        validFields.includes(s.field) &&
        typeof s.columnIndex === 'number' &&
        s.columnIndex >= 0 &&
        s.columnIndex < headers.length &&
        typeof s.confidence === 'number' &&
        s.confidence >= 0 &&
        s.confidence <= 1
      )

    return NextResponse.json({
      success: true,
      suggestions: validatedSuggestions,
    })
  } catch (err) {
    console.error('AI column mapping error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'AI column mapping failed',
      },
      { status: 500 }
    )
  }
}
