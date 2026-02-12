'use client'

import { useState } from 'react'
import { MenuItemInput, CATEGORIES } from '@/lib/types'

interface Props {
  onAdd: (item: MenuItemInput) => void
  periodDays: number
}

const EMPTY_FORM: MenuItemInput = {
  name: '',
  category: 'Mains',
  menuPrice: 0,
  foodCost: 0,
  unitsSold: 0,
  periodDays: 30,
}

export default function ManualEntryForm({ onAdd, periodDays }: Props) {
  const [form, setForm] = useState<MenuItemInput>({ ...EMPTY_FORM, periodDays })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customCategory, setCustomCategory] = useState('')
  const [useCustomCategory, setUseCustomCategory] = useState(false)

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (form.menuPrice <= 0) errs.menuPrice = 'Price must be > 0'
    if (form.foodCost <= 0) errs.foodCost = 'Cost must be > 0'
    if (form.foodCost >= form.menuPrice) errs.foodCost = 'Cost must be less than price'
    if (form.unitsSold < 0) errs.unitsSold = 'Units must be >= 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const category = useCustomCategory ? customCategory.trim() || 'Uncategorized' : form.category
    onAdd({ ...form, category, periodDays })
    setForm({ ...EMPTY_FORM, periodDays })
    setCustomCategory('')
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="font-display text-lg font-bold uppercase mb-4">Add Menu Item</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="input-label">Item Name</label>
          <input
            type="text"
            className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g. Ribeye Steak"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="input-label">Category</label>
          {useCustomCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Custom category"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
              />
              <button
                type="button"
                className="text-xs text-gold hover:text-white"
                onClick={() => setUseCustomCategory(false)}
              >
                List
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                className="select-field flex-1"
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs text-gold hover:text-white"
                onClick={() => setUseCustomCategory(true)}
              >
                Custom
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="input-label">Menu Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={`input-field ${errors.menuPrice ? 'border-red-500' : ''}`}
            placeholder="0.00"
            value={form.menuPrice || ''}
            onChange={e => setForm(prev => ({ ...prev, menuPrice: parseFloat(e.target.value) || 0 }))}
          />
          {errors.menuPrice && <p className="text-red-400 text-xs mt-1">{errors.menuPrice}</p>}
        </div>

        <div>
          <label className="input-label">Food Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={`input-field ${errors.foodCost ? 'border-red-500' : ''}`}
            placeholder="0.00"
            value={form.foodCost || ''}
            onChange={e => setForm(prev => ({ ...prev, foodCost: parseFloat(e.target.value) || 0 }))}
          />
          {errors.foodCost && <p className="text-red-400 text-xs mt-1">{errors.foodCost}</p>}
        </div>

        <div>
          <label className="input-label">Units Sold</label>
          <input
            type="number"
            min="0"
            className={`input-field ${errors.unitsSold ? 'border-red-500' : ''}`}
            placeholder="0"
            value={form.unitsSold || ''}
            onChange={e => setForm(prev => ({ ...prev, unitsSold: parseInt(e.target.value) || 0 }))}
          />
          {errors.unitsSold && <p className="text-red-400 text-xs mt-1">{errors.unitsSold}</p>}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="submit" className="btn-gold">
          + Add Item
        </button>
      </div>
    </form>
  )
}
