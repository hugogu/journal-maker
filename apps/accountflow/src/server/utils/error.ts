import { ZodError } from 'zod'
import { createError } from 'h3'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown) {
  const actualError = error
  
  console.error('=== SERVER ERROR ===')
  console.error('Timestamp:', new Date().toISOString())
  console.error('Error type:', actualError?.constructor?.name || typeof actualError)
  console.error('Error message:', actualError instanceof Error ? actualError.message : String(actualError))

  if (actualError instanceof Error && actualError.stack) {
    console.error('Stack trace:')
    console.error(actualError.stack)
  }

  console.error('=== END ERROR ===')

  if (actualError instanceof AppError) {
    throw createError({
      statusCode: actualError.statusCode,
      statusMessage: actualError.message,
      data: {
        success: false,
        error: actualError.message,
        code: actualError.code,
      },
    })
  }

  if (actualError instanceof ZodError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: {
        success: false,
        error: 'Validation error: ' + actualError.issues.map((e: any) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
        errors: actualError.issues,
      },
    })
  }

  throw createError({
    statusCode: 500,
    statusMessage: actualError instanceof Error ? actualError.message : 'Internal server error',
    data: {
      success: false,
      error: actualError instanceof Error ? actualError.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  })
}

export function successResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  }
}