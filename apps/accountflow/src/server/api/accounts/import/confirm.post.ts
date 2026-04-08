import { db } from '../../../db'
import { accounts, systemAccounts, accountingSystems } from '../../../db/schema'
import { successResponse, AppError } from '../../../utils/error'
import { eq, and } from 'drizzle-orm'
import { defineEventHandler, getMethod, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    if (method !== 'POST') {
      throw new AppError(405, 'Method not allowed')
    }

    const body = await readBody(event)
    const { new: newAccounts, updates } = body

    const results = {
      created: [] as any[],
      updated: [] as any[],
      errors: [] as any[],
    }

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

    // Process new accounts
    if (Array.isArray(newAccounts)) {
      for (const item of newAccounts) {
        try {
          const { data } = item

          // Check for duplicate code
          const existing = await db.query.accounts.findFirst({
            where: and(
              eq(accounts.companyId, companyId),
              eq(accounts.code, data.code)
            ),
          })

          if (existing) {
            results.errors.push({
              code: data.code,
              error: '科目代码已存在',
            })
            continue
          }

          // Create account
          const [account] = await db.insert(accounts).values({
            companyId,
            code: data.code,
            name: data.name,
            type: data.type,
            direction: data.direction,
            description: data.description,
            isActive: data.isActive ?? true,
          }).returning()

          // Assign to systems (handle if table doesn't exist)
          if (data.systems) {
            try {
              const systemNames = data.systems.split(',').map((s: string) => s.trim()).filter(Boolean)
              const validSystemIds = systemNames
                .map((name: string) => systemsMap.get(name)?.id)
                .filter(Boolean) as number[]

              if (validSystemIds.length > 0) {
                const assignments = validSystemIds.map((systemId: number) => ({
                  systemId,
                  accountId: account.id,
                }))
                await db.insert(systemAccounts).values(assignments).onConflictDoNothing()
              }
            } catch (e) {
              console.warn('Could not assign systems:', e)
            }
          }

          results.created.push({
            id: account.id,
            code: account.code,
            name: account.name,
          })
        } catch (error) {
          results.errors.push({
            code: item.data?.code,
            error: error instanceof Error ? error.message : '创建失败',
          })
        }
      }
    }

    // Process updates
    if (Array.isArray(updates)) {
      for (const item of updates) {
        try {
          const { existingId, data } = item

          // Update account
          const [updated] = await db.update(accounts)
            .set({
              name: data.name,
              type: data.type,
              direction: data.direction,
              description: data.description,
              isActive: data.isActive ?? true,
              updatedAt: new Date(),
            })
            .where(eq(accounts.id, existingId))
            .returning()

          // Update system assignments (handle if table doesn't exist)
          if (data.systems !== undefined) {
            try {
              // Remove existing assignments
              await db.delete(systemAccounts).where(eq(systemAccounts.accountId, existingId))

              // Add new assignments
              if (data.systems) {
                const systemNames = data.systems.split(',').map((s: string) => s.trim()).filter(Boolean)
                const validSystemIds = systemNames
                  .map((name: string) => systemsMap.get(name)?.id)
                  .filter(Boolean) as number[]

                if (validSystemIds.length > 0) {
                  const assignments = validSystemIds.map((systemId: number) => ({
                    systemId,
                    accountId: existingId,
                  }))
                  await db.insert(systemAccounts).values(assignments).onConflictDoNothing()
                }
              }
            } catch (e) {
              console.warn('Could not update system assignments:', e)
            }
          }

          results.updated.push({
            id: updated.id,
            code: updated.code,
            name: updated.name,
          })
        } catch (error) {
          results.errors.push({
            code: item.data?.code,
            error: error instanceof Error ? error.message : '更新失败',
          })
        }
      }
    }

    return successResponse({
      results,
      summary: {
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      setResponseStatus(event, error.statusCode)
      return { error: error.message }
    }
    console.error('Import confirm error:', error)
    setResponseStatus(event, 500)
    return { error: '导入失败' }
  }
})
