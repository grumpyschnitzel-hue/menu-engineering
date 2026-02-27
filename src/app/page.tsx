'use client'

import { useState } from 'react'
import { useMenuData } from '@/hooks/useMenuData'
import ManualEntryForm from '@/components/DataEntry/ManualEntryForm'
import FileUpload from '@/components/DataEntry/FileUpload'
import ItemList from '@/components/DataEntry/ItemList'
import SummaryCards from '@/components/Matrix/SummaryCards'
import ScatterPlotChart from '@/components/Matrix/ScatterPlot'
import ItemDataTable from '@/components/Matrix/ItemDataTable'
import PricingCalculator from '@/components/Calculator/PricingCalculator'
import DescriptionGenerator from '@/components/Descriptions/DescriptionGenerator'
import ExportPanel from '@/components/Export/ExportPanel'
import ChoiceAlerts from '@/components/Psychology/ChoiceAlerts'
import SocialProofBadges from '@/components/Psychology/SocialProofBadges'
import AnchoringAdvisor from '@/components/Psychology/AnchoringAdvisor'
import DecoyDetector from '@/components/Psychology/DecoyDetector'
import DescriptionScorer from '@/components/Psychology/DescriptionScorer'
import PlacementAdvisor from '@/components/Psychology/PlacementAdvisor'
import RevenueSimulator from '@/components/Psychology/RevenueSimulator'
import MenuHealthChecklist from '@/components/Psychology/MenuHealthChecklist'
import SampleDataLoader from '@/components/SampleDataLoader'
import { ToastProvider } from '@/components/Toast'
import { MenuItemInput, Classification } from '@/lib/types'

