import type { NewsItem as NewsItemType } from '@/types/news'
import { NewsItem } from './NewsItem'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface NewsListProps {
  news: NewsItemType[]
  showLoginCTA?: boolean
}

export function NewsList({ news, showLoginCTA = false }: NewsListProps) {
  const t = useTranslations('news')

  if (!news || news.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('noNews')}</AlertTitle>
        <AlertDescription>{t('noNewsDescription')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      className="divide-border max-h-[600px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent divide-y overflow-y-auto pr-2"
      data-testid="news-list"
    >
      {news.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}

      {showLoginCTA && (
        <div className="py-6 text-center">
          <p className="text-muted-foreground mb-3 text-sm">{t('loginForMore')}</p>
          <Button asChild size="sm">
            <Link href="/login">{t('loginNow')}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
