import { db } from '../../db'
import { companyProfile } from '../../db/schema'
import { updateCompanySchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) throw new AppError(400, 'Invalid company ID')

    const method = getMethod(event)

    if (method === 'GET') {
      const company = await db.query.companyProfile.findFirst({
        where: eq(companyProfile.id, id)
      })
      if (!company) throw new AppError(404, 'Company not found')
      return successResponse(company)
    }

    if (method === 'PUT') {
      const body = await readBody(event)
      const data = updateCompanySchema.parse(body)
      
      const [company] = await db
        .update(companyProfile)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companyProfile.id, id))
        .returning()
      
      if (!company) throw new AppError(404, 'Company not found')
      return successResponse(company)
    }

    if (method === 'DELETE') {
      const [company] = await db
        .delete(companyProfile)
        .where(eq(companyProfile.id, id))
        .returning()
      
      if (!company) throw new AppError(404, 'Company not found')
      return successResponse({ deleted: true })
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
