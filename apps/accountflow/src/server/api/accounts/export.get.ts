import { db } from '../../db'
import { accounts, systemAccounts } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { defineEventHandler, getMethod, setResponseStatus, setHeader } from 'h3'

// CSV 转义函数
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// 生成 CSV
function generateCSV(data: any[]): string {
  const headers = ['code', 'name', 'type', 'direction', 'description', 'isActive', 'systems']
  const rows = data.map(item => [
    escapeCSV(item.code),
    escapeCSV(item.name),
    escapeCSV(item.type),
    escapeCSV(item.direction),
    escapeCSV(item.description || ''),
    escapeCSV(String(item.isActive)),
    escapeCSV(item.systems || ''),
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    if (method !== 'GET') {
      setResponseStatus(event, 405)
      return { error: 'Method not allowed' }
    }

    // Get all accounts for the company
    const accountsList = await db.query.accounts.findMany({
      where: eq(accounts.companyId, companyId),
      orderBy: accounts.code,
    })

    // Get all system assignments for these accounts (handle if table doesn't exist)
    const accountSystemsMap: Record<number, string[]> = {}
    try {
      const accountIds = accountsList.map(a => a.id)
      if (accountIds.length > 0) {
        const systemAssignments = await db.query.systemAccounts.findMany({
          where: (sa, { inArray }) => inArray(sa.accountId, accountIds),
          with: {
            system: true,
          },
        })

        // Group system assignments by accountId
        for (const assignment of systemAssignments) {
          if (!accountSystemsMap[assignment.accountId]) {
            accountSystemsMap[assignment.accountId] = []
          }
          if (assignment.system) {
            accountSystemsMap[assignment.accountId].push(assignment.system.name)
          }
        }
      }
    } catch (e) {
      // Table may not exist, continue without system data
      console.warn('Could not fetch system accounts:', e)
    }

    // Format export data
    const exportData = accountsList.map(account => ({
      code: account.code,
      name: account.name,
      type: account.type,
      direction: account.direction,
      description: account.description || '',
      isActive: account.isActive,
      systems: accountSystemsMap[account.id]?.join(',') || '',
    }))

    // Generate CSV
    const csv = generateCSV(exportData)
    
    // Set response headers for CSV download
    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="accounts-${new Date().toISOString().split('T')[0]}.csv"`)
    
    return csv
  } catch (error) {
    console.error('Export error:', error)
    setResponseStatus(event, 500)
    return { error: '导出失败' }
  }
})
