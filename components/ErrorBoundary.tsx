'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { logError } from '@/lib/utils/error-handler'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error Boundary component for catching and displaying errors
 * Used by Next.js error.tsx files
 */
export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error with runtime context for debugging.
    logError(error, {
      digest: error.digest,
      component: 'ErrorBoundary',
    })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <AlertCircle className="text-destructive h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">出错了</h2>
          <p className="text-muted-foreground">{error.message || '发生了未知错误，请稍后重试'}</p>
          {error.digest && <p className="text-muted-foreground text-xs">错误ID: {error.digest}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            重试
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
