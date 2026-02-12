import { detectColumns, parseCSVString, parseCSVWithMapping } from '../lib/csv-parser'

describe('detectColumns', () => {
  it('detects standard column names', () => {
    const headers = ['Item Name', 'Category', 'Menu Price', 'Food Cost', 'Units Sold']
    const mapping = detectColumns(headers)
    expect(mapping.name).toBe(0)
    expect(mapping.category).toBe(1)
    expect(mapping.menuPrice).toBe(2)
    expect(mapping.foodCost).toBe(3)
    expect(mapping.unitsSold).toBe(4)
  })

  it('detects aliased column names', () => {
    const headers = ['Dish', 'Type', 'Price', 'Cost', 'Qty']
    const mapping = detectColumns(headers)
    expect(mapping.name).toBe(0)
    expect(mapping.category).toBe(1)
    expect(mapping.menuPrice).toBe(2)
    expect(mapping.foodCost).toBe(3)
    expect(mapping.unitsSold).toBe(4)
  })

  it('handles missing columns gracefully', () => {
    const headers = ['Name', 'Price']
    const mapping = detectColumns(headers)
    expect(mapping.name).toBe(0)
    expect(mapping.menuPrice).toBe(1)
    expect(mapping.category).toBeUndefined()
    expect(mapping.foodCost).toBeUndefined()
    expect(mapping.unitsSold).toBeUndefined()
  })

  it('is case-insensitive', () => {
    const headers = ['ITEM NAME', 'MENU PRICE', 'FOOD COST', 'UNITS SOLD']
    const mapping = detectColumns(headers)
    expect(mapping.name).toBe(0)
    expect(mapping.menuPrice).toBe(1)
    expect(mapping.foodCost).toBe(2)
    expect(mapping.unitsSold).toBe(3)
  })
})

describe('parseCSVString', () => {
  it('parses clean CSV', () => {
    const csv = `Item Name,Category,Menu Price,Food Cost,Units Sold
Caesar Salad,Starters,16.00,4.20,340
Ribeye Steak,Mains,48.00,18.50,180`

    const result = parseCSVString(csv)
    expect(result.headers).toHaveLength(5)
    expect(result.rawData).toHaveLength(2)
    expect(result.rawData[0]['Item Name']).toBe('Caesar Salad')
  })

  it('skips empty lines', () => {
    const csv = `Item Name,Menu Price,Food Cost,Units Sold
Test,10,5,100

`
    const result = parseCSVString(csv)
    expect(result.rawData).toHaveLength(1)
  })
})

describe('parseCSVWithMapping', () => {
  const headers = ['Item Name', 'Category', 'Menu Price', 'Food Cost', 'Units Sold']
  const mapping = { name: 0, category: 1, menuPrice: 2, foodCost: 3, unitsSold: 4 }

  it('parses valid data', () => {
    const rawData = [
      { 'Item Name': 'Caesar Salad', 'Category': 'Starters', 'Menu Price': '16.00', 'Food Cost': '4.20', 'Units Sold': '340' },
    ]
    const result = parseCSVWithMapping(rawData, headers, mapping, 30)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Caesar Salad')
    expect(result.items[0].menuPrice).toBe(16)
    expect(result.items[0].foodCost).toBe(4.2)
    expect(result.items[0].unitsSold).toBe(340)
    expect(result.errors).toHaveLength(0)
  })

  it('skips items where cost >= price', () => {
    const rawData = [
      { 'Item Name': 'Bad Item', 'Category': 'Mains', 'Menu Price': '10.00', 'Food Cost': '12.00', 'Units Sold': '100' },
    ]
    const result = parseCSVWithMapping(rawData, headers, mapping, 30)
    expect(result.items).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('higher than price')
  })

  it('skips items with empty names', () => {
    const rawData = [
      { 'Item Name': '', 'Category': 'Mains', 'Menu Price': '10.00', 'Food Cost': '5.00', 'Units Sold': '100' },
    ]
    const result = parseCSVWithMapping(rawData, headers, mapping, 30)
    expect(result.items).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('handles currency symbols in prices', () => {
    const rawData = [
      { 'Item Name': 'Steak', 'Category': 'Mains', 'Menu Price': '$48.00', 'Food Cost': '$18.50', 'Units Sold': '180' },
    ]
    const result = parseCSVWithMapping(rawData, headers, mapping, 30)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].menuPrice).toBe(48)
    expect(result.items[0].foodCost).toBe(18.5)
  })

  it('allows partial import with mixed valid/invalid rows', () => {
    const rawData = [
      { 'Item Name': 'Good', 'Category': 'Mains', 'Menu Price': '20', 'Food Cost': '8', 'Units Sold': '100' },
      { 'Item Name': 'Bad', 'Category': 'Mains', 'Menu Price': '10', 'Food Cost': '15', 'Units Sold': '50' },
      { 'Item Name': 'Also Good', 'Category': 'Mains', 'Menu Price': '30', 'Food Cost': '12', 'Units Sold': '80' },
    ]
    const result = parseCSVWithMapping(rawData, headers, mapping, 30)
    expect(result.items).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
  })
})
