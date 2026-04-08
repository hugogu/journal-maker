import { db } from '../../../db'
import { accounts, systemAccounts, accountingSystems } from '../../../db/schema'
import { successResponse, AppError } from '../../../utils/error'
import { eq, and, inArray } from 'drizzle-orm'
import { defineEventHandler, getMethod, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'

// Schema for import account data
const importAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  direction: z.enum(['debit', 'credit', 'both']),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  systems: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    if (method !== 'POST') {
      throw new AppError(405, 'Method not allowed')
    }

    const body = await readBody(event)
    const { accounts: importAccounts } = body

    if (!Array.isArray(importAccounts) || importAccounts.length === 0) {
      throw new AppError(400, '无效的导入数据')
    }

    // Get all existing accounts for this company
    const existingAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, companyId),
    })

    const existingAccountsMap = new Map(existingAccounts.map(a => [a.code, a]))

    // Get all available systems for this company (handle if table doesn't exist)
    let availableSystems: any[] = []
    try {
      availableSystems = await db.query.accountingSystems.findMany({
        where: eq(accountingSystems.companyId, companyId),
      })
    } catch (e) {
      console.warn('Could not fetch accounting systems:', e)
    }

    const systemsMap = new Map(availableSystems.map(s => [s.name, s]))

    // Analyze conflicts
    const result = {
      new: [] as any[],
      conflicts: [] as any[],
      invalid: [] as any[],
    }

    for (let i = 0; i < importAccounts.length; i++) {
      const rawAccount = importAccounts[i]

      try {
        const validatedAccount = importAccountSchema.parse(rawAccount)

        const existing = existingAccountsMap.get(validatedAccount.code)

        if (existing) {
          // Check for conflicts
          const conflicts: string[] = []

          if (existing.name !== validatedAccount.name) {
            conflicts.push('name')
          }
          if (existing.type !== validatedAccount.type) {
            conflicts.push('type')
          }
          if (existing.direction !== validatedAccount.direction) {
            conflicts.push('direction')
          }
          if ((existing.description || '') !== (validatedAccount.description || '')) {
            conflicts.push('description')
          }
          if (existing.isActive !== validatedAccount.isActive) {
            conflicts.push('isActive')
          }

          // Parse systems from import
          const importSystemNames = validatedAccount.systems
            ? validatedAccount.systems.split(',').map(s => s.trim()).filter(Boolean)
            : []

          // Check if any systems don't exist
          const invalidSystems = importSystemNames.filter(name => !systemsMap.has(name))

          result.conflicts.push({
            index: i,
            code: validatedAccount.code,
            importData: validatedAccount,
            existingData: {
              code: existing.code,
              name: existing.name,
              type: existing.type,
              direction: existing.direction,
              description: existing.description || '',
              isActive: existing.isActive,
            },
            differences: conflicts,
            invalidSystems: invalidSystems.length > 0 ? invalidSystems : undefined,
            existingId: existing.id,
          })
        } else {
          // Check if systems exist
          const importSystemNames = validatedAccount.systems
            ? validatedAccount.systems.split(',').map(s => s.trim()).filter(Boolean)
            : []
          const invalidSystems = importSystemNames.filter(name => !systemsMap.has(name))

          result.new.push({
            index: i,
            code: validatedAccount.code,
            data: validatedAccount,
            invalidSystems: invalidSystems.length > 0 ? invalidSystems : undefined,
          })
        }
      } catch (error) {
        result.invalid.push({
          index: i,
          data: rawAccount,
          error: error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : '数据格式错误',
        })
      }
    }

    return successResponse({
      preview: result,
      summary: {
        total: importAccounts.length,
        new: result.new.length,
        conflicts: result.conflicts.length,
        invalid: result.invalid.length,
      },
      availableSystems: availableSystems.map(s => ({ id: s.id, name: s.name })),
    })
  } catch (error) {
    if (error instanceof AppError) {
      setResponseStatus(event, error.statusCode)
      return { error: error.message }
    }
    console.error('Import preview error:', error)
    setResponseStatus(event, 500)
    return { error: '预览导入失败' }
  }
})
