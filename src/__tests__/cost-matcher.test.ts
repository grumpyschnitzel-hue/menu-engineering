import {
  normalizeName,
  tokenOverlap,
  matchInvoiceToMenu,
} from '@/lib/parsers/cost-matcher'

describe('normalizeName', () => {
  it('converts to lowercase', () => {
    expect(normalizeName('CAESAR SALAD')).toBe('caesar salad')
  })

  it('removes Sysco brand suffixes', () => {
    expect(normalizeName('SYS CLS (Sysco Brand)')).toBe('sys cls')
  })

  it('removes pack sizes like 2/3 KG', () => {
    expect(normalizeName('Cheese Pizza Mozzarella 2/3 KG')).toBe('cheese pizza mozzarella')
  })

  it('removes pack sizes like 48/82 GR', () => {
    expect(normalizeName('Bun Burger 48/82 GR')).toBe('bun burger')
  })

  it('removes UPC-like numbers', () => {
    expect(normalizeName('Bread Crumb Plain 5516812')).toBe('bread crumb plain')
  })

  it('removes percentage notations', () => {
    expect(normalizeName('Cheese Pizza Mozzarella Shredded 20% MF')).toBe('cheese pizza mozzarella shredded')
  })

  it('removes measurement suffixes', () => {
    expect(normalizeName('Bun Burger 4.5 in. Classic')).toBe('bun burger classic')
  })

  it('collapses whitespace', () => {
    expect(normalizeName('  Bread   Crumb   Plain  ')).toBe('bread crumb plain')
  })

  it('handles combined Sysco-style product names', () => {
    const result = normalizeName('Cheese Pizza Mozzarella Shredded 20% MF 3105632 2/3 KG AREZCLS (Sysco Brand)')
    expect(result).toBe('cheese pizza mozzarella shredded arezcls')
  })
})

describe('tokenOverlap', () => {
  it('returns 1.0 for identical token sets', () => {
    expect(tokenOverlap('caesar salad', 'caesar salad')).toBe(1)
  })

  it('returns 0 for completely different tokens', () => {
    expect(tokenOverlap('caesar salad', 'ribeye steak')).toBe(0)
  })

  it('returns partial score for partial overlap', () => {
    const score = tokenOverlap('caesar salad mix', 'caesar salad')
    expect(score).toBe(1) // all tokens from shorter are in longer
  })

  it('returns 0 for empty strings', () => {
    expect(tokenOverlap('', 'test')).toBe(0)
    expect(tokenOverlap('test', '')).toBe(0)
  })

  it('filters out single-character tokens', () => {
    expect(tokenOverlap('a b c', 'a b c')).toBe(0) // all tokens are 1 char
  })
})

describe('matchInvoiceToMenu', () => {
  const existingItems = [
    { id: '1', name: 'Caesar Salad', category: 'Starters', menuPrice: 16, foodCost: 4.20, unitsSold: 340, periodDays: 30 },
    { id: '2', name: 'Mozzarella Pizza', category: 'Mains', menuPrice: 22, foodCost: 6.50, unitsSold: 280, periodDays: 30 },
    { id: '3', name: 'Ribeye Steak', category: 'Mains', menuPrice: 48, foodCost: 18.50, unitsSold: 180, periodDays: 30 },
    { id: '4', name: 'Bread Crumbs', category: 'Ingredients', menuPrice: 0, foodCost: 5.00, unitsSold: 0, periodDays: 30 },
  ]

  it('matches exact names (case-insensitive)', () => {
    const invoice = [{ name: 'Caesar Salad', cost: 4.50 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches[0].matchedMenuItemId).toBe('1')
    expect(matches[0].confidence).toBe(1.0)
  })

  it('calculates cost change correctly', () => {
    const invoice = [{ name: 'Caesar Salad', cost: 4.50 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches[0].oldCost).toBe(4.20)
    expect(matches[0].newCost).toBe(4.50)
    expect(matches[0].costChange).toBeCloseTo(0.30, 2)
    expect(matches[0].costChangePercent).toBeCloseTo(7.14, 0)
  })

  it('matches Sysco-style names to simplified menu names', () => {
    const invoice = [{ name: 'Cheese Pizza Mozzarella Shredded 20% MF', cost: 91.13 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    // Should match "Mozzarella Pizza" via token overlap
    expect(matches[0].matchedMenuItemName).toBe('Mozzarella Pizza')
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('matches with brand/pack info stripped', () => {
    const invoice = [{ name: 'Bread Crumb Plain 5516812 1/6.8KG SYS CLS (Sysco Brand)', cost: 42.23 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches[0].matchedMenuItemName).toBe('Bread Crumbs')
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('returns null match for unrecognized items', () => {
    const invoice = [{ name: 'Unicorn Tears Extract', cost: 99.99 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches[0].matchedMenuItemId).toBeNull()
    expect(matches[0].matchedMenuItemName).toBeNull()
    expect(matches[0].confidence).toBe(0)
  })

  it('handles empty invoice items', () => {
    const matches = matchInvoiceToMenu([], existingItems)
    expect(matches).toEqual([])
  })

  it('handles empty existing items', () => {
    const invoice = [{ name: 'Caesar Salad', cost: 4.50 }]
    const matches = matchInvoiceToMenu(invoice, [])

    expect(matches[0].matchedMenuItemId).toBeNull()
    expect(matches[0].confidence).toBe(0)
  })

  it('picks the best match when multiple candidates exist', () => {
    const invoice = [{ name: 'Ribeye Steak', cost: 20.00 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches[0].matchedMenuItemId).toBe('3')
    expect(matches[0].confidence).toBe(1.0)
  })

  it('matches multiple invoice items independently', () => {
    const invoice = [
      { name: 'Caesar Salad', cost: 4.50 },
      { name: 'Ribeye Steak', cost: 20.00 },
    ]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches.length).toBe(2)
    expect(matches[0].matchedMenuItemId).toBe('1')
    expect(matches[1].matchedMenuItemId).toBe('3')
  })

  it('returns invoice data even for unmatched items', () => {
    const invoice = [{ name: 'Mystery Ingredient', cost: 15.00 }]
    const matches = matchInvoiceToMenu(invoice, existingItems)

    expect(matches[0].invoiceItemName).toBe('Mystery Ingredient')
    expect(matches[0].invoiceCost).toBe(15.00)
    expect(matches[0].newCost).toBe(15.00)
    expect(matches[0].oldCost).toBeNull()
    expect(matches[0].costChange).toBeNull()
  })
})
