/**
 * Error handling utilities for the application
 * Provides consistent error handling across Server Actions and API routes
 */

import { z } from 'zod'

/**
 * Custom API Error class with status code and error code support
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Authentication Error
 */
export class AuthError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR')
    this.name = 'AuthError'
  }
}

/**
 * Validation Error
 */
export class ValidationError extends APIError {
  constructor(
    message: string = 'Validation failed',
    public errors?: Record<string, string>
  ) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

/**
 * Handle API errors and convert them to APIError instances
 */
export async function handleAPIError(error: unknown): Promise<never> {
  // If already an APIError, re-throw it
  if (error instanceof APIError) {
    throw error
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const errors: Record<string, string> = {}
    error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    throw new ValidationError('Validation failed', errors)
  }

  // Handle standard errors
  if (error instanceof Error) {
    throw new APIError(error.message, 500)
  }

  // Handle unknown errors
  throw new APIError('An unknown error occurred', 500)
}

/**
 * Safe wrapper for Server Actions
 * Returns a result object with data or error instead of throwing
 */
export async function safeServerAction<T>(
  action: () => Promise<T>
): Promise<{ data?: T; error?: string; statusCode?: number }> {
  try {
    const data = await action()
    return { data }
  } catch (error) {
    console.error('Server action error:', error)

    if (error instanceof APIError) {
      return {
        error: error.message,
        statusCode: error.statusCode,
      }
    }

    if (error instanceof z.ZodError) {
      return {
        error: 'Validation failed: ' + error.issues.map((i) => i.message).join(', '),
        statusCode: 400,
      }
    }

    if (error instanceof Error) {
      return {
        error: error.message,
        statusCode: 500,
      }
    }

    return {
      error: 'An unexpected error occurred',
      statusCode: 500,
    }
  }
}

/**
 * Get form validation errors from Zod schema
 */
export function getFormErrors<T extends z.ZodType>(
  schema: T,
  data: unknown
): Record<string, string> | null {
  const result = schema.safeParse(data)

  if (result.success) {
    return null
  }

  const errors: Record<string, string> = {}

  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })

  return errors
}

/**
 * Validate data with Zod schema and throw ValidationError if invalid
 */
export function validateOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    throw new ValidationError('Validation failed', errors)
  }

  return result.data
}

/**
 * Log error with structured context.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context can contain any type of data for error logging
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    context,
  }

  console.error('Application error:', errorInfo)
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  if (error instanceof z.ZodError) {
    return 'Please check your input and try again'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again later.'
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error: unknown, type: string): boolean {
  return error instanceof Error && error.name === type
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffFactor = 2 } = options

  let lastError: unknown
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on certain errors
      if (
        error instanceof AuthError ||
        error instanceof ValidationError ||
        error instanceof NotFoundError
      ) {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  throw lastError
}
