import {
  getDefaultProject,
  loadProject,
  saveProject,
  addItem,
  updateItem,
  deleteItem,
  clearAllItems,
  setBenchmarkMethod,
  setEmailUnlocked,
  exportProjectJSON,
  importProjectJSON,
} from '../lib/storage'
import { ProjectData } from '../lib/types'

const STORAGE_KEY = 'grumpy-chef-menu-engineering'

function makeProject(overrides: Partial<ProjectData> = {}): ProjectData {
  return {
    items: [],
    periodLabel: 'Last 30 days',
    benchmarkMethod: 'average',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    emailUnlocked: false,
    ...overrides,
  }
}

function makeItem(overrides: Partial<{ id: string; name: string; category: string; menuPrice: number; foodCost: number; unitsSold: number; periodDays: number }> = {}) {
  return {
    id: 'item-1',
    name: 'Test Item',
    category: 'Mains',
    menuPrice: 30,
    foodCost: 10,
    unitsSold: 100,
    periodDays: 30,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('getDefaultProject', () => {
  it('returns a project with empty items', () => {
    const project = getDefaultProject()
    expect(project.items).toEqual([])
    expect(project.benchmarkMethod).toBe('average')
    expect(project.emailUnlocked).toBe(false)
  })

  it('sets createdAt and updatedAt timestamps', () => {
    const project = getDefaultProject()
    expect(project.createdAt).toBeDefined()
    expect(project.updatedAt).toBeDefined()
  })
})

describe('loadProject', () => {
  it('returns default project when nothing in storage', () => {
    const project = loadProject()
    expect(project.items).toEqual([])
    expect(project.benchmarkMethod).toBe('average')
  })

  it('returns stored project data', () => {
    const stored = makeProject({ benchmarkMethod: 'seventyPercent', emailUnlocked: true })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const project = loadProject()
    expect(project.benchmarkMethod).toBe('seventyPercent')
    expect(project.emailUnlocked).toBe(true)
  })

  it('returns default project when storage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{broken json')
    const project = loadProject()
    expect(project.items).toEqual([])
  })
})

describe('saveProject', () => {
  it('saves project to localStorage', () => {
    const project = makeProject()
    saveProject(project)

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.benchmarkMethod).toBe('average')
  })

  it('updates the updatedAt timestamp', () => {
    const project = makeProject({ updatedAt: '2020-01-01T00:00:00.000Z' })
    saveProject(project)

    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw!)
    expect(parsed.updatedAt).not.toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('addItem', () => {
  it('adds an item to the project', () => {
    const project = makeProject()
    const item = makeItem()
    const updated = addItem(project, item)

    expect(updated.items).toHaveLength(1)
    expect(updated.items[0].name).toBe('Test Item')
  })

  it('preserves existing items', () => {
    const project = makeProject({
      items: [makeItem({ id: 'existing', name: 'Existing' })],
    })
    const updated = addItem(project, makeItem({ id: 'new', name: 'New Item' }))

    expect(updated.items).toHaveLength(2)
    expect(updated.items[0].name).toBe('Existing')
    expect(updated.items[1].name).toBe('New Item')
  })

  it('saves to localStorage', () => {
    const project = makeProject()
    addItem(project, makeItem())

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
  })
})

describe('updateItem', () => {
  it('updates an existing item', () => {
    const project = makeProject({
      items: [makeItem({ id: 'item-1', menuPrice: 30 })],
    })
    const updated = updateItem(project, 'item-1', { menuPrice: 35 })

    expect(updated.items[0].menuPrice).toBe(35)
  })

  it('does not modify other items', () => {
    const project = makeProject({
      items: [
        makeItem({ id: 'item-1', name: 'First' }),
        makeItem({ id: 'item-2', name: 'Second' }),
      ],
    })
    const updated = updateItem(project, 'item-1', { name: 'Updated First' })

    expect(updated.items[0].name).toBe('Updated First')
    expect(updated.items[1].name).toBe('Second')
  })

  it('does nothing if id not found', () => {
    const project = makeProject({
      items: [makeItem({ id: 'item-1' })],
    })
    const updated = updateItem(project, 'nonexistent', { name: 'Ghost' })

    expect(updated.items).toHaveLength(1)
    expect(updated.items[0].name).toBe('Test Item')
  })
})

describe('deleteItem', () => {
  it('removes the item by id', () => {
    const project = makeProject({
      items: [makeItem({ id: 'item-1' }), makeItem({ id: 'item-2' })],
    })
    const updated = deleteItem(project, 'item-1')

    expect(updated.items).toHaveLength(1)
    expect(updated.items[0].id).toBe('item-2')
  })

  it('returns empty items when deleting the last item', () => {
    const project = makeProject({
      items: [makeItem({ id: 'item-1' })],
    })
    const updated = deleteItem(project, 'item-1')

    expect(updated.items).toHaveLength(0)
  })
})

describe('clearAllItems', () => {
  it('removes all items', () => {
    const project = makeProject({
      items: [makeItem({ id: '1' }), makeItem({ id: '2' }), makeItem({ id: '3' })],
    })
    const updated = clearAllItems(project)

    expect(updated.items).toEqual([])
  })

  it('preserves other project settings', () => {
    const project = makeProject({
      items: [makeItem()],
      benchmarkMethod: 'seventyPercent',
      emailUnlocked: true,
    })
    const updated = clearAllItems(project)

    expect(updated.benchmarkMethod).toBe('seventyPercent')
    expect(updated.emailUnlocked).toBe(true)
  })
})

describe('setBenchmarkMethod', () => {
  it('changes to seventyPercent', () => {
    const project = makeProject({ benchmarkMethod: 'average' })
    const updated = setBenchmarkMethod(project, 'seventyPercent')

    expect(updated.benchmarkMethod).toBe('seventyPercent')
  })

  it('changes to average', () => {
    const project = makeProject({ benchmarkMethod: 'seventyPercent' })
    const updated = setBenchmarkMethod(project, 'average')

    expect(updated.benchmarkMethod).toBe('average')
  })
})

describe('setEmailUnlocked', () => {
  it('sets emailUnlocked to true', () => {
    const project = makeProject({ emailUnlocked: false })
    const updated = setEmailUnlocked(project)

    expect(updated.emailUnlocked).toBe(true)
  })
})

describe('exportProjectJSON', () => {
  it('returns valid JSON string', () => {
    const project = makeProject({ items: [makeItem()] })
    const json = exportProjectJSON(project)

    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('contains all project data', () => {
    const project = makeProject({ benchmarkMethod: 'seventyPercent', items: [makeItem()] })
    const json = exportProjectJSON(project)
    const parsed = JSON.parse(json)

    expect(parsed.benchmarkMethod).toBe('seventyPercent')
    expect(parsed.items).toHaveLength(1)
  })
})

describe('importProjectJSON', () => {
  it('parses valid project JSON', () => {
    const project = makeProject({ items: [makeItem()] })
    const json = JSON.stringify(project)
    const result = importProjectJSON(json)

    expect(result).not.toBeNull()
    expect(result!.items).toHaveLength(1)
  })

  it('returns null for invalid JSON', () => {
    expect(importProjectJSON('{broken')).toBeNull()
  })

  it('returns null when items is not an array', () => {
    expect(importProjectJSON('{"items": "not-array"}')).toBeNull()
  })

  it('saves imported project to localStorage', () => {
    const project = makeProject({ items: [makeItem()] })
    importProjectJSON(JSON.stringify(project))

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
  })
})
