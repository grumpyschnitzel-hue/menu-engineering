import { parseImageFile } from '@/lib/parsers/image-client'

// Mock fetch for all tests
const mockFetch = jest.fn()
global.fetch = mockFetch

function createMockImageFile(
  name: string = 'receipt.jpg',
  type: string = 'image/jpeg',
  size: number = 1024 * 1024
): File {
  const file = new File(['fake image data'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('parseImageFile', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('rejects files over 20MB', async () => {
    const bigFile = createMockImageFile('big.jpg', 'image/jpeg', 21 * 1024 * 1024)
    const result = await parseImageFile(bigFile)

    expect(result.success).toBe(false)
    expect(result.error).toContain('too large')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects unsupported image types', async () => {
    const tiffFile = createMockImageFile('photo.tiff', 'image/tiff', 1024)
    const result = await parseImageFile(tiffFile)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unsupported')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns parsed data on successful API response', async () => {
    const mockExtraction = {
      sourceType: 'image',
      headers: ['Item Name', 'Price'],
      rows: [['Caesar Salad', '16.00'], ['Ribeye Steak', '48.00']],
      rawData: [
        { 'Item Name': 'Caesar Salad', 'Price': '16.00' },
        { 'Item Name': 'Ribeye Steak', 'Price': '48.00' },
      ],
      confidence: 0.7,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockExtraction }),
    })

    const file = createMockImageFile()
    const result = await parseImageFile(file)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockExtraction)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('handles server error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Internal server error' }),
    })

    const file = createMockImageFile()
    const result = await parseImageFile(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Internal server error')
  })

  it('handles API key not configured (503)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ success: false, error: 'AI features not configured' }),
    })

    const file = createMockImageFile()
    const result = await parseImageFile(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not configured')
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const file = createMockImageFile()
    const result = await parseImageFile(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })

  it('handles no items found in image', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'No items found in the image.',
      }),
    })

    const file = createMockImageFile()
    const result = await parseImageFile(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('No items found')
  })

  it('sends FormData with the file', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { headers: [], rows: [], rawData: [], sourceType: 'image' } }),
    })

    const file = createMockImageFile('photo.png', 'image/png')
    await parseImageFile(file)

    expect(mockFetch).toHaveBeenCalledWith('/api/parse/image', {
      method: 'POST',
      body: expect.any(FormData),
    })
  })

  it('allows files at exactly 20MB', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { headers: [], rows: [], rawData: [], sourceType: 'image' } }),
    })

    const file = createMockImageFile('big.jpg', 'image/jpeg', 20 * 1024 * 1024)
    const result = await parseImageFile(file)

    expect(mockFetch).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })
})
