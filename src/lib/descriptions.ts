import { DescriptionInput, DescriptionOutput, MenuItem } from './types'

const TEMPLATES = [
  (d: DescriptionInput) => {
    const flavors = d.flavorProfile.slice(0, 2).join(' and ').toLowerCase()
    const tags = d.dietaryTags.length > 0 ? ` (${d.dietaryTags.join(', ')})` : ''
    return `${d.cookingMethod} ${d.keyIngredient} with ${flavors} notes${d.origin ? `, ${d.origin}` : ''}${tags}`
  },
  (d: DescriptionInput) => {
    const flavor = d.flavorProfile[0]?.toLowerCase() || 'savory'
    const tags = d.dietaryTags.length > 0 ? ` | ${d.dietaryTags.join(', ')}` : ''
    return `${d.origin ? d.origin + ' ' : ''}${d.keyIngredient}, ${d.cookingMethod.toLowerCase()} to perfection — ${flavor} and satisfying${tags}`
  },
  (d: DescriptionInput) => {
    const flavors = d.flavorProfile.slice(0, 3).join(', ').toLowerCase()
    const tags = d.dietaryTags.length > 0 ? `. ${d.dietaryTags.join(', ')}` : ''
    return `House ${d.cookingMethod.toLowerCase()} ${d.keyIngredient}. ${flavors.charAt(0).toUpperCase() + flavors.slice(1)}${d.origin ? `. ${d.origin}` : ''}${tags}`
  },
  (d: DescriptionInput) => {
    const flavor = d.flavorProfile[0]?.toLowerCase() || 'delicious'
    const secondary = d.flavorProfile[1]?.toLowerCase()
    const desc = secondary ? `${flavor}, ${secondary}` : flavor
    const tags = d.dietaryTags.length > 0 ? ` (${d.dietaryTags.join(', ')})` : ''
    return `${d.keyIngredient} — ${d.cookingMethod.toLowerCase()} with a ${desc} finish${d.origin ? `. Sourced ${d.origin.toLowerCase()}` : ''}${tags}`
  },
]

export function generateDescription(input: DescriptionInput): string {
  const templateIndex = Math.floor(Math.random() * TEMPLATES.length)
  return TEMPLATES[templateIndex](input)
}

export function generateDescriptionWithPosition(
  input: DescriptionInput,
  item: MenuItem,
  allStars: MenuItem[]
): DescriptionOutput {
  const description = generateDescription(input)

  const menuPosition = item.classification === 'star'
    ? 'Feature in top-right of section — add "Chef\'s Pick" badge'
    : item.classification === 'puzzle'
      ? 'Reposition to high-visibility spot — add "New" or "Try This" badge'
      : 'Standard menu position'

  let pairingSuggestion: string | null = null
  if (allStars.length > 0) {
    const differentCategory = allStars.find(s => s.category !== item.category)
    if (differentCategory) {
      pairingSuggestion = `Pairs well with ${differentCategory.name}`
    }
  }

  return { description, menuPosition, pairingSuggestion }
}
