'use client'

import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { refreshHotList, refreshNews, refreshRSSCache } from '@/lib/actions/news'
import { useToast } from '@/hooks/use-toast'

interface RefreshButtonProps {
  scope?: 'router' | 'rss' | 'hotlist' | 'news'
  sourceId?: string
  language?: 'zh' | 'en'
  source?: string
}

export function RefreshButton({
  scope = 'router',
  sourceId,
  language,
  source,
}: RefreshButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('news')
  const { toast } = useToast()

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        if (scope === 'rss') {
          await refreshRSSCache()
        } else if (scope === 'hotlist') {
          await refreshHotList(sourceId)
        } else if (scope === 'news') {
          await refreshNews(language, source)
        }
      } catch (error) {
        toast({
          title: t('refreshFailed'),
          description:
            error instanceof Error && error.message ? error.message : t('refreshFailedDescription'),
          variant: 'destructive',
        })
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
