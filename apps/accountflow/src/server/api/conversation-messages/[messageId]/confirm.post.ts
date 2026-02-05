import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { confirmMessage } from '~/server/db/queries/conversations'

export default defineEventHandler(async (event) => {
  try {
    const messageId = parseInt(getRouterParam(event, 'messageId')!)
    const body = await readBody(event)
    const scenarioId = body.scenarioId

    console.log('Confirm API - messageId:', messageId, 'scenarioId:', scenarioId, 'body:', body)

    if (!messageId || !scenarioId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid message ID or scenario ID'
      })
    }

    const result = await confirmMessage(messageId, scenarioId)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Failed to confirm message:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to confirm message'
    })
  }
})
