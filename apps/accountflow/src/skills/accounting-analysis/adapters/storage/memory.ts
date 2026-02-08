/**
 * In-memory storage adapter
 * Useful for testing and stateless scenarios
 */

import { BaseStorageAdapter, type StorageContext } from './base'
import type { AnalysisResult } from '../../core/types'

/**
 * In-memory storage implementation
 * Note: Data is not persisted and will be lost when the process restarts
 */
export class MemoryStorageAdapter extends BaseStorageAdapter {
  private store: Map<string, AnalysisResult> = new Map()
  private contextIndex: Map<string, Set<string>> = new Map()

  async save(result: AnalysisResult, context?: StorageContext): Promise<AnalysisResult> {
    this.validateResult(result)

    const id = result.id || this.generateId()
    const savedResult: AnalysisResult = {
      ...result,
      id,
      analyzedAt: result.analyzedAt || new Date(),
    }

    this.store.set(id, savedResult)

    // Index by context if provided
    if (context) {
      const contextKey = this.getContextKey(context)
      if (!this.contextIndex.has(contextKey)) {
        this.contextIndex.set(contextKey, new Set())
      }
      this.contextIndex.get(contextKey)!.add(id)
    }

    return savedResult
  }

  async load(id: string, context?: StorageContext): Promise<AnalysisResult | null> {
    const result = this.store.get(id)

    if (!result) {
      return null
    }

    // If context is provided, verify it matches
    if (context && !this.matchesContext(id, context)) {
      return null
    }

    return result
  }

  async delete(id: string, context?: StorageContext): Promise<void> {
    // If context is provided, verify it matches
    if (context && !this.matchesContext(id, context)) {
      throw new Error('Analysis not found in the specified context')
    }

    this.store.delete(id)

    // Remove from context index
    for (const [contextKey, ids] of this.contextIndex.entries()) {
      ids.delete(id)
      if (ids.size === 0) {
        this.contextIndex.delete(contextKey)
      }
    }
  }

  async list(context?: StorageContext): Promise<AnalysisResult[]> {
    if (!context) {
      return Array.from(this.store.values())
    }

    const contextKey = this.getContextKey(context)
    const ids = this.contextIndex.get(contextKey)

    if (!ids) {
      return []
    }

    return Array.from(ids)
      .map(id => this.store.get(id))
      .filter((result): result is AnalysisResult => result !== undefined)
  }

  async update(id: string, updates: Partial<AnalysisResult>, context?: StorageContext): Promise<AnalysisResult> {
    const existing = await this.load(id, context)

    if (!existing) {
      throw new Error('Analysis not found')
    }

    const updated: AnalysisResult = {
      ...existing,
      ...updates,
      id, // Preserve ID
    }

    this.validateResult(updated)
    this.store.set(id, updated)

    return updated
  }

  async confirm(id: string, context?: StorageContext): Promise<void> {
    await this.update(id, {
      metadata: {
        ...((await this.load(id, context))?.metadata || {}),
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      }
    }, context)
  }

  /**
   * Clear all stored data (useful for testing)
   */
  clear(): void {
    this.store.clear()
    this.contextIndex.clear()
  }

  /**
   * Get the number of stored analyses
   */
  size(): number {
    return this.store.size
  }

  private getContextKey(context: StorageContext): string {
    const parts: string[] = []
    if (context.userId) parts.push(`user:${context.userId}`)
    if (context.companyId) parts.push(`company:${context.companyId}`)
    if (context.scenarioId) parts.push(`scenario:${context.scenarioId}`)
    return parts.join('|') || 'default'
  }

  private matchesContext(id: string, context: StorageContext): boolean {
    const contextKey = this.getContextKey(context)
    const ids = this.contextIndex.get(contextKey)
    return ids ? ids.has(id) : false
  }
}
