'use client'

import { v4 as uuidv4 } from 'uuid'
import { MenuItemInput } from '@/lib/types'

function generateSampleItems(): (MenuItemInput & { id: string })[] {
  return [
    { id: uuidv4(), name: 'Caesar Salad', category: 'Starters', menuPrice: 16.00, foodCost: 4.20, unitsSold: 340, periodDays: 30 },
    { id: uuidv4(), name: 'French Onion Soup', category: 'Starters', menuPrice: 14.00, foodCost: 3.80, unitsSold: 280, periodDays: 30 },
    { id: uuidv4(), name: 'Calamari', category: 'Starters', menuPrice: 18.00, foodCost: 6.50, unitsSold: 190, periodDays: 30 },
    { id: uuidv4(), name: 'Ribeye Steak', category: 'Mains', menuPrice: 48.00, foodCost: 18.50, unitsSold: 180, periodDays: 30 },
    { id: uuidv4(), name: 'Grilled Salmon', category: 'Mains', menuPrice: 34.00, foodCost: 12.00, unitsSold: 260, periodDays: 30 },
    { id: uuidv4(), name: 'Chicken Parmesan', category: 'Mains', menuPrice: 26.00, foodCost: 7.80, unitsSold: 420, periodDays: 30 },
    { id: uuidv4(), name: 'Mushroom Risotto', category: 'Mains', menuPrice: 24.00, foodCost: 5.60, unitsSold: 150, periodDays: 30 },
    { id: uuidv4(), name: 'Fish & Chips', category: 'Mains', menuPrice: 22.00, foodCost: 8.40, unitsSold: 310, periodDays: 30 },
    { id: uuidv4(), name: 'Chocolate Lava Cake', category: 'Desserts', menuPrice: 14.00, foodCost: 3.20, unitsSold: 200, periodDays: 30 },
    { id: uuidv4(), name: 'Tiramisu', category: 'Desserts', menuPrice: 12.00, foodCost: 2.80, unitsSold: 170, periodDays: 30 },
    { id: uuidv4(), name: 'Cheesecake', category: 'Desserts', menuPrice: 13.00, foodCost: 3.50, unitsSold: 220, periodDays: 30 },
    { id: uuidv4(), name: 'House Fries', category: 'Sides', menuPrice: 8.00, foodCost: 1.60, unitsSold: 480, periodDays: 30 },
  ]
}

interface Props {
  onLoad: (items: (MenuItemInput & { id: string })[]) => void
  hasItems: boolean
}

export default function SampleDataLoader({ onLoad, hasItems }: Props) {
  function handleLoad() {
    if (hasItems) {
      const confirmed = window.confirm(
        'This will replace your current data with 12 sample menu items. Continue?'
      )
      if (!confirmed) return
    }
    onLoad(generateSampleItems())
  }

  if (!hasItems) {
    return (
      <div className="card text-center py-8">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="font-display text-xl font-bold uppercase mb-2">
          No Menu Items Yet
        </h3>
        <p className="text-steel text-sm mb-6 max-w-md mx-auto">
          Add items manually, upload a CSV, or load sample data to explore the tool.
        </p>
        <button
          className="btn-outline"
          onClick={handleLoad}
        >
          Load Sample Data (12 items)
        </button>
      </div>
    )
  }

  return (
    <button
      className="text-xs text-steel hover:text-gold transition-colors"
      onClick={handleLoad}
    >
      Load sample data
    </button>
  )
}
