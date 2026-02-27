/**
 * Client-side image parser — sends images to the API route
 * for Claude Vision OCR analysis.
 */

import type { ParserResult } from './types'

/** Max image size in bytes (20MB) */
const MAX_IMAGE_SIZE = 20 * 1024 * 1024

/** Supported image MIME types */
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Send an image file to the server for AI-powered OCR extraction.
 * Returns structured extraction data for the column mapping UI.
 */
export async function parseImageFile(file: File): Promise<ParserResult> {
  // Client-side validation
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      success: false,
      error: `Image is too large (${sizeMB}MB). Maximum is 20MB.`,
    }
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Unsupported image type: ${file.type}. Use JPEG, PNG, or WebP.`,
    }
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/parse/image', {
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
      error: err instanceof Error ? err.message : 'Failed to connect to image parser',
    }
  }
}
