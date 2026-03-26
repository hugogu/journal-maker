import { db } from '../../db'
import { accountingSystems, systemAccounts, systemRules, analysisEntries } from '../../db/schema'
import { createSystemSchema, updateSystemSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq, and, like, sql, count } from 'drizzle-orm'
import { defineEventHandler, getMethod, readBody, getRouterParam, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    // GET /api/systems - List all systems
    if (method === 'GET' && !getRouterParam(event, 'id')) {
      const query = getQuery(event)
      
      let conditions = eq(accountingSystems.companyId, companyId)
      
      if (query.type) {
        conditions = and(conditions, eq(accountingSystems.type, query.type as string))
      }
      
      if (query.status) {
        conditions = and(conditions, eq(accountingSystems.status, query.status as string))
      }
      
      const allSystems = await db.query.accountingSystems.findMany({
        where: conditions,
        orderBy: accountingSystems.name,
      })
      
      return successResponse(allSystems)
    }

    // POST /api/systems - Create new system
    if (method === 'POST' && !getRouterParam(event, 'id')) {
      const body = await readBody(event)
      const data = createSystemSchema.parse(body)
      
      // Check for duplicate name (case-insensitive)
      const existing = await db.query.accountingSystems.findFirst({
        where: and(
          eq(accountingSystems.companyId, companyId),
          sql`LOWER(${accountingSystems.name}) = LOWER(${data.name})`
        )
      })
      
      if (existing) {
        throw new AppError(409, '体系名称已存在')
      }
      
      const [system] = await db.insert(accountingSystems).values({
        ...data,
        companyId,
        type: 'custom',
        status: 'active',
      }).returning()
      
      return successResponse(system)
    }

    const systemId = Number(getRouterParam(event, 'id'))
    if (!systemId) throw new AppError(400, 'Invalid system ID')

    // GET /api/systems/:id - Get system details
    if (method === 'GET') {
      const system = await db.query.accountingSystems.findFirst({
        where: and(
          eq(accountingSystems.id, systemId),
          eq(accountingSystems.companyId, companyId)
        ),
        with: {
          accounts: true,
          rules: true,
        }
      })
      
      if (!system) {
        throw new AppError(404, '体系不存在')
      }

      // Get counts
      const accountCount = await db.select({ count: count() })
        .from(systemAccounts)
        .where(eq(systemAccounts.systemId, systemId))
        .then(res => res[0].count)

      const ruleCount = await db.select({ count: count() })
        .from(systemRules)
        .where(eq(systemRules.systemId, systemId))
        .then(res => res[0].count)

      const analysisCount = await db.select({ count: count() })
        .from(analysisEntries)
        .where(eq(analysisEntries.systemId, systemId))
        .then(res => res[0].count)
      
      return successResponse({
        ...system,
        accountCount,
        ruleCount,
        analysisCount,
      })
    }

    // PATCH /api/systems/:id - Update system
    if (method === 'PATCH') {
      const system = await db.query.accountingSystems.findFirst({
        where: and(
          eq(accountingSystems.id, systemId),
          eq(accountingSystems.companyId, companyId)
        )
      })
      
      if (!system) {
        throw new AppError(404, '体系不存在')
      }

      // Built-in systems cannot be renamed
      if (system.type === 'builtin') {
        throw new AppError(403, '不能修改内置体系')
      }
      
      const body = await readBody(event)
      const data = updateSystemSchema.parse(body)
      
      // Check for duplicate name if renaming
      if (data.name && data.name !== system.name) {
        const existing = await db.query.accountingSystems.findFirst({
          where: and(
            eq(accountingSystems.companyId, companyId),
            sql`LOWER(${accountingSystems.name}) = LOWER(${data.name})`,
            sql`${accountingSystems.id} != ${systemId}`
          )
        })
        
        if (existing) {
          throw new AppError(409, '体系名称已存在')
        }
      }
      
      const [updated] = await db.update(accountingSystems)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(accountingSystems.id, systemId))
        .returning()
      
      return successResponse(updated)
    }

    // DELETE /api/systems/:id - Delete system
    if (method === 'DELETE') {
      const system = await db.query.accountingSystems.findFirst({
        where: and(
          eq(accountingSystems.id, systemId),
          eq(accountingSystems.companyId, companyId)
        )
      })
      
      if (!system) {
        throw new AppError(404, '体系不存在')
      }

      // Built-in systems cannot be deleted
      if (system.type === 'builtin') {
        throw new AppError(403, '不能删除内置体系')
      }

      // Check if system has analyses
      const analysisCount = await db.select({ count: count() })
        .from(analysisEntries)
        .where(eq(analysisEntries.systemId, systemId))
        .then(res => res[0].count)
      
      if (analysisCount > 0) {
        throw new AppError(403, '该体系已被用于分析，无法删除')
      }
      
      await db.delete(accountingSystems)
        .where(eq(accountingSystems.id, systemId))
      
      return successResponse({ success: true })
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    return handleError(event, error)
  }
})
