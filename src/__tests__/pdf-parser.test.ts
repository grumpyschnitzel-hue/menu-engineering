import {
  detectVendorFormat,
  cleanSyscoRow,
  cleanGenericRow,
  extractGenericHeaders,
  extractTableFromPDFResult,
} from '@/lib/parsers/pdf-parser'
import type { PDFTableResult } from '@/lib/parsers/pdf-parser'

describe('detectVendorFormat', () => {
  it('detects Sysco from text containing "sysco"', () => {
    expect(detectVendorFormat('Customer: GRUMPY SCHNITZEL\nOPCO Name: 257 - Edmonton\nSysco UPC')).toBe('sysco')
  })

  it('detects Sysco from text containing "OPCO Name"', () => {
    expect(detectVendorFormat('OPCO Name: 257 - Edmonton')).toBe('sysco')
  })

  it('detects US Foods', () => {
    expect(detectVendorFormat('US Foods Distribution')).toBe('usfoods')
  })

  it('returns generic for unknown vendors', () => {
    expect(detectVendorFormat('Some random invoice text')).toBe('generic')
  })

  it('is case-insensitive', () => {
    expect(detectVendorFormat('SYSCO CORPORATION')).toBe('sysco')
  })
})

describe('cleanSyscoRow', () => {
  it('extracts fields from a valid Sysco row', () => {
    const rawRow = ['1', 'No', '11/27/2024', '', 'Bread Crumb Plain', '5516812', '1/6.8KG', 'SYS CLS\n(Sysco Brand)', '', '', '42.23', '', '', '', '', '', '', '']
    const result = cleanSyscoRow(rawRow)

    expect(result).not.toBeNull()
    expect(result!['#']).toBe('1')
    expect(result!['Date']).toBe('11/27/2024')
    expect(result!['Product Name']).toBe('Bread Crumb Plain')
    expect(result!['Sysco UPC']).toBe('5516812')
    expect(result!['Pack / Size']).toBe('1/6.8KG')
    expect(result!['Brand']).toBe('SYS CLS (Sysco Brand)')
    expect(result!['Price ($)']).toBe('42.23')
  })

  it('handles brand without newline', () => {
    const rawRow = ['2', 'No', '11/27/2024', '', 'Bun Burger 4.5 in. Classic', '7264967', '48/82 GR', 'ACEBKRY', '', '', '35.19', '', '', '', '', '', '', '']
    const result = cleanSyscoRow(rawRow)

    expect(result).not.toBeNull()
    expect(result!['Brand']).toBe('ACEBKRY')
  })

  it('skips rows that do not start with a number', () => {
    const headerRow = ['Ordered\nBefore\n# Agr. Stock\nType', '', '', '', '', '', '']
    expect(cleanSyscoRow(headerRow)).toBeNull()
  })

  it('skips rows with empty first cell', () => {
    expect(cleanSyscoRow(['', '', '', ''])).toBeNull()
  })

  it('skips rows where product name is empty', () => {
    const rawRow = ['1', 'No', '11/27/2024', '', '', '', '', '', '', '', '42.23', '']
    expect(cleanSyscoRow(rawRow)).toBeNull()
  })

  it('handles rows with decimal prices like 11.740', () => {
    const rawRow = ['5', 'No', '11/27/2024', '', 'Ham Sliced Pizza Smoked Fresh', '6471730', '5/1 KG', 'NOSSACK', '', '', '11.740', '', '', '', '', '', '', '']
    const result = cleanSyscoRow(rawRow)

    expect(result).not.toBeNull()
    expect(result!['Price ($)']).toBe('11.740')
  })

  it('handles rows with price like 8.470', () => {
    const rawRow = ['52', 'No', '08/30/2024', '', 'Pork Rib Single Skin-On Boneless Belly', '7252437', '1/1 CT', 'TONNIES', '', '', '8.470', '', '', '', '', '', '', '']
    const result = cleanSyscoRow(rawRow)

    expect(result).not.toBeNull()
    expect(result!['Product Name']).toBe('Pork Rib Single Skin-On Boneless Belly')
    expect(result!['Price ($)']).toBe('8.470')
  })
})

describe('cleanGenericRow', () => {
  it('maps values to headers', () => {
    const headers = ['Item', 'Price', 'Qty']
    const row = ['Salad', '12.00', '50']
    const result = cleanGenericRow(row, headers)

    expect(result).not.toBeNull()
    expect(result!['Item']).toBe('Salad')
    expect(result!['Price']).toBe('12.00')
    expect(result!['Qty']).toBe('50')
  })

  it('skips completely empty rows', () => {
    const headers = ['Item', 'Price']
    expect(cleanGenericRow(['', ''], headers)).toBeNull()
  })

  it('cleans newlines in cell values', () => {
    const headers = ['Name']
    const row = ['Multi\nLine\nItem']
    const result = cleanGenericRow(row, headers)

    expect(result!['Name']).toBe('Multi Line Item')
  })

  it('handles missing cells gracefully', () => {
    const headers = ['A', 'B', 'C']
    const row = ['only one']
    const result = cleanGenericRow(row, headers)

    expect(result!['A']).toBe('only one')
    expect(result!['B']).toBe('')
    expect(result!['C']).toBe('')
  })
})

