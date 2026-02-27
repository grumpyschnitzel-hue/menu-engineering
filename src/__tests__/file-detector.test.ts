import {
  detectFileType,
  isAcceptedFile,
  getFileTypeLabel,
  getFileTypeIcon,
  validateFileSize,
} from '@/lib/parsers/file-detector'

function createMockFile(name: string, type: string = '', size: number = 1024): File {
  const file = new File(['test'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('detectFileType', () => {
  describe('CSV detection', () => {
    it('detects .csv by extension', () => {
      expect(detectFileType(createMockFile('data.csv'))).toBe('csv')
    })

    it('detects .CSV (uppercase) by extension', () => {
      expect(detectFileType(createMockFile('DATA.CSV'))).toBe('csv')
    })

    it('detects text/csv MIME type', () => {
      expect(detectFileType(createMockFile('file', 'text/csv'))).toBe('csv')
    })

    it('detects application/vnd.ms-excel as CSV', () => {
      expect(detectFileType(createMockFile('file', 'application/vnd.ms-excel'))).toBe('csv')
    })
  })

  describe('PDF detection', () => {
    it('detects .pdf by extension', () => {
      expect(detectFileType(createMockFile('invoice.pdf'))).toBe('pdf')
    })

    it('detects .PDF (uppercase) by extension', () => {
      expect(detectFileType(createMockFile('INVOICE.PDF'))).toBe('pdf')
    })

    it('detects application/pdf MIME type', () => {
      expect(detectFileType(createMockFile('file', 'application/pdf'))).toBe('pdf')
    })
  })

  describe('Image detection', () => {
    it('detects .jpg by extension', () => {
      expect(detectFileType(createMockFile('receipt.jpg'))).toBe('image')
    })

    it('detects .jpeg by extension', () => {
      expect(detectFileType(createMockFile('receipt.jpeg'))).toBe('image')
    })

    it('detects .png by extension', () => {
      expect(detectFileType(createMockFile('receipt.png'))).toBe('image')
    })

    it('detects .webp by extension', () => {
      expect(detectFileType(createMockFile('receipt.webp'))).toBe('image')
    })

    it('detects image/jpeg MIME type', () => {
      expect(detectFileType(createMockFile('file', 'image/jpeg'))).toBe('image')
    })

    it('detects image/png MIME type', () => {
      expect(detectFileType(createMockFile('file', 'image/png'))).toBe('image')
    })

    it('detects generic image/* MIME types', () => {
      expect(detectFileType(createMockFile('file', 'image/tiff'))).toBe('image')
    })
  })

  describe('Unknown files', () => {
    it('returns unknown for unsupported extensions', () => {
      expect(detectFileType(createMockFile('file.docx'))).toBe('unknown')
    })

    it('returns unknown for files with no extension and no MIME', () => {
      expect(detectFileType(createMockFile('file', ''))).toBe('unknown')
    })

    it('returns unknown for unsupported MIME types', () => {
      expect(detectFileType(createMockFile('file', 'application/json'))).toBe('unknown')
    })
  })

  describe('Edge cases', () => {
    it('handles files with multiple dots in name', () => {
      expect(detectFileType(createMockFile('my.data.file.csv'))).toBe('csv')
    })

    it('prioritizes extension over MIME type', () => {
      // A .csv file with image MIME type — extension wins
      expect(detectFileType(createMockFile('data.csv', 'image/png'))).toBe('csv')
    })
  })
})

describe('isAcceptedFile', () => {
  it('returns true for CSV files', () => {
    expect(isAcceptedFile(createMockFile('data.csv'))).toBe(true)
  })

  it('returns true for PDF files', () => {
    expect(isAcceptedFile(createMockFile('invoice.pdf'))).toBe(true)
  })

  it('returns true for image files', () => {
    expect(isAcceptedFile(createMockFile('receipt.jpg'))).toBe(true)
  })

  it('returns false for unsupported files', () => {
    expect(isAcceptedFile(createMockFile('file.docx'))).toBe(false)
  })
})

describe('getFileTypeLabel', () => {
  it('returns correct labels', () => {
    expect(getFileTypeLabel('csv')).toBe('CSV Spreadsheet')
    expect(getFileTypeLabel('pdf')).toBe('PDF Document')
    expect(getFileTypeLabel('image')).toBe('Image')
    expect(getFileTypeLabel('unknown')).toBe('Unknown')
  })
})

describe('getFileTypeIcon', () => {
  it('returns correct icons', () => {
    expect(getFileTypeIcon('csv')).toBe('📊')
    expect(getFileTypeIcon('pdf')).toBe('📄')
    expect(getFileTypeIcon('image')).toBe('📷')
    expect(getFileTypeIcon('unknown')).toBe('❓')
  })
})

describe('validateFileSize', () => {
  it('returns null for files within limit', () => {
    expect(validateFileSize(createMockFile('data.csv', '', 1024), 'csv')).toBeNull()
  })

  it('returns error for CSV over 10MB', () => {
    const oversized = createMockFile('big.csv', '', 11 * 1024 * 1024)
    expect(validateFileSize(oversized, 'csv')).toContain('too large')
  })

  it('returns error for PDF over 50MB', () => {
    const oversized = createMockFile('big.pdf', '', 51 * 1024 * 1024)
    expect(validateFileSize(oversized, 'pdf')).toContain('too large')
  })

  it('returns error for image over 20MB', () => {
    const oversized = createMockFile('big.jpg', '', 21 * 1024 * 1024)
    expect(validateFileSize(oversized, 'image')).toContain('too large')
  })

  it('returns error for unknown file type', () => {
    expect(validateFileSize(createMockFile('file'), 'unknown')).toBe('Unsupported file type')
  })

  it('allows PDF files up to 50MB', () => {
    const bigPDF = createMockFile('invoice.pdf', '', 49 * 1024 * 1024)
    expect(validateFileSize(bigPDF, 'pdf')).toBeNull()
  })
})
