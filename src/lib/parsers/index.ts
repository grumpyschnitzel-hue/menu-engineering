/**
 * Multi-Format Data Ingestion Pipeline
 * Barrel exports for all parser functions and types.
 */

// Types
export type {
  FileSourceType,
  ImportMode,
  ParsedExtraction,
  ParserResult,
  ColumnMappingSuggestion,
  PartialColumnMapping,
} from './types'

// File detection
export {
  detectFileType,
  isAcceptedFile,
  getFileTypeLabel,
  getFileTypeIcon,
  validateFileSize,
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZES,
} from './file-detector'
export type { AcceptedFileType } from './file-detector'

// CSV adapter
export { adaptCSVToParsedExtraction } from './csv-adapter'

// PDF parser
export {
  extractTableFromPDFResult,
  detectVendorFormat,
  cleanSyscoRow,
  cleanGenericRow,
  extractGenericHeaders,
} from './pdf-parser'
export type { PDFTableResult, VendorFormat } from './pdf-parser'

// PDF client
export { parsePDFFile } from './pdf-client'

// Image client
export { parseImageFile } from './image-client'

// AI column mapping
export { getAIMappingSuggestions, applyAISuggestions } from './ai-mapping'

// Cost matcher
export {
  matchInvoiceToMenu,
  normalizeName,
  tokenOverlap,
} from './cost-matcher'
export type { CostMatch } from './cost-matcher'
