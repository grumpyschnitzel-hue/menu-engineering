'use client'

import { useState } from 'react'
import { MenuItemInput } from '@/lib/types'

interface Props {
  items: (MenuItemInput & { id: string })[]
  onUpdate: (id: string, updates: Partial<MenuItemInput>) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export default function ItemList({ items, onUpdate, onDelete, onClearAll }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<MenuItemInput>>({})
  const [showConfirm, setShowConfirm] = useState(false)

  if (items.length === 0) return null

  function startEdit(item: MenuItemInput & { id: string }) {
    setEditingId(item.id)
    setEditValues({
      name: item.name,
      category: item.category,
      menuPrice: item.menuPrice,
      foodCost: item.foodCost,
      unitsSold: item.unitsSold,
    })
  }

  function saveEdit(id: string) {
    if (editValues.menuPrice && editValues.foodCost && editValues.foodCost >= editValues.menuPrice) {
      return
    }
    onUpdate(id, editValues)
    setEditingId(null)
    setEditValues({})
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold uppercase">
          Menu Items <span className="text-gold">({items.length})</span>
        </h3>
        {items.length > 0 && (
          showConfirm ? (
            <div className="flex gap-2 items-center">
              <span className="text-red-400 text-sm">Clear all items?</span>
              <button className="btn-danger text-xs" onClick={() => { onClearAll(); setShowConfirm(false) }}>
                Yes, Clear
              </button>
              <button className="btn-outline text-xs" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="text-sm text-steel hover:text-red-400 transition-colors" onClick={() => setShowConfirm(true)}>
              Clear All
            </button>
          )
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Units</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                {editingId === item.id ? (
                  <>
                    <td>
                      <input
                        className="input-field py-1 text-sm"
                        value={editValues.name || ''}
                        onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        className="input-field py-1 text-sm w-24"
                        value={editValues.category || ''}
                        onChange={e => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field py-1 text-sm w-20"
                        value={editValues.menuPrice || ''}
                        onChange={e => setEditValues(prev => ({ ...prev, menuPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field py-1 text-sm w-20"
                        value={editValues.foodCost || ''}
                        onChange={e => setEditValues(prev => ({ ...prev, foodCost: parseFloat(e.target.value) || 0 }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-field py-1 text-sm w-20"
                        value={editValues.unitsSold || ''}
                        onChange={e => setEditValues(prev => ({ ...prev, unitsSold: parseInt(e.target.value) || 0 }))}
                      />
                    </td>
                    <td className="text-right">
                      <button className="text-gold text-xs mr-2 hover:text-white" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="text-steel text-xs hover:text-white" onClick={cancelEdit}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-steel">{item.category}</td>
                    <td>${item.menuPrice.toFixed(2)}</td>
                    <td>${item.foodCost.toFixed(2)}</td>
                    <td>{item.unitsSold}</td>
                    <td className="text-right">
                      <button className="text-gold text-xs mr-3 hover:text-white" onClick={() => startEdit(item)}>Edit</button>
                      <button className="text-steel text-xs hover:text-red-400" onClick={() => onDelete(item.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
