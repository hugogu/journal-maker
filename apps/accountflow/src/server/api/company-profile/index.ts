import { defineEventHandler, createError, readBody } from 'h3'
import { getCompanyProfile, upsertCompanyProfile } from '../../db/queries/company-profile'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  businessModel: z.string().max(1000).optional().nullable(),
  industry: z.string().max(50).optional().nullable(),
  accountingPreference: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

// GET /api/company-profile
export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    try {
      const profile = await getCompanyProfile()
      return { profile }
    } catch (error) {
      console.error('Error fetching company profile:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch company profile'
      })
    }
  }

  if (method === 'POST' || method === 'PUT') {
    try {
      const body = await readBody(event)
      const data = profileSchema.parse(body)
      
      const profile = await upsertCompanyProfile(data)
      return { profile }
    } catch (error) {
      console.error('Error saving company profile:', error)
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
        })
      }
      throw createError({
        statusCode: 500,
        message: 'Failed to save company profile'
      })
    }
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  })
})
