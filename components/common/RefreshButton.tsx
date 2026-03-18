'use client'

import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { refreshHotList, refreshRSSCache } from '@/lib/actions/news'

interface RefreshButtonProps {
  scope?: 'router' | 'rss' | 'hotlist'
  sourceId?: string
}

export function RefreshButton({ scope = 'router', sourceId }: RefreshButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('news')

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        if (scope === 'rss') {
          await refreshRSSCache()
        } else if (scope === 'hotlist') {
          await refreshHotList(sourceId)
        }
      } catch (error) {
        console.error('Failed to refresh content:', error)
      } finally {
        router.refresh()
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isPending}
      className="gap-2"
    >
      <RotateCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? t('refreshing') : t('refresh')}
    </Button>
  )
}
