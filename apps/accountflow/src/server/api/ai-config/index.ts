import { defineEventHandler, createError } from 'h3'

// DEPRECATED: Use /api/admin/ai-providers instead
export default defineEventHandler(async () => {
  throw createError({
    statusCode: 410,
    statusMessage: 'AI Config API deprecated. Use /api/admin/ai-providers instead.'
  })
})
