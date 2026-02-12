'use client'

import { useState, useRef, useCallback } from 'react'
import { MenuItemInput } from '@/lib/types'
import {
  parseCSVString,
  detectColumns,
  isColumnMappingComplete,
  parseCSVWithMapping,
} from '@/lib/csv-parser'

interface Props {
  onImport: (items: (MenuItemInput & { id: string })[], mode: 'merge' | 'replace') => void
  existingCount: number
  periodDays: number
}

type Step = 'upload' | 'mapping' | 'preview' | 'done'

export default function CSVUpload({ onImport, existingCount, periodDays }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, number | null>>({
    name: null, category: null, menuPrice: null, foodCost: null, unitsSold: null,
  })
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([])
  const [parsedItems, setParsedItems] = useState<(MenuItemInput & { id: string })[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return

      const { headers: h, rawData: rd } = parseCSVString(text)
      setHeaders(h)
      setRawData(rd)

      const detected = detectColumns(h)
      const mappingState: Record<string, number | null> = {
        name: detected.name ?? null,
        category: detected.category ?? null,
        menuPrice: detected.menuPrice ?? null,
        foodCost: detected.foodCost ?? null,
        unitsSold: detected.unitsSold ?? null,
      }
      setMapping(mappingState)

      if (isColumnMappingComplete(detected)) {
        const result = parseCSVWithMapping(rd, h, detected as any, periodDays)
        setParsedItems(result.items)
        setErrors(result.errors)
        setStep('preview')
      } else {
        setStep('mapping')
      }
    }
    reader.readAsText(file)
  }, [periodDays])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      processFile(file)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleMappingConfirm() {
    const m = {
      name: mapping.name!,
      category: mapping.category ?? -1,
      menuPrice: mapping.menuPrice!,
      foodCost: mapping.foodCost!,
      unitsSold: mapping.unitsSold!,
    }
    // category is optional, use -1 sentinel
    const actualMapping = {
      ...m,
      category: mapping.category != null ? mapping.category : undefined,
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
      setStep('upload')
      setParsedItems([])
      setErrors([])
    }, 2000)
  }

  function handleReset() {
    setStep('upload')
    setHeaders([])
    setRawData([])
    setParsedItems([])
    setErrors([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const isMappingValid = mapping.name != null && mapping.menuPrice != null &&
    mapping.foodCost != null && mapping.unitsSold != null

  return (
    <div className="card">
      <h3 className="font-display text-lg font-bold uppercase mb-4">CSV Upload</h3>

      {step === 'upload' && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${dragActive ? 'border-gold bg-gold/5' : 'border-navy-border hover:border-gold/50'}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-3xl mb-3">📄</div>
          <p className="text-white font-medium mb-1">Drop your CSV here or click to browse</p>
          <p className="text-steel text-sm">Format: Item Name, Category, Menu Price, Food Cost, Units Sold</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {step === 'mapping' && (
        <div>
          <p className="text-steel text-sm mb-4">
            Some columns couldn&apos;t be auto-detected. Map them manually:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['name', 'category', 'menuPrice', 'foodCost', 'unitsSold'] as const).map(field => (
              <div key={field}>
                <label className="input-label">
                  {field === 'name' ? 'Item Name *' :
                   field === 'category' ? 'Category' :
                   field === 'menuPrice' ? 'Menu Price *' :
                   field === 'foodCost' ? 'Food Cost *' : 'Units Sold *'}
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
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="btn-gold"
              disabled={!isMappingValid}
              onClick={handleMappingConfirm}
            >
              Continue
            </button>
            <button className="btn-outline" onClick={handleReset}>Cancel</button>
          </div>
        </div>
      )}

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

      {step === 'done' && (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-gold font-semibold">Items imported successfully</p>
        </div>
      )}
    </div>
  )
}
