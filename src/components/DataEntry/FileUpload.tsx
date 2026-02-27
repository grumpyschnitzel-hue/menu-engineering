'use client'

import { useState, useRef, useCallback } from 'react'
import { MenuItemInput } from '@/lib/types'
import {
  parseCSVString,
  detectColumns,
  isColumnMappingComplete,
  parseCSVWithMapping,
} from '@/lib/csv-parser'
import {
  detectFileType,
  isAcceptedFile,
  getFileTypeIcon,
  getFileTypeLabel,
  validateFileSize,
  ACCEPTED_EXTENSIONS,
} from '@/lib/parsers/file-detector'
import type { AcceptedFileType } from '@/lib/parsers/file-detector'
import type { ParsedExtraction, ColumnMappingSuggestion } from '@/lib/parsers/types'
import { getAIMappingSuggestions, applyAISuggestions } from '@/lib/parsers/ai-mapping'
import { matchInvoiceToMenu, type CostMatch } from '@/lib/parsers/cost-matcher'

interface Props {
  onImport: (items: (MenuItemInput & { id: string })[], mode: 'merge' | 'replace') => void
  onUpdateCosts?: (updates: { id: string; foodCost: number }[]) => void
  existingItems?: (MenuItemInput & { id: string })[]
  existingCount: number
  periodDays: number
}

type Step = 'upload' | 'processing' | 'mapping' | 'preview' | 'cost-review' | 'done'

