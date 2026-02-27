'use client'

import { useState, useMemo } from 'react'
import {
  MenuItem,
  Classification,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_COLORS,
} from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'

interface Props {
  items: MenuItem[]
  categories: string[]
}

type SortKey = 'name' | 'category' | 'classification' | 'menuPrice' | 'foodCost' |
  'contributionMargin' | 'foodCostPercent' | 'unitsSold' | 'salesMixPercent' | 'totalProfit'

type SortDir = 'asc' | 'desc'

export default function ItemDataTable({ items, categories }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('totalProfit')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterClassification, setFilterClassification] = useState<Classification | ''>('')

  const filteredAndSorted = useMemo(() => {
    let filtered = items

    if (filterCategory) {
      filtered = filtered.filter(i => i.category === filterCategory)
    }
    if (filterClassification) {
      filtered = filtered.filter(i => i.classification === filterClassification)
    }

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const aNum = Number(aVal)
      const bNum = Number(bVal)
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum
    })
  }, [items, sortKey, sortDir, filterCategory, filterClassification])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIndicator({ column }: { column: SortKey }) {
    if (sortKey !== column) return null
    return <span className="ml-1 text-gold" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  function sortAria(column: SortKey): 'ascending' | 'descending' | 'none' {
    if (sortKey !== column) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-lg font-bold uppercase">Item Analysis</h3>
        <div className="flex gap-3">
          <select
            className="select-field text-xs py-1.5 w-auto"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="select-field text-xs py-1.5 w-auto"
            value={filterClassification}
            onChange={e => setFilterClassification(e.target.value as Classification | '')}
          >
            <option value="">All Types</option>
            <option value="star">Stars</option>
            <option value="plowhorse">Plowhorses</option>
            <option value="puzzle">Puzzles</option>
            <option value="dog">Dogs</option>
          </select>
        </div>
      </div>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={sortAria('name')} onClick={() => toggleSort('name')}>Name<SortIndicator column="name" /></th>
              <th scope="col" aria-sort={sortAria('category')} onClick={() => toggleSort('category')}>Category<SortIndicator column="category" /></th>
              <th scope="col" aria-sort={sortAria('classification')} onClick={() => toggleSort('classification')}>Type<SortIndicator column="classification" /></th>
              <th scope="col" aria-sort={sortAria('menuPrice')} className="text-right" onClick={() => toggleSort('menuPrice')}>Price<SortIndicator column="menuPrice" /></th>
              <th scope="col" aria-sort={sortAria('foodCost')} className="text-right" onClick={() => toggleSort('foodCost')}>Cost<SortIndicator column="foodCost" /></th>
              <th scope="col" aria-sort={sortAria('contributionMargin')} className="text-right" onClick={() => toggleSort('contributionMargin')}>Margin<SortIndicator column="contributionMargin" /></th>
              <th scope="col" aria-sort={sortAria('foodCostPercent')} className="text-right hidden lg:table-cell" onClick={() => toggleSort('foodCostPercent')}>Cost %<SortIndicator column="foodCostPercent" /></th>
              <th scope="col" aria-sort={sortAria('unitsSold')} className="text-right" onClick={() => toggleSort('unitsSold')}>Units<SortIndicator column="unitsSold" /></th>
              <th scope="col" aria-sort={sortAria('salesMixPercent')} className="text-right hidden lg:table-cell" onClick={() => toggleSort('salesMixPercent')}>Mix %<SortIndicator column="salesMixPercent" /></th>
              <th scope="col" aria-sort={sortAria('totalProfit')} className="text-right" onClick={() => toggleSort('totalProfit')}>Profit<SortIndicator column="totalProfit" /></th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map(item => (
              <tr key={item.id}>
                <td className="font-medium whitespace-nowrap">{item.name}</td>
                <td className="text-steel">{item.category}</td>
                <td>
                  <span
                    className="classification-badge"
                    style={{
                      backgroundColor: CLASSIFICATION_COLORS[item.classification] + '20',
                      color: CLASSIFICATION_COLORS[item.classification],
                    }}
                  >
                    {CLASSIFICATION_LABELS[item.classification]}
                  </span>
                </td>
                <td className="num">{formatCurrency(item.menuPrice)}</td>
                <td className="num">{formatCurrency(item.foodCost)}</td>
                <td className="num font-medium">{formatCurrency(item.contributionMargin)}</td>
                <td className={`num hidden lg:table-cell ${item.foodCostPercent > 35 ? 'text-red-400' : item.foodCostPercent < 25 ? 'text-green-400' : ''}`}>
                  {formatPercent(item.foodCostPercent)}
                </td>
                <td className="num">{item.unitsSold}</td>
                <td className="num hidden lg:table-cell">{formatPercent(item.salesMixPercent)}</td>
                <td className="num font-medium" style={{ color: CLASSIFICATION_COLORS[item.classification] }}>
                  {formatCurrency(item.totalProfit)}
                </td>
                <td className="text-xs text-steel max-w-[200px]">{item.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view — shown only on small screens */}
      <div className="sm:hidden space-y-3">
        {filteredAndSorted.map(item => (
          <div
            key={item.id}
            className="bg-navy-light/50 border border-navy-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-xs text-steel">{item.category}</div>
              </div>
              <span
                className="classification-badge text-[10px]"
                style={{
                  backgroundColor: CLASSIFICATION_COLORS[item.classification] + '20',
                  color: CLASSIFICATION_COLORS[item.classification],
                }}
              >
                {CLASSIFICATION_LABELS[item.classification]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[10px] text-steel uppercase tracking-wider">Price</div>
                <div className="font-mono tabular-nums">{formatCurrency(item.menuPrice)}</div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase tracking-wider">Margin</div>
                <div className="font-mono tabular-nums font-medium">{formatCurrency(item.contributionMargin)}</div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase tracking-wider">Profit</div>
                <div className="font-mono tabular-nums font-medium" style={{ color: CLASSIFICATION_COLORS[item.classification] }}>
                  {formatCurrency(item.totalProfit)}
                </div>
              </div>
            </div>
            {item.recommendedAction && (
              <div className="mt-2 pt-2 border-t border-navy-border text-xs text-steel">
                {item.recommendedAction}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <p className="text-center text-steel py-8 text-sm">No items match the current filters.</p>
      )}
    </div>
  )
}
