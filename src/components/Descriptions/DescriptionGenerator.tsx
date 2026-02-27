'use client'

import { useState } from 'react'
import {
  MenuItem,
  DescriptionInput,
  COOKING_METHODS,
  FLAVOR_PROFILES,
  DIETARY_TAGS,
} from '@/lib/types'
import { generateDescriptionWithPosition } from '@/lib/descriptions'
import { useToast } from '@/components/Toast'

interface Props {
  items: MenuItem[]
  emailUnlocked: boolean
  onUnlock: () => void
}

export default function DescriptionGenerator({ items, emailUnlocked, onUnlock }: Props) {
  const { showToast } = useToast()
  const [showGate, setShowGate] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [gateError, setGateError] = useState('')

  const [useCustomItem, setUseCustomItem] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [input, setInput] = useState<DescriptionInput>({
    cookingMethod: '',
    origin: '',
    keyIngredient: '',
    flavorProfile: [],
    dietaryTags: [],
  })
  const [generatedDesc, setGeneratedDesc] = useState<string>('')
  const [menuPosition, setMenuPosition] = useState<string>('')
  const [pairing, setPairing] = useState<string | null>(null)

  const prioritizedItems = [...items].sort((a, b) => {
    const order = { puzzle: 0, star: 1, plowhorse: 2, dog: 3 }
    return order[a.classification] - order[b.classification]
  })

  const allStars = items.filter(i => i.classification === 'star')

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setGateError('Please enter a valid email')
      return
    }

    setSubmitting(true)
    setGateError('')

    try {
      const apiKey = process.env.NEXT_PUBLIC_CONVERTKIT_API_KEY
      const formId = process.env.NEXT_PUBLIC_CONVERTKIT_FORM_ID

      if (apiKey && formId) {
        await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            email: email.trim(),
            tags: [16452628],
          }),
        })
      }

      onUnlock()
      setShowGate(false)
    } catch {
      onUnlock()
      setShowGate(false)
    } finally {
      setSubmitting(false)
    }
  }

  function handleGenerate() {
    if (!input.cookingMethod || !input.keyIngredient) return

    let item: MenuItem
    if (useCustomItem) {
      if (!customItemName.trim()) return
      item = {
        id: 'custom',
        name: customItemName.trim(),
        category: 'Custom',
        menuPrice: 0,
        foodCost: 0,
        unitsSold: 0,
        periodDays: 30,
        contributionMargin: 0,
        foodCostPercent: 0,
        totalProfit: 0,
        salesMixPercent: 0,
        classification: 'puzzle',
        recommendedAction: 'New item — optimize description for visibility',
      }
    } else {
      const found = items.find(i => i.id === selectedItemId)
      if (!found) return
      item = found
    }

    const result = generateDescriptionWithPosition(input, item, allStars)
    setGeneratedDesc(result.description)
    setMenuPosition(result.menuPosition)
    setPairing(result.pairingSuggestion)
  }

  function handleRegenerate() {
    handleGenerate()
  }

  function toggleFlavor(flavor: string) {
    setInput(prev => ({
      ...prev,
      flavorProfile: prev.flavorProfile.includes(flavor)
        ? prev.flavorProfile.filter(f => f !== flavor)
        : [...prev.flavorProfile, flavor],
    }))
  }

  function toggleDietary(tag: string) {
    setInput(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag],
    }))
  }

  if (!emailUnlocked) {
    return (
      <div className="card">
        <h3 className="font-display text-lg font-bold uppercase mb-4">Menu Description Generator</h3>
        {!showGate ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✍️</div>
            <p className="text-white font-medium mb-2">
              Generate optimized menu descriptions for your Star and Puzzle items
            </p>
            <p className="text-steel text-sm mb-6">
              Template-based descriptions using sensory language, cooking methods, and origin stories
            </p>
            <button className="btn-gold" onClick={() => setShowGate(true)}>
              Unlock Description Generator
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto py-8">
            <h4 className="text-white font-semibold text-center mb-2">
              Unlock Menu Description Generator
            </h4>
            <p className="text-steel text-sm text-center mb-6">
              Enter your email to access. No spam. Just menu engineering tools.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {gateError && <p className="text-red-400 text-xs">{gateError}</p>}
              <button
                type="submit"
                className="btn-gold w-full"
                disabled={submitting}
              >
                {submitting ? 'Unlocking...' : 'Unlock Free'}
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-display text-lg font-bold uppercase mb-4">Menu Description Generator</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="input-label mb-0">
                {useCustomItem ? 'Custom Item Name' : 'Select Item'}
              </label>
              <button
                className="text-xs text-gold hover:text-white transition-colors"
                onClick={() => {
                  setUseCustomItem(!useCustomItem)
                  setSelectedItemId('')
                  setCustomItemName('')
                  setGeneratedDesc('')
                }}
              >
                {useCustomItem ? 'Select existing' : 'Custom item'}
              </button>
            </div>
            {useCustomItem ? (
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Truffle Mushroom Risotto"
                value={customItemName}
                onChange={e => setCustomItemName(e.target.value)}
              />
            ) : (
              <select
                className="select-field"
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
              >
                <option value="">— Choose an item —</option>
                {prioritizedItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.classification === 'puzzle' ? '🧩 ' : item.classification === 'star' ? '⭐ ' : ''}
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="input-label">Cooking Method</label>
            <select
              className="select-field"
              value={input.cookingMethod}
              onChange={e => setInput(prev => ({ ...prev, cookingMethod: e.target.value }))}
            >
              <option value="">— Select —</option>
              {COOKING_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Key Ingredient</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. prime ribeye, Atlantic salmon"
              value={input.keyIngredient}
              onChange={e => setInput(prev => ({ ...prev, keyIngredient: e.target.value }))}
            />
          </div>

          <div>
            <label className="input-label">Origin/Source (optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. locally sourced, imported Italian"
              value={input.origin}
              onChange={e => setInput(prev => ({ ...prev, origin: e.target.value }))}
            />
          </div>

          <div>
            <label className="input-label">Flavor Profile</label>
            <div className="flex flex-wrap gap-2">
              {FLAVOR_PROFILES.map(f => (
                <button
                  key={f}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    input.flavorProfile.includes(f)
                      ? 'bg-gold/20 border-gold text-gold'
                      : 'border-navy-border text-steel hover:text-white hover:border-white/30'
                  }`}
                  onClick={() => toggleFlavor(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map(t => (
                <button
                  key={t}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    input.dietaryTags.includes(t)
                      ? 'bg-blue/20 border-blue text-blue'
                      : 'border-navy-border text-steel hover:text-white hover:border-white/30'
                  }`}
                  onClick={() => toggleDietary(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-gold w-full"
            disabled={
              (!useCustomItem && !selectedItemId) ||
              (useCustomItem && !customItemName.trim()) ||
              !input.cookingMethod ||
              !input.keyIngredient
            }
            onClick={handleGenerate}
          >
            Generate Description
          </button>
        </div>

        <div>
          {generatedDesc ? (
            <div className="space-y-4">
              <div className="p-6 rounded-lg border border-gold/20 bg-gold/5">
                <div className="text-xs text-gold uppercase mb-2">Generated Description</div>
                <p className="text-white text-lg leading-relaxed italic">{generatedDesc}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    className="text-xs text-gold hover:text-white transition-colors"
                    onClick={() => { navigator.clipboard.writeText(generatedDesc); showToast('Copied to clipboard') }}
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    className="text-xs text-steel hover:text-white transition-colors"
                    onClick={handleRegenerate}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-navy-border bg-navy-light">
                <div className="text-xs text-steel uppercase mb-1">Menu Position</div>
                <p className="text-white text-sm">{menuPosition}</p>
              </div>

              {pairing && (
                <div className="p-4 rounded-lg border border-navy-border bg-navy-light">
                  <div className="text-xs text-steel uppercase mb-1">Pairing Suggestion</div>
                  <p className="text-white text-sm">{pairing}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-steel text-sm">
              Select an item and fill in the details to generate a description
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
