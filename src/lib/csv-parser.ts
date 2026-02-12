import Papa from 'papaparse'
import { v4 as uuidv4 } from 'uuid'
import { MenuItemInput } from './types'

interface ColumnMapping {
  name: number
  category: number
  menuPrice: number
  foodCost: number
  unitsSold: number
}

interface ParseResult {
  items: (MenuItemInput & { id: string })[]
  errors: { row: number; message: string }[]
  totalRows: number
}

const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  name: ['item name', 'item', 'name', 'dish', 'dish name', 'menu item', 'product', 'product name'],
  category: ['category', 'cat', 'type', 'section', 'menu section', 'group'],
  menuPrice: ['menu price', 'price', 'selling price', 'sell price', 'retail price', 'sale price'],
  foodCost: ['food cost', 'cost', 'plate cost', 'item cost', 'cogs', 'item food cost'],
  unitsSold: ['units sold', 'units', 'qty', 'quantity', 'sold', 'count', 'volume', 'qty sold'],
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_\-]/g, ' ')
}

export function detectColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  const normalizedHeaders = headers.map(normalizeHeader)

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = normalizedHeaders.findIndex(h => aliases.includes(h))
    if (index !== -1) {
      mapping[field as keyof ColumnMapping] = index
    }
  }

  return mapping
}

export function isColumnMappingComplete(mapping: Partial<ColumnMapping>): mapping is ColumnMapping {
  return (
    mapping.name != null &&
    mapping.menuPrice != null &&
    mapping.foodCost != null &&
    mapping.unitsSold != null
  )
}

function parseNumber(value: string | number | undefined): number | null {
  if (value == null || value === '') return null
  const str = String(value).replace(/[$,\s]/g, '')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

export function parseCSVString(csvText: string): {
  headers: string[]
  rows: string[][]
  rawData: Record<string, string>[]
} {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  const headers = result.meta.fields || []
  const rows = result.data.map(row => headers.map(h => row[h] || ''))

  return { headers, rows, rawData: result.data }
}

export function parseCSVWithMapping(
  rawData: Record<string, string>[],
  headers: string[],
  mapping: ColumnMapping,
  periodDays: number = 30
): ParseResult {
  const items: (MenuItemInput & { id: string })[] = []
  const errors: { row: number; message: string }[] = []

  rawData.forEach((row, index) => {
    const rowNum = index + 2 // 1-indexed + header row
    const values = headers.map(h => row[h] || '')

    const name = values[mapping.name]?.trim()
    if (!name) {
      errors.push({ row: rowNum, message: 'Item name is empty — skipped' })
      return
    }

    const category = mapping.category != null
      ? values[mapping.category]?.trim() || 'Uncategorized'
      : 'Uncategorized'

    const menuPrice = parseNumber(values[mapping.menuPrice])
    if (menuPrice == null || menuPrice <= 0) {
      errors.push({ row: rowNum, message: `"${name}" — invalid or missing menu price — skipped` })
      return
    }

    const foodCost = parseNumber(values[mapping.foodCost])
    if (foodCost == null || foodCost <= 0) {
      errors.push({ row: rowNum, message: `"${name}" — invalid or missing food cost — skipped` })
      return
    }

    if (foodCost >= menuPrice) {
      errors.push({ row: rowNum, message: `"${name}" — food cost ($${foodCost}) is higher than price ($${menuPrice}) — skipped` })
      return
    }

    const unitsSold = parseNumber(values[mapping.unitsSold])
    if (unitsSold == null || unitsSold < 0) {
      errors.push({ row: rowNum, message: `"${name}" — invalid units sold — skipped` })
      return
    }

    items.push({
      id: uuidv4(),
      name,
      category,
      menuPrice,
      foodCost,
      unitsSold,
      periodDays,
    })
  })

  return { items, errors, totalRows: rawData.length }
}

export function generateSampleCSV(): string {
  return `Item Name,Category,Menu Price,Food Cost,Units Sold
Caesar Salad,Starters,16.00,4.20,340
French Onion Soup,Starters,14.00,3.80,280
Calamari,Starters,18.00,6.50,190
Ribeye Steak,Mains,48.00,18.50,180
Grilled Salmon,Mains,34.00,12.00,260
Chicken Parmesan,Mains,26.00,7.80,420
Mushroom Risotto,Mains,24.00,5.60,150
Fish & Chips,Mains,22.00,8.40,310
Chocolate Lava Cake,Desserts,14.00,3.20,200
Tiramisu,Desserts,12.00,2.80,170
Cheesecake,Desserts,13.00,3.50,220
House Fries,Sides,8.00,1.60,480`
}
