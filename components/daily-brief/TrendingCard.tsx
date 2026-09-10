'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Flame, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { TrendingItem } from '@/lib/api/trending'
import { getTrending } from '@/lib/actions/trending'
import { cn } from '@/lib/utils'

interface TrendingCardProps {
  initialData: TrendingItem[]
  initialSource?: string
  isMember?: boolean // Prop to control Guest/Member view
}

const SOURCES = [
  { id: 'douyin', label: '抖音' },
  { id: 'weibo', label: '微博' },
  { id: 'zhihu', label: '知乎' },
  { id: 'bilibili', label: 'B站' },
]

export function TrendingCard({
  initialData,
  initialSource = 'douyin',
  isMember = false,
}: TrendingCardProps) {
  const [source, setSource] = useState(initialSource)
  const [data, setData] = useState<TrendingItem[]>(initialData)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('dailyBrief')

  const handleSourceChange = (newSource: string) => {
    if (newSource === source) return
    setSource(newSource)
    startTransition(async () => {
      const newData = await getTrending(newSource)
      setData(newData)
    })
  }

  // Guest View: Show top 3 only + Overlay
  const displayData = isMember ? data : data.slice(0, 3)

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-l-4 border-l-orange-500/50 transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-xl font-bold text-transparent">
            <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
            {t('trending')}
          </CardTitle>
          <div className="flex gap-1">
            {SOURCES.map((s) => (
              <Button
                key={s.id}
                variant={source === s.id ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-6 px-2 text-xs',
                  source === s.id &&
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                )}
                onClick={() => handleSourceChange(s.id)}
                disabled={isPending}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 pt-2">
        {isPending ? (
          <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : null}

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {displayData.map((item, index) => (
              <div
                key={index}
                className="group border-border/40 hover:bg-muted/30 -mx-2 flex items-start justify-between gap-4 rounded border-b px-2 pb-2 transition-colors last:border-0"
              >
                <div className="flex gap-3 overflow-hidden">
                  <span
                    className={cn(
                      'mt-[2px] w-4 shrink-0 text-center font-mono text-sm font-bold',
                      index < 3 ? 'text-orange-500' : 'text-muted-foreground/50'
                    )}
                  >
                    {index + 1}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'truncate text-sm font-medium transition-colors hover:text-orange-600',
                      !isMember && 'pointer-events-none' // Disable links for guests
                    )}
                  >
                    {item.title}
                  </a>
                </div>
                {item.hot && (
                  <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                    {item.hot}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Guest Overlay */}
        {!isMember && (
          <div className="from-background via-background/90 absolute inset-x-0 bottom-0 flex h-32 flex-col items-center justify-end bg-gradient-to-t to-transparent pb-8">
            <p className="text-muted-foreground mb-3 text-sm font-medium">
              {t('trendingLoginPrompt')}
            </p>
            <Button
              size="sm"
              variant="default"
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-red-700"
              asChild
            >
              <Link href="/login">{t('loginNow')}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
