'use client'

import { useState, useEffect } from 'react'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Close edit modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditingId(null)
        setEditValues({})
      }
    }
    if (editingId) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingId])

  if (items.length === 0) {
    return (
      <div className="card text-center py-10">
        <div className="text-steel text-sm">
          No menu items yet. Add one manually or upload a CSV to get started.
        </div>
      </div>
    )
  }

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

  function handleDelete(id: string) {
    onDelete(id)
    setDeletingId(null)
  }

  return (
    <>
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
                <th className="text-right">Price</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Units</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td className="text-steel">{item.category}</td>
                  <td className="num">${item.menuPrice.toFixed(2)}</td>
                  <td className="num">${item.foodCost.toFixed(2)}</td>
                  <td className="num">{item.unitsSold}</td>
                  <td className="text-right">
                    {deletingId === item.id ? (
                      <span className="inline-flex items-center gap-2">
                        <button
                          className="text-red-400 text-xs hover:text-red-300 transition-colors"
                          onClick={() => handleDelete(item.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="text-steel text-xs hover:text-white transition-colors"
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3">
                        <button
                          className="text-gold text-xs hover:text-white transition-colors"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-steel text-xs hover:text-red-400 transition-colors"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => setDeletingId(item.id)}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold uppercase mb-4">
              Edit Item
            </h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">Item Name</label>
                <input
                  className="input-field"
                  value={editValues.name || ''}
                  onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Category</label>
                <input
                  className="input-field"
                  value={editValues.category || ''}
                  onChange={e => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Menu Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={editValues.menuPrice || ''}
                    onChange={e => setEditValues(prev => ({ ...prev, menuPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="input-label">Food Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={editValues.foodCost || ''}
                    onChange={e => setEditValues(prev => ({ ...prev, foodCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="input-label">Units Sold</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editValues.unitsSold || ''}
                    onChange={e => setEditValues(prev => ({ ...prev, unitsSold: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              {editValues.menuPrice && editValues.foodCost && editValues.foodCost >= editValues.menuPrice && (
                <p className="text-red-400 text-xs">Food cost must be less than menu price.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-outline text-xs" onClick={cancelEdit}>
                Cancel
              </button>
              <button className="btn-gold text-xs" onClick={() => saveEdit(editingId)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
