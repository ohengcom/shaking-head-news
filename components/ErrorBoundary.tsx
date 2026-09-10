'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const router = useRouter()
  const t = useTranslations('common')

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
          <h2 className="text-2xl font-bold tracking-tight">{t('error')}</h2>
          <p className="text-muted-foreground">{error.message || t('unknownError')}</p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">
              {t('errorId')}: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            {t('retry')}
          </Button>
          <Button onClick={() => router.push('/')} variant="outline">
            {t('backToHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}