type Tab = 'data' | 'matrix' | 'calculator' | 'descriptions' | 'psychology' | 'export'

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
    updateItemCosts,
    loadProjectData,
  } = useMenuData()

  const [activeTab, setActiveTab] = useState<Tab>('data')
  const [dataEntryMode, setDataEntryMode] = useState<'manual' | 'file'>('manual')
  const [matrixFilter, setMatrixFilter] = useState<Classification | null>(null)
  const [showScatterPlot, setShowScatterPlot] = useState(false)

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
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Skeleton hero */}
          <div className="text-center mb-10">
            <div className="skeleton h-3 w-32 mx-auto mb-4" />
            <div className="skeleton h-10 w-80 mx-auto mb-3" />
            <div className="skeleton h-4 w-64 mx-auto" />
          </div>
          {/* Skeleton tabs */}
          <div className="flex gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-24 rounded" />
            ))}
          </div>
          {/* Skeleton content */}
          <div className="space-y-4">
            <div className="skeleton h-48 w-full rounded-xl" />
            <div className="skeleton h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
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
        <div
          className="tab-bar flex gap-1 border-b border-navy-border mb-8 overflow-x-auto no-print"
          role="tablist"
          aria-label="Menu Engineering sections"
        >
          {([
            { key: 'data', label: 'Data Entry', count: project.items.length },
            { key: 'matrix', label: 'Matrix', disabled: !hasItems },
            { key: 'calculator', label: 'Calculator' },
            { key: 'descriptions', label: 'Descriptions', disabled: !hasItems },
            { key: 'psychology', label: 'Psychology', disabled: !hasItems },
            { key: 'export', label: 'Export', disabled: !hasItems },
          ] as const).map(tab => {
            const isDisabled = 'disabled' in tab && tab.disabled
            return (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                aria-disabled={isDisabled || undefined}
                title={isDisabled ? 'Add menu items first' : undefined}
                className={`tab-button whitespace-nowrap ${activeTab === tab.key ? 'active' : ''} ${
                  isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (isDisabled) return
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
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'data' && (
          <div className="tab-content space-y-6" role="tabpanel" id="panel-data" aria-labelledby="tab-data">
            {!hasItems && (
              <SampleDataLoader
                onLoad={replaceItems}
                hasItems={hasItems}
              />
            )}

            <div className="flex items-center justify-between no-print">
              <div className="flex gap-2">
                <button
                  className={`text-sm px-3 py-1.5 rounded ${dataEntryMode === 'manual' ? 'bg-gold/20 text-gold' : 'text-steel hover:text-white'}`}
                  onClick={() => setDataEntryMode('manual')}
                >
                  Manual Entry
                </button>
                <button
                  className={`text-sm px-3 py-1.5 rounded ${dataEntryMode === 'file' ? 'bg-gold/20 text-gold' : 'text-steel hover:text-white'}`}
                  onClick={() => setDataEntryMode('file')}
                >
                  File Upload
                </button>
              </div>
              {hasItems && (
                <SampleDataLoader
                  onLoad={replaceItems}
                  hasItems={hasItems}
                />
              )}
            </div>

            {dataEntryMode === 'manual' ? (
              <ManualEntryForm onAdd={addItem} periodDays={30} />
            ) : (
              <FileUpload
                onImport={handleCSVImport}
                onUpdateCosts={updateItemCosts}
                existingItems={project.items}
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
          <div className="tab-content space-y-6" role="tabpanel" id="panel-matrix" aria-labelledby="tab-matrix">
            <div className="flex items-center justify-between no-print">
              <div className="text-sm text-steel">
                {project.items.length} items analyzed
                {matrixFilter && (
                  <button
                    className="ml-3 text-xs text-gold hover:text-white transition-colors"
                    onClick={() => setMatrixFilter(null)}
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                    showScatterPlot
                      ? 'border-gold text-gold'
                      : 'border-navy-border text-steel hover:text-white'
                  }`}
                  onClick={() => setShowScatterPlot(prev => !prev)}
                >
                  {showScatterPlot ? 'Hide' : 'Show'} Chart
                </button>
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

            <SummaryCards
              summaries={summaries}
              activeFilter={matrixFilter}
              onFilterChange={setMatrixFilter}
            />
            {showScatterPlot && (
              <ScatterPlotChart
                items={matrixFilter ? classifiedItems.filter(i => i.classification === matrixFilter) : classifiedItems}
                benchmarks={benchmarks}
              />
            )}
            <ItemDataTable
              items={matrixFilter ? classifiedItems.filter(i => i.classification === matrixFilter) : classifiedItems}
              categories={categories}
            />
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="tab-content" role="tabpanel" id="panel-calculator" aria-labelledby="tab-calculator">
          <PricingCalculator items={classifiedItems} />
          </div>
        )}

        {activeTab === 'descriptions' && (
          <div className="tab-content" role="tabpanel" id="panel-descriptions" aria-labelledby="tab-descriptions">
          <DescriptionGenerator
            items={classifiedItems}
            emailUnlocked={project.emailUnlocked}
            onUnlock={setEmailUnlocked}
          />
          </div>
        )}

        {activeTab === 'psychology' && (
          <div className="tab-content space-y-8" role="tabpanel" id="panel-psychology" aria-labelledby="tab-psychology">
            <div className="text-center mb-2">
              <div className="font-mono text-xs text-gold tracking-widest uppercase mb-2">
                Psychology-Powered Advisory
              </div>
              <p className="text-steel text-sm max-w-lg mx-auto">
                Research-backed recommendations from Cornell, NRA, and behavioral science studies.
                Each insight includes the source research and projected revenue impact.
              </p>
            </div>

            <MenuHealthChecklist items={classifiedItems} />

            <div className="border-t border-navy-border pt-8">
              <div className="font-mono text-xs text-gold tracking-widest uppercase mb-6">
                Detailed Analysis
              </div>
              <div className="space-y-8">
                <ChoiceAlerts items={classifiedItems} />
                <SocialProofBadges items={classifiedItems} />
                <AnchoringAdvisor items={classifiedItems} />
                <DecoyDetector items={classifiedItems} />
                <PlacementAdvisor items={classifiedItems} />
              </div>
            </div>

            <div className="border-t border-navy-border pt-8">
              <div className="font-mono text-xs text-gold tracking-widest uppercase mb-6">
                Tools
              </div>
              <div className="space-y-8">
                <DescriptionScorer />
                <RevenueSimulator items={classifiedItems} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="tab-content" role="tabpanel" id="panel-export" aria-labelledby="tab-export">
          <ExportPanel
            items={classifiedItems}
            project={project}
            onLoadProject={loadProjectData}
          />
          </div>
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
    </ToastProvider>
  )
}
