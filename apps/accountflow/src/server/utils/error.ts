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

export function handleError(error: unknown): { statusCode: number; body: { success: false; error: string; code?: string } } {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: error.message,
        code: error.code,
      },
    }
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'Validation error: ' + error.errors.map(e => e.message).join(', '),
        code: 'VALIDATION_ERROR',
      },
    }
  }

  console.error('Unexpected error:', error)
  return {
    statusCode: 500,
    body: {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  }
}

export function successResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  }
}
