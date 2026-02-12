import { ZodError } from 'zod'

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

export function handleError(error: unknown): { statusCode: number; body: { success: false; error: string; code?: string; details?: any } } {
  // Log full error details with stack trace
  console.error('=== SERVER ERROR ===')
  console.error('Timestamp:', new Date().toISOString())
  console.error('Error type:', error?.constructor?.name || typeof error)
  console.error('Error message:', error instanceof Error ? error.message : String(error))
  
  // Log stack trace if available
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:')
    console.error(error.stack)
  }
  
  // Log additional error properties
  if (error && typeof error === 'object') {
    console.error('Error properties:', Object.getOwnPropertyNames(error))
    try {
      console.error('Error details:', JSON.stringify(error, null, 2))
    } catch (e) {
      console.error('Failed to serialize error:', e)
    }
  }
  console.error('=== END ERROR ===')

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: error.message,
        code: error.code,
        details: {
          type: 'AppError',
          statusCode: error.statusCode,
          stack: error.stack
        }
      },
    }
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'Validation error: ' + error.issues.map((e: any) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
        details: {
          type: 'ZodError',
          errors: error.issues,
          stack: error.stack
        }
      },
    }
  }

  // For unexpected errors, include full details in development
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  return {
    statusCode: 500,
    body: {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: isDevelopment ? {
        type: error?.constructor?.name || 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        raw: error
      } : undefined
    },
  }
}

export function successResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  }
}
