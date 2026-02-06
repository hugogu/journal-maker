import { db } from '../../db'
import { companyProfile } from '../../db/schema'
import { createCompanySchema, updateCompanySchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'

// GET /api/companies
export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)

    if (method === 'GET') {
      const allCompanies = await db.query.companyProfile.findMany()
      return successResponse(allCompanies)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = createCompanySchema.parse(body)
      
      const [company] = await db.insert(companyProfile).values(data).returning()
      return successResponse(company)
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
