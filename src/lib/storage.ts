import { MenuItemInput, BenchmarkMethod, ProjectData } from './types'

const STORAGE_KEY = 'grumpy-chef-menu-engineering'

export function getDefaultProject(): ProjectData {
  return {
    items: [],
    periodLabel: 'Last 30 days',
    benchmarkMethod: 'average',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailUnlocked: false,
  }
}

export function loadProject(): ProjectData {
  if (typeof window === 'undefined') return getDefaultProject()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultProject()
    const data = JSON.parse(raw) as ProjectData
    return data
  } catch {
    return getDefaultProject()
  }
}

export function saveProject(data: ProjectData): void {
  if (typeof window === 'undefined') return

  try {
    const updated = { ...data, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save project:', e)
  }
}

export function addItem(
  project: ProjectData,
  item: MenuItemInput & { id: string }
): ProjectData {
  const updated = {
    ...project,
    items: [...project.items, item],
  }
  saveProject(updated)
  return updated
}

export function updateItem(
  project: ProjectData,
  id: string,
  updates: Partial<MenuItemInput>
): ProjectData {
  const updated = {
    ...project,
    items: project.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ),
  }
  saveProject(updated)
  return updated
}

export function deleteItem(project: ProjectData, id: string): ProjectData {
  const updated = {
    ...project,
    items: project.items.filter(item => item.id !== id),
  }
  saveProject(updated)
  return updated
}

export function clearAllItems(project: ProjectData): ProjectData {
  const updated = { ...project, items: [] }
  saveProject(updated)
  return updated
}

export function setBenchmarkMethod(
  project: ProjectData,
  method: BenchmarkMethod
): ProjectData {
  const updated = { ...project, benchmarkMethod: method }
  saveProject(updated)
  return updated
}

export function setEmailUnlocked(project: ProjectData): ProjectData {
  const updated = { ...project, emailUnlocked: true }
  saveProject(updated)
  return updated
}

export function exportProjectJSON(project: ProjectData): string {
  return JSON.stringify(project, null, 2)
}

export function importProjectJSON(json: string): ProjectData | null {
  try {
    const data = JSON.parse(json) as ProjectData
    if (!data.items || !Array.isArray(data.items)) return null
    saveProject(data)
    return data
  } catch {
    return null
  }
}