export default function FileUpload({ onImport, onUpdateCosts, existingItems, existingCount, periodDays }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [fileType, setFileType] = useState<AcceptedFileType>('unknown')
  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, number | null>>({
    name: null, category: null, menuPrice: null, foodCost: null, unitsSold: null,
  })
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([])
  const [parsedItems, setParsedItems] = useState<(MenuItemInput & { id: string })[]>([])
  const [processingMessage, setProcessingMessage] = useState('')
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<ColumnMappingSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [costMatches, setCostMatches] = useState<CostMatch[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processCSVFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      if (!text) return

      const { headers: h, rows: r, rawData: rd } = parseCSVString(text)
      setHeaders(h)
      setRawData(rd)

      const detected = detectColumns(h)
      let mappingState: Record<string, number | null> = {
        name: detected.name ?? null,
        category: detected.category ?? null,
        menuPrice: detected.menuPrice ?? null,
        foodCost: detected.foodCost ?? null,
        unitsSold: detected.unitsSold ?? null,
      }

      if (isColumnMappingComplete(detected)) {
        setMapping(mappingState)
        const result = parseCSVWithMapping(rd, h, detected as any, periodDays)
        setParsedItems(result.items)
        setErrors(result.errors)
        setStep('preview')
      } else {
        // Alias detection incomplete — try AI mapping
        setMapping(mappingState)
        setStep('mapping')
        setAiLoading(true)

        try {
          const suggestions = await getAIMappingSuggestions(h, r)
          if (suggestions.length > 0) {
            const { mapping: enhanced, applied } = applyAISuggestions(mappingState, suggestions)
            mappingState = enhanced
            setMapping(enhanced)
            setAiSuggestions(applied)
          }
        } catch {
          // AI failed silently
        } finally {
          setAiLoading(false)
        }
      }
    }
    reader.readAsText(file)
  }, [periodDays])

  const processPDFFile = useCallback(async (file: File) => {
    setStep('processing')
    setProcessingMessage('Extracting data from PDF...')
    setProcessingError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/parse/pdf', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'PDF parsing failed' }))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const result = await res.json()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract data from PDF')
      }

      const extraction: ParsedExtraction = result.data
      loadExtractionIntoMapping(extraction)
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : 'Failed to process PDF')
    }
  }, [])

  const processImageFile = useCallback(async (file: File) => {
    setStep('processing')
    setProcessingMessage('Analyzing image with AI...')
    setProcessingError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/parse/image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Image analysis failed' }))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const result = await res.json()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract data from image')
      }

      const extraction: ParsedExtraction = result.data
      loadExtractionIntoMapping(extraction)
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : 'Failed to process image')
    }
  }, [])

  /** Load a ParsedExtraction (from PDF or image) into the mapping UI */
  async function loadExtractionIntoMapping(extraction: ParsedExtraction) {
    setHeaders(extraction.headers)
    setRawData(extraction.rawData)

    // Try auto-detecting columns using existing alias logic
    const detected = detectColumns(extraction.headers)
    let mappingState: Record<string, number | null> = {
      name: detected.name ?? null,
      category: detected.category ?? null,
      menuPrice: detected.menuPrice ?? null,
      foodCost: detected.foodCost ?? null,
      unitsSold: detected.unitsSold ?? null,
    }

    if (isColumnMappingComplete(detected)) {
      const result = parseCSVWithMapping(extraction.rawData, extraction.headers, detected as any, periodDays)
      setParsedItems(result.items)
      setErrors(result.errors)
      setMapping(mappingState)
      setStep('preview')
    } else {
      // Alias detection incomplete — try AI mapping
      setAiLoading(true)
      setStep('mapping')
      setMapping(mappingState)

      try {
        const suggestions = await getAIMappingSuggestions(extraction.headers, extraction.rows)
        if (suggestions.length > 0) {
          const { mapping: enhanced, applied } = applyAISuggestions(mappingState, suggestions)
          mappingState = enhanced
          setMapping(enhanced)
          setAiSuggestions(applied)
        }
      } catch {
        // AI failed silently — user can still map manually
      } finally {
        setAiLoading(false)
      }
    }
  }

  function handleFile(file: File) {
    const type = detectFileType(file)
    setFileType(type)
    setFileName(file.name)
    setProcessingError(null)

    // Validate file size
    const sizeError = validateFileSize(file, type)
    if (sizeError) {
      setStep('processing')
      setProcessingError(sizeError)
      return
    }

    switch (type) {
      case 'csv':
        processCSVFile(file)
        break
      case 'pdf':
        processPDFFile(file)
        break
      case 'image':
        processImageFile(file)
        break
      default:
        setStep('processing')
        setProcessingError('Unsupported file type. Please upload a CSV, PDF, or image file.')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && isAcceptedFile(file)) {
      handleFile(file)
    } else if (file) {
      setStep('processing')
      setProcessingError(`"${file.name}" is not a supported file type. Upload a CSV, PDF, or photo.`)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleMappingConfirm() {
    const m = {
      name: mapping.name!,
      category: mapping.category ?? -1,
      menuPrice: mapping.menuPrice!,
      foodCost: mapping.foodCost!,
      unitsSold: mapping.unitsSold!,
    }
    const result = parseCSVWithMapping(rawData, headers, m, periodDays)
    setParsedItems(result.items)
    setErrors(result.errors)
    setStep('preview')
  }

  function handleImport(mode: 'merge' | 'replace') {
    onImport(parsedItems, mode)
    setStep('done')
    setTimeout(() => {
      handleReset()
    }, 2000)
  }

  function handleUpdateCostsPreview() {
    if (!existingItems || !onUpdateCosts) return

    // Extract item names and costs from the current rawData using the mapping
    const invoiceItems: { name: string; cost: number }[] = []
    for (const row of rawData) {
      const values = headers.map(h => row[h] || '')
      const name = mapping.name != null ? values[mapping.name]?.trim() : ''
      const costStr = mapping.foodCost != null ? values[mapping.foodCost]?.trim() : ''
      if (!name || !costStr) continue

      const cost = parseFloat(costStr.replace(/[$,\s]/g, ''))
      if (!isNaN(cost) && cost > 0) {
        invoiceItems.push({ name, cost })
      }
    }

    const matches = matchInvoiceToMenu(invoiceItems, existingItems)
    setCostMatches(matches)
    setStep('cost-review')
  }

  function handleConfirmCostUpdate() {
    if (!onUpdateCosts) return

    const updates = costMatches
      .filter(m => m.matchedMenuItemId !== null)
      .map(m => ({
        id: m.matchedMenuItemId!,
        foodCost: m.newCost,
      }))

    if (updates.length > 0) {
      onUpdateCosts(updates)
    }

    setStep('done')
    setTimeout(() => {
      handleReset()
    }, 2000)
  }

  function handleReset() {
    setStep('upload')
    setFileType('unknown')
    setFileName('')
    setHeaders([])
    setRawData([])
    setParsedItems([])
    setErrors([])
    setProcessingMessage('')
    setProcessingError(null)
    setAiSuggestions([])
    setAiLoading(false)
    setCostMatches([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const isMappingValid = mapping.name != null && mapping.menuPrice != null &&
    mapping.foodCost != null && mapping.unitsSold != null
  const isCostMappingValid = mapping.name != null && mapping.foodCost != null

  return (
    <div className="card">
      <h3 className="font-display text-lg font-bold uppercase mb-4">
        File Upload
        {fileName && step !== 'upload' && (
          <span className="ml-2 text-sm font-normal text-steel">
            {getFileTypeIcon(fileType)} {fileName}
          </span>
        )}
      </h3>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${dragActive ? 'border-gold bg-gold/5' : 'border-navy-border hover:border-gold/50'}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-3xl mb-3">📊</div>
          <p className="text-white font-medium mb-1">Drop your file here or click to browse</p>
          <p className="text-steel text-sm mb-3">
            Supports CSV, PDF invoices, and photos of receipts
          </p>
          <div className="flex justify-center gap-3 text-xs text-steel/60">
            <span>📊 CSV</span>
            <span>📄 PDF</span>
            <span>📷 JPG/PNG</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Step 1.5: Processing (PDF/Image) */}
      {step === 'processing' && (
        <div className="text-center py-8">
          {processingError ? (
            <>
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-red-400 font-medium mb-2">{processingError}</p>
              <button className="btn-outline mt-3" onClick={handleReset}>
                Try another file
              </button>
            </>
          ) : (
            <>
              <div className="text-3xl mb-3 animate-pulse">{getFileTypeIcon(fileType)}</div>
              <p className="text-white font-medium mb-1">{processingMessage}</p>
              <p className="text-steel text-sm">This may take a few seconds...</p>
              <button className="btn-outline mt-4 text-xs" onClick={handleReset}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div>
          <p className="text-steel text-sm mb-4">
            {fileType === 'csv'
              ? "Some columns couldn't be auto-detected. Map them manually:"
              : `Extracted ${rawData.length} rows from your ${getFileTypeLabel(fileType).toLowerCase()}. Map the columns:`}
          </p>
          {aiLoading && (
            <div className="mb-3 p-2 bg-gold/5 border border-gold/20 rounded-lg text-xs text-gold flex items-center gap-2">
              <span className="animate-pulse">✨</span> AI is suggesting column mappings...
            </div>
          )}
          {aiSuggestions.length > 0 && !aiLoading && (
            <div className="mb-3 p-2 bg-gold/5 border border-gold/20 rounded-lg text-xs text-gold">
              ✨ AI suggested {aiSuggestions.length} column mapping{aiSuggestions.length > 1 ? 's' : ''} — verify and adjust if needed
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['name', 'category', 'menuPrice', 'foodCost', 'unitsSold'] as const).map(field => {
              const aiSuggestion = aiSuggestions.find(s => s.field === field)
              return (
              <div key={field}>
                <label className="input-label">
                  {field === 'name' ? 'Item Name *' :
                   field === 'category' ? 'Category' :
                   field === 'menuPrice' ? 'Menu Price *' :
                   field === 'foodCost' ? 'Food Cost *' : 'Units Sold *'}
                  {aiSuggestion && (
                    <span className="ml-1 text-gold text-xs" title={`AI: ${aiSuggestion.reason} (${Math.round(aiSuggestion.confidence * 100)}%)`}>
                      ✨
                    </span>
                  )}
                </label>
                <select
                  className="select-field"
                  value={mapping[field] ?? ''}
                  onChange={e => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value)
                    setMapping(prev => ({ ...prev, [field]: val }))
                  }}
                >
                  <option value="">— Select column —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>
            )})}
          </div>

          {/* Show sample data so user can see what's in each column */}
          {rawData.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto rounded-lg border border-navy-border">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 3).map((row, ri) => (
                    <tr key={ri}>
                      {headers.map((h, i) => (
                        <td key={i} className="whitespace-nowrap">{row[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              className="btn-gold"
              disabled={!isMappingValid}
              onClick={handleMappingConfirm}
            >
              Continue (Full Import)
            </button>
            {existingCount > 0 && onUpdateCosts && (
              <button
                className="btn-outline text-gold border-gold/30 hover:bg-gold/10"
                disabled={!isCostMappingValid}
                onClick={handleUpdateCostsPreview}
                title="Only update food costs on existing items — no new items added"
              >
                Update Costs Only
              </button>
            )}
            <button className="btn-outline" onClick={handleReset}>Cancel</button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div>
          <p className="text-white font-medium mb-1">
            {parsedItems.length} items ready to import
            {errors.length > 0 && (
              <span className="text-red-400 ml-2">({errors.length} skipped)</span>
            )}
          </p>

          {parsedItems.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-navy-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Cost</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.slice(0, 5).map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td className="text-steel">{item.category}</td>
                      <td>${item.menuPrice.toFixed(2)}</td>
                      <td>${item.foodCost.toFixed(2)}</td>
                      <td>{item.unitsSold}</td>
                    </tr>
                  ))}
                  {parsedItems.length > 5 && (
                    <tr>
                      <td colSpan={5} className="text-center text-steel text-xs py-2">
                        ...and {parsedItems.length - 5} more items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
              <p className="text-red-400 text-xs font-semibold mb-1">Skipped rows:</p>
              {errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-red-400/80 text-xs">Row {err.row}: {err.message}</p>
              ))}
              {errors.length > 5 && (
                <p className="text-red-400/60 text-xs mt-1">...and {errors.length - 5} more</p>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-3 flex-wrap">
            {existingCount > 0 ? (
              <>
                <button className="btn-gold" onClick={() => handleImport('merge')}>
                  Merge with existing ({existingCount} items)
                </button>
                <button className="btn-outline" onClick={() => handleImport('replace')}>
                  Replace all
                </button>
              </>
            ) : (
              <button className="btn-gold" onClick={() => handleImport('replace')}>
                Import {parsedItems.length} items
              </button>
            )}
            <button className="btn-outline" onClick={handleReset}>Cancel</button>
          </div>
        </div>
      )}

      {/* Step 3b: Cost Update Review */}
      {step === 'cost-review' && (
        <div>
          {(() => {
            const matched = costMatches.filter(m => m.matchedMenuItemId !== null)
            const unmatched = costMatches.filter(m => m.matchedMenuItemId === null)
            return (
              <>
                <p className="text-white font-medium mb-1">
                  {matched.length} items matched for cost update
                  {unmatched.length > 0 && (
                    <span className="text-steel ml-2">({unmatched.length} unmatched)</span>
                  )}
                </p>

                {matched.length > 0 && (
                  <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-navy-border">
                    <table className="data-table text-sm">
                      <thead>
                        <tr>
                          <th>Invoice Item</th>
                          <th>Matched To</th>
                          <th>Old Cost</th>
                          <th>New Cost</th>
                          <th>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matched.map((m, i) => (
                          <tr key={i}>
                            <td className="text-xs">{m.invoiceItemName}</td>
                            <td className="text-gold text-xs">{m.matchedMenuItemName}</td>
                            <td>${m.oldCost?.toFixed(2)}</td>
                            <td>${m.newCost.toFixed(2)}</td>
                            <td className={m.costChange && m.costChange > 0 ? 'text-red-400' : 'text-green-400'}>
                              {m.costChange != null ? (
                                <>
                                  {m.costChange > 0 ? '+' : ''}${m.costChange.toFixed(2)}
                                  {m.costChangePercent != null && (
                                    <span className="text-xs ml-1">
                                      ({m.costChangePercent > 0 ? '+' : ''}{m.costChangePercent.toFixed(1)}%)
                                    </span>
                                  )}
                                </>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {unmatched.length > 0 && (
                  <div className="mt-3 p-3 bg-navy-light/50 border border-navy-border rounded-lg">
                    <p className="text-steel text-xs font-semibold mb-1">Unmatched invoice items (not updated):</p>
                    {unmatched.slice(0, 5).map((m, i) => (
                      <p key={i} className="text-steel/70 text-xs">{m.invoiceItemName} — ${m.invoiceCost.toFixed(2)}</p>
                    ))}
                    {unmatched.length > 5 && (
                      <p className="text-steel/50 text-xs mt-1">...and {unmatched.length - 5} more</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  {matched.length > 0 && (
                    <button className="btn-gold" onClick={handleConfirmCostUpdate}>
                      Update {matched.length} costs
                    </button>
                  )}
                  <button className="btn-outline" onClick={() => setStep('mapping')}>
                    Back to mapping
                  </button>
                  <button className="btn-outline" onClick={handleReset}>Cancel</button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-gold font-semibold">Items imported successfully</p>
        </div>
      )}
    </div>
  )
}
