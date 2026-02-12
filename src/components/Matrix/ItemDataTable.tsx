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
    return <span className="ml-1 text-gold">{sortDir === 'asc' ? '↑' : '↓'}</span>
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
            <option value="star">⭐ Stars</option>
            <option value="plowhorse">🐴 Plowhorses</option>
            <option value="puzzle">🧩 Puzzles</option>
            <option value="dog">🐕 Dogs</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Name<SortIndicator column="name" /></th>
              <th onClick={() => toggleSort('category')}>Category<SortIndicator column="category" /></th>
              <th onClick={() => toggleSort('classification')}>Type<SortIndicator column="classification" /></th>
              <th onClick={() => toggleSort('menuPrice')}>Price<SortIndicator column="menuPrice" /></th>
              <th onClick={() => toggleSort('foodCost')}>Cost<SortIndicator column="foodCost" /></th>
              <th onClick={() => toggleSort('contributionMargin')}>Margin<SortIndicator column="contributionMargin" /></th>
              <th onClick={() => toggleSort('foodCostPercent')}>Cost %<SortIndicator column="foodCostPercent" /></th>
              <th onClick={() => toggleSort('unitsSold')}>Units<SortIndicator column="unitsSold" /></th>
              <th onClick={() => toggleSort('salesMixPercent')}>Mix %<SortIndicator column="salesMixPercent" /></th>
              <th onClick={() => toggleSort('totalProfit')}>Profit<SortIndicator column="totalProfit" /></th>
              <th>Action</th>
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
                <td>{formatCurrency(item.menuPrice)}</td>
                <td>{formatCurrency(item.foodCost)}</td>
                <td className="font-medium">{formatCurrency(item.contributionMargin)}</td>
                <td className={item.foodCostPercent > 35 ? 'text-red-400' : item.foodCostPercent < 25 ? 'text-green-400' : ''}>
                  {formatPercent(item.foodCostPercent)}
                </td>
                <td>{item.unitsSold}</td>
                <td>{formatPercent(item.salesMixPercent)}</td>
                <td className="font-medium" style={{ color: CLASSIFICATION_COLORS[item.classification] }}>
                  {formatCurrency(item.totalProfit)}
                </td>
                <td className="text-xs text-steel max-w-[200px]">{item.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSorted.length === 0 && (
        <p className="text-center text-steel py-8 text-sm">No items match the current filters.</p>
      )}
    </div>
  )
}
