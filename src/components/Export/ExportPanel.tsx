'use client'

import { useRef, useState } from 'react'
import { MenuItem, ProjectData, CLASSIFICATION_LABELS } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { exportProjectJSON, importProjectJSON } from '@/lib/storage'

interface Props {
  items: MenuItem[]
  project: ProjectData
  onLoadProject: (data: ProjectData) => void
}

export default function ExportPanel({ items, project, onLoadProject }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string>('')

  function exportCSV() {
    const headers = [
      'Item Name', 'Category', 'Classification', 'Menu Price', 'Food Cost',
      'Contribution Margin', 'Food Cost %', 'Units Sold', 'Sales Mix %',
      'Total Profit', 'Recommended Action',
    ]

    const rows = items.map(item => [
      item.name,
      item.category,
      CLASSIFICATION_LABELS[item.classification],
      item.menuPrice.toFixed(2),
      item.foodCost.toFixed(2),
      item.contributionMargin.toFixed(2),
      item.foodCostPercent.toFixed(1),
      item.unitsSold.toString(),
      item.salesMixPercent.toFixed(1),
      item.totalProfit.toFixed(2),
      item.recommendedAction,
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    downloadFile(csv, 'menu-analysis.csv', 'text/csv')
  }

  function exportJSON() {
    const json = exportProjectJSON(project)
    downloadFile(json, 'menu-engineering-project.json', 'application/json')
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const imported = importProjectJSON(text)
      if (imported) {
        onLoadProject(imported)
        setImportStatus(`Loaded ${imported.items.length} items`)
        setTimeout(() => setImportStatus(''), 3000)
      } else {
        setImportStatus('Invalid project file')
        setTimeout(() => setImportStatus(''), 3000)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function exportPDF() {
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      // Title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Menu Engineering Report', pageWidth / 2, y, { align: 'center' })
      y += 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text('The Grumpy Chef | Built from 20 years of Master Chef kitchen operations', pageWidth / 2, y, { align: 'center' })
      doc.setTextColor(0)
      y += 12

      // Summary
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Classification Summary', 14, y)
      y += 8

      const classifications = ['star', 'plowhorse', 'puzzle', 'dog'] as const
      const pdfLabels = {
        star: '★ Star',
        plowhorse: '► Plowhorse',
        puzzle: '◆ Puzzle',
        dog: '✕ Dog',
      }

      for (const cls of classifications) {
        const clsItems = items.filter(i => i.classification === cls)
        const totalProfit = clsItems.reduce((sum, i) => sum + i.totalProfit, 0)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${pdfLabels[cls]} (${clsItems.length} items)`, 14, y)
        doc.setFont('helvetica', 'normal')
        doc.text(`Total Profit: ${formatCurrency(totalProfit)}`, pageWidth - 14, y, { align: 'right' })
        y += 6
      }
      y += 8

      // Item table
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Item Details', 14, y)
      y += 8

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      const cols = ['Name', 'Cat.', 'Type', 'Price', 'Cost', 'Margin', 'Cost%', 'Units', 'Profit']
      const colWidths = [35, 20, 22, 18, 18, 18, 16, 16, 20]
      let x = 14
      cols.forEach((col, i) => {
        doc.text(col, x, y)
        x += colWidths[i]
      })
      y += 2
      doc.setLineWidth(0.3)
      doc.line(14, y, pageWidth - 14, y)
      y += 4

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)

      const sortedItems = [...items].sort((a, b) => b.totalProfit - a.totalProfit)

      for (const item of sortedItems) {
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        x = 14
        const row = [
          item.name.substring(0, 18),
          item.category.substring(0, 10),
          pdfLabels[item.classification],
          formatCurrency(item.menuPrice),
          formatCurrency(item.foodCost),
          formatCurrency(item.contributionMargin),
          formatPercent(item.foodCostPercent),
          item.unitsSold.toString(),
          formatCurrency(item.totalProfit),
        ]

        row.forEach((val, i) => {
          doc.text(val, x, y)
          x += colWidths[i]
        })
        y += 5
      }

      // Action items
      y += 8
      if (y > 250) { doc.addPage(); y = 20 }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Top Actions', 14, y)
      y += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const topStars = items.filter(i => i.classification === 'star').slice(0, 3)
      const topDogs = items.filter(i => i.classification === 'dog').slice(0, 3)
      const topPuzzles = items.filter(i => i.classification === 'puzzle').slice(0, 3)

      if (topStars.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('Protect these Stars:', 14, y); y += 5
        doc.setFont('helvetica', 'normal')
        topStars.forEach(item => { doc.text(`  • ${item.name} — ${formatCurrency(item.totalProfit)} profit`, 14, y); y += 5 })
        y += 3
      }

      if (topPuzzles.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('Promote these Puzzles:', 14, y); y += 5
        doc.setFont('helvetica', 'normal')
        topPuzzles.forEach(item => { doc.text(`  • ${item.name} — high margin, needs visibility`, 14, y); y += 5 })
        y += 3
      }

      if (topDogs.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('Evaluate these Dogs:', 14, y); y += 5
        doc.setFont('helvetica', 'normal')
        topDogs.forEach(item => { doc.text(`  • ${item.name} — consider removing or re-engineering`, 14, y); y += 5 })
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        'Generated by The Grumpy Chef Menu Engineering Tool | thegrumpychef.com',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )

      doc.save('menu-engineering-report.pdf')
    } catch (e) {
      console.error('PDF generation failed:', e)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="card">
      <h3 className="font-display text-lg font-bold uppercase mb-4">Export & Save</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          className="btn-outline flex flex-col items-center gap-2 py-4"
          onClick={exportPDF}
          disabled={items.length === 0}
        >
          <span className="text-xl">📄</span>
          <span>Download PDF Report</span>
        </button>

        <button
          className="btn-outline flex flex-col items-center gap-2 py-4"
          onClick={exportCSV}
          disabled={items.length === 0}
        >
          <span className="text-xl">📊</span>
          <span>Export CSV</span>
        </button>

        <button
          className="btn-outline flex flex-col items-center gap-2 py-4"
          onClick={handlePrint}
          disabled={items.length === 0}
        >
          <span className="text-xl">🖨️</span>
          <span>Print View</span>
        </button>

        <button
          className="btn-outline flex flex-col items-center gap-2 py-4"
          onClick={exportJSON}
          disabled={items.length === 0}
        >
          <span className="text-xl">💾</span>
          <span>Save Project</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          className="text-sm text-gold hover:text-white transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          Load Project File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportJSON}
        />
        {importStatus && (
          <span className={`text-sm ${importStatus.includes('Invalid') ? 'text-red-400' : 'text-green-400'}`}>
            {importStatus}
          </span>
        )}
      </div>
    </div>
  )
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
