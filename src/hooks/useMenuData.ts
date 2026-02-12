'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  MenuItemInput,
  MenuItem,
  BenchmarkMethod,
  ProjectData,
  ClassificationSummary,
  MatrixBenchmarks,
} from '@/lib/types'
import {
  classifyAllItems,
  getClassificationSummaries,
  calculateBenchmarks,
  calculateItemMetrics,
} from '@/lib/calculations'
import {
  loadProject,
  saveProject,
  getDefaultProject,
} from '@/lib/storage'

export function useMenuData() {
  const [project, setProject] = useState<ProjectData>(getDefaultProject)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = loadProject()
    setProject(saved)
    setLoaded(true)
  }, [])

  const persist = useCallback((updated: ProjectData) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() }
    setProject(withTimestamp)
    saveProject(withTimestamp)
  }, [])

  const addItem = useCallback((input: MenuItemInput) => {
    const item = { ...input, id: uuidv4() }
    setProject(prev => {
      const updated = { ...prev, items: [...prev.items, item] }
      saveProject(updated)
      return updated
    })
  }, [])

  const addItems = useCallback((inputs: (MenuItemInput & { id: string })[]) => {
    setProject(prev => {
      const updated = { ...prev, items: [...prev.items, ...inputs] }
      saveProject(updated)
      return updated
    })
  }, [])

  const replaceItems = useCallback((inputs: (MenuItemInput & { id: string })[]) => {
    setProject(prev => {
      const updated = { ...prev, items: inputs }
      saveProject(updated)
      return updated
    })
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<MenuItemInput>) => {
    setProject(prev => {
      const updated = {
        ...prev,
        items: prev.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }
      saveProject(updated)
      return updated
    })
  }, [])

  const deleteItem = useCallback((id: string) => {
    setProject(prev => {
      const updated = { ...prev, items: prev.items.filter(item => item.id !== id) }
      saveProject(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setProject(prev => {
      const updated = { ...prev, items: [] }
      saveProject(updated)
      return updated
    })
  }, [])

  const setBenchmarkMethod = useCallback((method: BenchmarkMethod) => {
    setProject(prev => {
      const updated = { ...prev, benchmarkMethod: method }
      saveProject(updated)
      return updated
    })
  }, [])

  const setEmailUnlocked = useCallback(() => {
    setProject(prev => {
      const updated = { ...prev, emailUnlocked: true }
      saveProject(updated)
      return updated
    })
  }, [])

  const loadProjectData = useCallback((data: ProjectData) => {
    persist(data)
  }, [persist])

  // Derived data
  const classifiedItems: MenuItem[] = classifyAllItems(project.items, project.benchmarkMethod)
  const summaries: ClassificationSummary[] = getClassificationSummaries(classifiedItems)

  const totalUnitsSold = project.items.reduce((sum, i) => sum + i.unitsSold, 0)
  const itemsWithMetrics = project.items.map(item =>
    calculateItemMetrics(item, totalUnitsSold)
  )
  const benchmarks: MatrixBenchmarks = calculateBenchmarks(itemsWithMetrics)

  const categories = Array.from(new Set(project.items.map(i => i.category))).sort()

  return {
    project,
    loaded,
    classifiedItems,
    summaries,
    benchmarks,
    categories,
    addItem,
    addItems,
    replaceItems,
    updateItem,
    deleteItem,
    clearAll,
    setBenchmarkMethod,
    setEmailUnlocked,
    loadProjectData,
  }
}
