# Error Handling Guide

This guide explains the error handling system implemented in the application.

## Overview

The application uses a unified error handling approach with:

- Custom error classes for different error types
- Consistent error logging
- User-friendly error messages
- Error boundaries for React components
- Validation error handling with Zod

## Error Classes

### APIError

Base error class for all API-related errors.

```typescript
throw new APIError('Something went wrong', 500, 'ERROR_CODE')
```

### AuthError

For authentication and authorization errors.

```typescript
throw new AuthError('Please sign in to continue')
```

### ValidationError

For data validation errors, typically from Zod schemas.

```typescript
throw new ValidationError('Invalid input', { field: 'error message' })
```

### NotFoundError

For resource not found errors.

```typescript
throw new NotFoundError('User not found')
```

### RateLimitError

For rate limiting errors.

```typescript
throw new RateLimitError('Too many requests')
```

## Using Error Handlers in Server Actions

### Basic Error Handling

```typescript
'use server'

import { logError, AuthError } from '@/lib/utils/error-handler'

export async function myAction() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in')
    }

    // Your logic here

    return { success: true }
  } catch (error) {
    logError(error, {
      action: 'myAction',
      // Additional context
    })
    throw error
  }
}
```

### Safe Server Action Wrapper

For actions that should return errors instead of throwing:

```typescript
import { safeServerAction } from '@/lib/utils/error-handler'

export async function myAction() {
  return safeServerAction(async () => {
    // Your logic here
    return { data: 'result' }
  })
}

// Usage in component:
const { data, error, statusCode } = await myAction()
```

### Validation with Zod

```typescript
import { validateOrThrow } from '@/lib/utils/error-handler'
import { MySchema } from '@/types/my-types'

export async function myAction(data: unknown) {
  try {
    // Validates and throws ValidationError if invalid
    const validated = validateOrThrow(MySchema, data)

    // Use validated data
    return validated
  } catch (error) {
    logError(error, { action: 'myAction' })
    throw error
  }
}
```

### Form Validation

```typescript
import { getFormErrors } from '@/lib/utils/error-handler'
import { MyFormSchema } from '@/types/my-types'

export async function submitForm(formData: FormData) {
  const data = Object.fromEntries(formData)

  // Get validation errors
  const errors = getFormErrors(MyFormSchema, data)

  if (errors) {
    return { success: false, errors }
  }

  // Process valid data
  return { success: true }
}
```

## Error Boundaries

### Root Error Boundary

The application has error boundaries at multiple levels:

1. **Root level** (`app/error.tsx`) - Catches all unhandled errors
2. **Route group level** (`app/(main)/error.tsx`, `app/(auth)/error.tsx`) - Catches errors in specific route groups

### Using Error Boundaries

Error boundaries automatically catch errors in React components:

```typescript
// This error will be caught by the nearest error boundary
export default function MyComponent() {
  if (someCondition) {
    throw new Error('Something went wrong')
  }

  return <div>Content</div>
}
```

### Custom Error Display

The `ErrorBoundary` component provides:

- User-friendly error messages
- Retry functionality
- Navigation back to home
- Error logging to runtime logs

## Error Pages

### 404 Not Found

The `app/not-found.tsx` page is displayed when:

- A route doesn't exist
- `notFound()` is called in a component

```typescript
import { notFound } from 'next/navigation'

export default async function Page({ params }) {
  const data = await fetchData(params.id)

  if (!data) {
    notFound() // Shows 404 page
  }

  return <div>{data.content}</div>
}
```

## Error Logging

All errors are logged with context for debugging:

```typescript
import { logError } from '@/lib/utils/error-handler'

try {
  // Your code
} catch (error) {
  logError(error, {
    action: 'actionName',
    userId: user.id,
    additionalContext: 'value',
  })
  throw error
}
```

## Retry Logic

For transient errors, use the retry helper:

```typescript
import { retryWithBackoff } from '@/lib/utils/error-handler'

const result = await retryWithBackoff(
  async () => {
    return await fetch('https://api.example.com/data')
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  }
)
```

Note: Retry logic automatically skips retrying for:

- AuthError
- ValidationError
- NotFoundError

## Best Practices

1. **Always log errors with context**

   ```typescript
   logError(error, { action: 'myAction', userId, itemId })
   ```

2. **Use specific error types**

   ```typescript
   // Good
   throw new AuthError('Please sign in')

   // Avoid
   throw new Error('Unauthorized')
   ```

3. **Validate user input**

   ```typescript
   const validated = validateOrThrow(MySchema, userInput)
   ```

4. **Return user-friendly messages**

   ```typescript
   catch (error) {
     return {
       success: false,
       error: formatErrorMessage(error) // User-friendly message
     }
   }
   ```

5. **Don't expose sensitive information**

   ```typescript
   // Good
   throw new APIError('Failed to process request')

   // Avoid
   throw new APIError(`Database error: ${dbError.message}`)
   ```

6. **Use error boundaries for UI errors**
   - Let React error boundaries catch rendering errors
   - Don't try-catch in every component

7. **Handle async errors properly**

   ```typescript
   // Good
   try {
     await myAsyncFunction()
   } catch (error) {
     logError(error)
     throw error
   }

   // Avoid unhandled promise rejections
   myAsyncFunction() // Missing await and error handling
   ```

## Testing Error Handling

### Testing Server Actions

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myAction } from './my-action'

describe('myAction', () => {
  it('should throw AuthError when not authenticated', async () => {
    vi.mock('@/lib/auth', () => ({
      auth: vi.fn(() => Promise.resolve(null)),
    }))

    await expect(myAction()).rejects.toThrow('Please sign in')
  })

  it('should handle validation errors', async () => {
    const result = await myAction({ invalid: 'data' })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

### Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

it('should display error message', () => {
  const error = new Error('Test error')
  const reset = vi.fn()

  render(<ErrorBoundary error={error} reset={reset} />)

  expect(screen.getByText('出错了')).toBeInTheDocument()
  expect(screen.getByText('Test error')).toBeInTheDocument()
})
```

## Troubleshooting

### Error not being caught

1. Check if error boundary is in the right place
2. Ensure error is thrown during render, not in event handlers
3. For event handlers, use try-catch explicitly

### Validation errors not showing

1. Verify Zod schema is correct
2. Check if `getFormErrors` is being called
3. Ensure error messages are displayed in UI

### Errors not logged

1. Check console for error output
2. Verify `logError` is being called
3. Check runtime logs in your deployment platform

## Summary

The error handling system provides:

- ✅ Consistent error handling across the application
- ✅ User-friendly error messages
- ✅ Comprehensive error logging
- ✅ Type-safe validation with Zod
- ✅ Automatic retry for transient errors
- ✅ Error boundaries for React components
- ✅ Custom error pages (404, 500)
- ✅ Integration-ready structured logging

For questions or issues, refer to the implementation in `lib/utils/error-handler.ts`.
