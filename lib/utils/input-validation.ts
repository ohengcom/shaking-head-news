/**
 * Input Validation and Sanitization Utilities
 *
 * Provides functions to validate and sanitize user input to prevent
 * XSS attacks, SQL injection, and other security vulnerabilities.
 */

import { z } from 'zod'

/**
 * Sanitize string input by removing potentially dangerous characters
 *
 * @param input - Raw string input
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    maxLength?: number
    allowHtml?: boolean
    allowNewlines?: boolean
  } = {}
): string {
  const { maxLength = 1000, allowHtml = false, allowNewlines = true } = options

  let sanitized = input.trim()

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }

  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ')
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Limit length
  sanitized = sanitized.slice(0, maxLength)

  return sanitized
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim()

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = trimmed.toLowerCase()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return ''
    }
  }

  // Validate URL format
  try {
    const parsed = new URL(trimmed)
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return ''
    }
    return trimmed
  } catch {
    // If not a valid URL, check if it's a relative path
    if (trimmed.startsWith('/')) {
      return trimmed
    }
    return ''
  }
}

/**
 * Sanitize email address
 *
 * @param email - Email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return ''
  }

  return trimmed
}

/**
 * Sanitize HTML content (for rich text editors)
 * Removes dangerous HTML tags and attributes
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 *
 * Note: For production use, consider using a library like DOMPurify
 * This is a basic implementation that removes common XSS vectors
 */
export function sanitizeHtml(html: string): string {
  let sanitized = html

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')

  return sanitized
}

/**
 * Validate and sanitize with Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and sanitized data
 * @throws Error if validation fails
 */
export function validateAndSanitize<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
    throw new Error(`Validation failed: ${errors.join(', ')}`)
  }

  return result.data
}

/**
 * Get validation errors as a record
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Record of field errors or null if valid
 */
export function getValidationErrors<T extends z.ZodType>(
  schema: T,
  data: unknown
): Record<string, string> | null {
  const result = schema.safeParse(data)

  if (result.success) {
    return null
  }

  const errors: Record<string, string> = {}

  result.error.issues.forEach((error) => {
    const path = error.path.join('.')
    errors[path] = error.message
  })

  return errors
}

/**
 * Sanitize object by applying sanitization to all string values
 *
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxLength?: number
    allowHtml?: boolean
  } = {}
): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item, options)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>, options)
            : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char)
}

/**
 * Validate file upload
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    }
  }

  // Check file extension
  const match = file.name.toLowerCase().match(/\.[^.]+$/)
  const extension = match ? match[0] : undefined
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    }
  }

  return { valid: true }
}

/**
 * Sanitize filename for safe storage
 *
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators
  let sanitized = filename.replace(/[/\\]/g, '')

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '')

  // Remove special characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Limit length
  sanitized = sanitized.slice(0, 255)

  return sanitized
}

/**
 * Check if string contains SQL injection patterns
 *
 * @deprecated This function is not used — the project uses Redis (not SQL).
 * Retained for reference; remove if not needed.
 * @param input - Input to check
 * @returns True if suspicious patterns detected
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    // eslint-disable-next-line no-useless-escape
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /('|")\s*(OR|AND)\s*('|")/i,
  ]

  return sqlPatterns.some((pattern) => pattern.test(input))
}

/**
 * Check if string contains XSS patterns
 *
 * @param input - Input to check
 * @returns True if suspicious patterns detected
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ]

  return xssPatterns.some((pattern) => pattern.test(input))
}
