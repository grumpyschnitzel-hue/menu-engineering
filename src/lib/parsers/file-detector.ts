/**
 * File type detection for multi-format upload.
 * Detects CSV, PDF, and image files by extension and MIME type.
 */

export type AcceptedFileType = 'csv' | 'pdf' | 'image' | 'unknown'

const EXTENSION_MAP: Record<string, AcceptedFileType> = {
  '.csv': 'csv',
  '.pdf': 'pdf',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
}

const MIME_MAP: Record<string, AcceptedFileType> = {
  'text/csv': 'csv',
  'application/vnd.ms-excel': 'csv', // Some systems report CSV as this
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
}

/**
 * Detect file type from a File object.
 * Checks extension first (more reliable), falls back to MIME type.
 */
export function detectFileType(file: File): AcceptedFileType {
  // Check extension first
  const name = file.name.toLowerCase()
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex !== -1) {
    const ext = name.substring(dotIndex)
    const typeFromExt = EXTENSION_MAP[ext]
    if (typeFromExt) return typeFromExt
  }

  // Fall back to MIME type
  if (file.type) {
    const typeFromMime = MIME_MAP[file.type]
    if (typeFromMime) return typeFromMime

    // Handle generic image/* MIME types
    if (file.type.startsWith('image/')) return 'image'
  }

  return 'unknown'
}

/**
 * Check if a file is an accepted type.
 */
export function isAcceptedFile(file: File): boolean {
  return detectFileType(file) !== 'unknown'
}

/**
 * Get a human-readable label for a file type.
 */
export function getFileTypeLabel(type: AcceptedFileType): string {
  switch (type) {
    case 'csv': return 'CSV Spreadsheet'
    case 'pdf': return 'PDF Document'
    case 'image': return 'Image'
    case 'unknown': return 'Unknown'
  }
}

/**
 * Get an emoji icon for a file type.
 */
export function getFileTypeIcon(type: AcceptedFileType): string {
  switch (type) {
    case 'csv': return '📊'
    case 'pdf': return '📄'
    case 'image': return '📷'
    case 'unknown': return '❓'
  }
}

/** Accepted file extensions for the upload input */
export const ACCEPTED_EXTENSIONS = '.csv,.pdf,.jpg,.jpeg,.png,.webp'

/** Accepted MIME types for drag-and-drop validation */
export const ACCEPTED_MIME_TYPES = 'text/csv,application/pdf,image/jpeg,image/png,image/webp'

/** Max file sizes in bytes */
export const MAX_FILE_SIZES: Record<AcceptedFileType, number> = {
  csv: 10 * 1024 * 1024,    // 10MB
  pdf: 50 * 1024 * 1024,    // 50MB
  image: 20 * 1024 * 1024,  // 20MB
  unknown: 0,
}

/**
 * Validate file size against limits.
 * Returns error message if too large, null if OK.
 */
export function validateFileSize(file: File, type: AcceptedFileType): string | null {
  const maxSize = MAX_FILE_SIZES[type]
  if (maxSize === 0) return 'Unsupported file type'
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    const fileMB = (file.size / (1024 * 1024)).toFixed(1)
    return `File is too large (${fileMB}MB). Maximum for ${getFileTypeLabel(type)} is ${maxMB}MB.`
  }
  return null
}