describe('extractGenericHeaders', () => {
  it('extracts non-empty headers', () => {
    const row = ['Item Name', '', 'Price', '', 'Qty']
    expect(extractGenericHeaders(row)).toEqual(['Item Name', 'Price', 'Qty'])
  })

  it('cleans newlines from headers', () => {
    const row = ['Product\nName', 'Unit\nPrice']
    expect(extractGenericHeaders(row)).toEqual(['Product Name', 'Unit Price'])
  })

  it('handles all-empty row', () => {
    expect(extractGenericHeaders(['', '', ''])).toEqual([])
  })
})

describe('extractTableFromPDFResult', () => {
  describe('Sysco format', () => {
    const syscoTableResult: PDFTableResult = {
      total: 2,
      pages: [
        {
          num: 1,
          tables: [[
            // Header row (skipped by cleanSyscoRow)
            ['Ordered\nBefore\n# Agr. Stock\nType Product Name Sysco\nUPC Pack / Size Brand List\nQty.\nOrder\nQty. Price ($) Est.\nTotal ($)', '', '', '', '', '', ''],
            // Data rows
            ['1', 'No', '11/27/2024', '', 'Bread Crumb Plain', '5516812', '1/6.8KG', 'SYS CLS\n(Sysco Brand)', '', '', '42.23', '', '', '', '', '', '', ''],
            ['2', 'No', '11/27/2024', '', 'Bun Burger 4.5 in. Classic', '7264967', '48/82 GR', 'ACEBKRY', '', '', '35.19', '', '', '', '', '', '', ''],
            ['3', 'No', '11/27/2024', '', 'Cheese Pizza Mozzarella Shredded 20% MF', '3105632', '2/3 KG', 'AREZCLS\n(Sysco Brand)', '', '', '91.13', '', '', '', '', '', '', ''],
          ]],
        },
        {
          num: 2,
          tables: [[
            // Header repeated (skipped)
            ['Ordered\nBefore\n# Agr.', '', '', '', '', '', ''],
            // Data rows continue
            ['19', 'No', '11/27/2024', '', 'Water Sparkling', '5575762', '6/1.5 LT', 'SANBENE', '', '', '13.04', '', '', '', '', '', '', ''],
            ['20', 'No', '10/08/2024', '', 'Cheese Cheddar Medium Slices', '2679462', '16/250 GR', 'BBRLIMP\n(Sysco Brand)', '', '', '84.42', '', '', '', '', '', '', ''],
          ]],
        },
      ],
    }

    it('extracts Sysco data with correct headers', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')

      expect(result.sourceType).toBe('pdf')
      expect(result.headers).toEqual(['#', 'Date', 'Product Name', 'Sysco UPC', 'Pack / Size', 'Brand', 'Price ($)'])
      expect(result.metadata?.vendorDetected).toBe('Sysco')
    })

    it('extracts all data rows across pages', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')

      expect(result.rawData.length).toBe(5)
      expect(result.rows.length).toBe(5)
    })

    it('first item has correct values', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')

      expect(result.rawData[0]['Product Name']).toBe('Bread Crumb Plain')
      expect(result.rawData[0]['Price ($)']).toBe('42.23')
      expect(result.rawData[0]['Pack / Size']).toBe('1/6.8KG')
    })

    it('last item from page 2 has correct values', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')

      expect(result.rawData[4]['Product Name']).toBe('Cheese Cheddar Medium Slices')
      expect(result.rawData[4]['Price ($)']).toBe('84.42')
    })

    it('sets confidence to 0.9 for Sysco format', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')
      expect(result.confidence).toBe(0.9)
    })

    it('includes page count in metadata', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')
      expect(result.metadata?.pageCount).toBe(2)
    })

    it('includes total items found in metadata', () => {
      const result = extractTableFromPDFResult(syscoTableResult, 'Sysco UPC')
      expect(result.metadata?.totalItemsFound).toBe(5)
    })
  })

  describe('Generic format', () => {
    const genericTableResult: PDFTableResult = {
      total: 1,
      pages: [{
        num: 1,
        tables: [[
          ['Item', 'Category', 'Price', 'Cost', 'Qty'],
          ['Caesar Salad', 'Starters', '16.00', '4.20', '340'],
          ['Ribeye Steak', 'Mains', '48.00', '18.50', '180'],
        ]],
      }],
    }

    it('uses first row as headers', () => {
      const result = extractTableFromPDFResult(genericTableResult, 'Some vendor')

      expect(result.headers).toEqual(['Item', 'Category', 'Price', 'Cost', 'Qty'])
    })

    it('extracts data rows correctly', () => {
      const result = extractTableFromPDFResult(genericTableResult, 'Some vendor')

      expect(result.rawData.length).toBe(2)
      expect(result.rawData[0]['Item']).toBe('Caesar Salad')
      expect(result.rawData[1]['Price']).toBe('48.00')
    })

    it('sets confidence to 0.7 for generic format', () => {
      const result = extractTableFromPDFResult(genericTableResult, 'Some vendor')
      expect(result.confidence).toBe(0.7)
    })
  })

  describe('Empty PDF', () => {
    const emptyTableResult: PDFTableResult = {
      total: 1,
      pages: [{
        num: 1,
        tables: [],
      }],
    }

    it('returns empty extraction with warning', () => {
      const result = extractTableFromPDFResult(emptyTableResult, 'some text')

      expect(result.rawData.length).toBe(0)
      expect(result.headers.length).toBe(0)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })

    it('sets low confidence for empty results', () => {
      const result = extractTableFromPDFResult(emptyTableResult, 'some text')
      expect(result.confidence).toBeLessThanOrEqual(0.3)
    })
  })
})
