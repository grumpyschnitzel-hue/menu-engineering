'use client'

import { useState } from 'react'
import { useMenuData } from '@/hooks/useMenuData'
import ManualEntryForm from '@/components/DataEntry/ManualEntryForm'
import CSVUpload from '@/components/DataEntry/CSVUpload'
import ItemList from '@/components/DataEntry/ItemList'
import SummaryCards from '@/components/Matrix/SummaryCards'
import ScatterPlotChart from '@/components/Matrix/ScatterPlot'
import ItemDataTable from '@/components/Matrix/ItemDataTable'
import PricingCalculator from '@/components/Calculator/PricingCalculator'
import DescriptionGenerator from '@/components/Descriptions/DescriptionGenerator'
import ExportPanel from '@/components/Export/ExportPanel'
import SampleDataLoader from '@/components/SampleDataLoader'
import { MenuItemInput } from '@/lib/types'

type Tab = 'data' | 'matrix' | 'calculator' | 'descriptions' | 'export'

export default function MenuEngineeringPage() {
  const {
    project,
    loaded,
    classifiedItems,
    summaries,
    benchmarks,
    categories,
    addItem,
    addItems,
    replaceItems,
    updateItem,
    deleteItem,
    clearAll,
    setBenchmarkMethod,
    setEmailUnlocked,
    loadProjectData,
  } = useMenuData()

  const [activeTab, setActiveTab] = useState<Tab>('data')
  const [dataEntryMode, setDataEntryMode] = useState<'manual' | 'csv'>('manual')

  const hasItems = project.items.length > 0

  function handleCSVImport(items: (MenuItemInput & { id: string })[], mode: 'merge' | 'replace') {
    if (mode === 'merge') {
      addItems(items)
    } else {
      replaceItems(items)
    }
  }

  if (!loaded) {
    return (
      <div className="pt-24 pb-12 px-6 flex items-center justify-center min-h-screen">
        <div className="text-steel text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="font-mono text-xs text-gold tracking-widest uppercase mb-3">
            Menu Engineering Tool
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold uppercase leading-tight mb-4">
            Which Dishes Make Money.<br />
            <span className="text-gold">Which Drain It.</span>
          </h1>
          <p className="text-steel text-base max-w-xl mx-auto">
            Classify your menu items. Find hidden profit. Get specific actions.
            Built from 20 years of Master Chef kitchen operations.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-navy-border mb-8 overflow-x-auto no-print">
          {([
            { key: 'data', label: 'Data Entry', count: project.items.length },
            { key: 'matrix', label: 'Matrix', disabled: !hasItems },
            { key: 'calculator', label: 'Calculator' },
            { key: 'descriptions', label: 'Descriptions', disabled: !hasItems },
            { key: 'export', label: 'Export', disabled: !hasItems },
          ] as const).map(tab => (
            <button
              key={tab.key}
              className={`tab-button whitespace-nowrap ${activeTab === tab.key ? 'active' : ''} ${
                'disabled' in tab && tab.disabled ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              onClick={() => {
                if ('disabled' in tab && tab.disabled) return
                setActiveTab(tab.key)
              }}
            >
              {tab.label}
              {'count' in tab && tab.count != null && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {!hasItems && (
              <SampleDataLoader
                onLoad={replaceItems}
                hasItems={hasItems}
              />
            )}

            <div className="flex gap-2 no-print">
              <button
                className={`text-sm px-3 py-1.5 rounded ${dataEntryMode === 'manual' ? 'bg-gold/20 text-gold' : 'text-steel hover:text-white'}`}
                onClick={() => setDataEntryMode('manual')}
              >
                Manual Entry
              </button>
              <button
                className={`text-sm px-3 py-1.5 rounded ${dataEntryMode === 'csv' ? 'bg-gold/20 text-gold' : 'text-steel hover:text-white'}`}
                onClick={() => setDataEntryMode('csv')}
              >
                CSV Upload
              </button>
            </div>

            {dataEntryMode === 'manual' ? (
              <ManualEntryForm onAdd={addItem} periodDays={30} />
            ) : (
              <CSVUpload
                onImport={handleCSVImport}
                existingCount={project.items.length}
                periodDays={30}
              />
            )}

            <ItemList
              items={project.items}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onClearAll={clearAll}
            />

            {hasItems && (
              <div className="text-center no-print">
                <button
                  className="btn-gold"
                  onClick={() => setActiveTab('matrix')}
                >
                  View Matrix Analysis &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
              <div className="text-sm text-steel">
                {project.items.length} items analyzed
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-steel">Benchmark:</span>
                <select
                  className="select-field text-xs py-1.5 w-auto"
                  value={project.benchmarkMethod}
                  onChange={e => setBenchmarkMethod(e.target.value as 'average' | 'seventyPercent')}
                >
                  <option value="average">Average (Simple)</option>
                  <option value="seventyPercent">70% Rule (Industry)</option>
                </select>
              </div>
            </div>

            <SummaryCards summaries={summaries} />
            <ScatterPlotChart items={classifiedItems} benchmarks={benchmarks} />
            <ItemDataTable items={classifiedItems} categories={categories} />
          </div>
        )}

        {activeTab === 'calculator' && (
          <PricingCalculator items={classifiedItems} />
        )}

        {activeTab === 'descriptions' && (
          <DescriptionGenerator
            items={classifiedItems}
            emailUnlocked={project.emailUnlocked}
            onUnlock={setEmailUnlocked}
          />
        )}

        {activeTab === 'export' && (
          <ExportPanel
            items={classifiedItems}
            project={project}
            onLoadProject={loadProjectData}
          />
        )}

        {/* Bottom CTA */}
        {hasItems && activeTab === 'matrix' && (
          <div className="mt-12 text-center card bg-navy-light no-print">
            <div className="font-mono text-xs text-gold tracking-widest uppercase mb-3">
              Want the Full Profit Recovery?
            </div>
            <h3 className="font-display text-2xl font-bold uppercase mb-3">
              Book a 72-Hour <span className="text-gold">Profit Discovery</span>
            </h3>
            <p className="text-steel text-sm max-w-lg mx-auto mb-6">
              This tool shows you the matrix. The 72-Hour Sprint digs into every cost line, finds $5,000+ in hidden profit, and builds the systems to keep it. Guaranteed.
            </p>
            <a
              href="https://thegrumpychef.com/calculator.html"
              className="btn-gold"
            >
              Start Your Profit Discovery &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
