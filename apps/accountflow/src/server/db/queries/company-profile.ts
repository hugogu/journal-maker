import { db } from '../index'
import { companyProfile } from '../schema'
import { eq } from 'drizzle-orm'
import type { CompanyProfile } from '../types'

// Get company profile (singleton)
export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const profile = await db.query.companyProfile.findFirst()
  return profile || null
}

// Create or update company profile
export async function upsertCompanyProfile(data: {
  name: string
  businessModel?: string | null
  industry?: string | null
  accountingPreference?: string | null
  notes?: string | null
}): Promise<CompanyProfile> {
  const existing = await db.query.companyProfile.findFirst()
  
  if (existing) {
    const [updated] = await db.update(companyProfile)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(companyProfile.id, existing.id))
      .returning()
    return updated
  } else {
    const [created] = await db.insert(companyProfile)
      .values({
        name: data.name,
        businessModel: data.businessModel || null,
        industry: data.industry || null,
        accountingPreference: data.accountingPreference || null,
        notes: data.notes || null
      })
      .returning()
    return created
  }
}

// Initialize default profile if none exists
export async function initializeDefaultProfile(): Promise<CompanyProfile> {
  const existing = await getCompanyProfile()
  if (existing) return existing
  
  return upsertCompanyProfile({
    name: '我的公司',
    businessModel: '',
    industry: '',
    accountingPreference: '',
    notes: ''
  })
}
