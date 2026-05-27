import { db } from '../../../db'
import { accountingSystems, systemPreferences } from '../../../db/schema'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { eq, and } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readBody, getMethod } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const systemId = Number(getRouterParam(event, 'id'))
    const companyId = 1 // TODO: Get from session
    const method = getMethod(event)

    if (!systemId) throw new AppError(400, 'Invalid system ID')

    // Verify system exists and belongs to company
    const system = await db.query.accountingSystems.findFirst({
      where: and(
        eq(accountingSystems.id, systemId),
        eq(accountingSystems.companyId, companyId)
      ),
    })

    if (!system) {
      throw new AppError(404, '体系不存在')
    }

    // GET /api/systems/:id/preferences - Get all preferences
    if (method === 'GET') {
      const preferences = await db.query.systemPreferences.findMany({
        where: eq(systemPreferences.systemId, systemId),
      })

      // Convert to key-value object
      const preferencesObject = preferences.reduce((acc, pref) => {
        acc[pref.key] = pref.value
        return acc
      }, {} as Record<string, any>)

      return successResponse({
        systemId,
        preferences: preferencesObject,
      })
    }

    // PUT /api/systems/:id/preferences - Update preferences
    if (method === 'PUT') {
      const body = await readBody(event)
      const { preferences } = body

      if (!preferences || typeof preferences !== 'object') {
        throw new AppError(400, 'Preferences object is required')
      }

      const results = []

      // Update each preference
      for (const [key, value] of Object.entries(preferences)) {
        if (!key || key.length > 255) {
          throw new AppError(400, `Invalid preference key: ${key}`)
        }

        // Upsert preference
        const result = await db.insert(systemPreferences)
          .values({
            systemId,
            key,
            value,
          })
          .onConflictDoUpdate({
            target: [systemPreferences.systemId, systemPreferences.key],
            set: {
              value,
              updatedAt: new Date(),
            },
          })
          .returning()

        results.push(result[0])
      }

      // Return updated preferences
      const updatedPreferences = await db.query.systemPreferences.findMany({
        where: eq(systemPreferences.systemId, systemId),
      })

      const preferencesObject = updatedPreferences.reduce((acc, pref) => {
        acc[pref.key] = pref.value
        return acc
      }, {} as Record<string, any>)

      return successResponse({
        systemId,
        preferences: preferencesObject,
        updated: results.length,
      })
    }

    // DELETE /api/systems/:id/preferences - Delete specific preferences
    if (method === 'DELETE') {
      const body = await readBody(event)
      const { keys } = body

      if (!Array.isArray(keys) || keys.length === 0) {
        throw new AppError(400, 'Keys array is required')
      }

      // Delete preferences
      await db.delete(systemPreferences)
        .where(
          and(
            eq(systemPreferences.systemId, systemId),
            eq(systemPreferences.key, keys)
          )
        )

      // Return remaining preferences
      const remainingPreferences = await db.query.systemPreferences.findMany({
        where: eq(systemPreferences.systemId, systemId),
      })

      const preferencesObject = remainingPreferences.reduce((acc, pref) => {
        acc[pref.key] = pref.value
        return acc
      }, {} as Record<string, any>)

      return successResponse({
        systemId,
        preferences: preferencesObject,
        deleted: keys.length,
      })
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    handleError(error)
  }
})
