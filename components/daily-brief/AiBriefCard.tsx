import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, ExternalLink, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AiNewsItem } from '@/lib/api/daily-news'

interface AiBriefCardProps {
  data: AiNewsItem[] | null
}

export function AiBriefCard({ data }: AiBriefCardProps) {
  const t = useTranslations('dailyBrief')

  if (!data || data.length === 0) return null

  return (
    <Card className="flex h-full flex-col border-l-4 border-l-purple-500/50 transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-xl font-bold text-transparent">
          <Bot className="h-5 w-5 text-purple-500" />
          {t('aiTitle')}
          <Sparkles className="ml-auto h-4 w-4 animate-pulse text-yellow-500" />
        </CardTitle>
        <p className="text-muted-foreground mt-1 font-mono text-xs">{t('aiDescription')}</p>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-2">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {data.map((item, index) => (
              <div
                key={index}
                className="group border-border relative border-l pl-4 transition-colors hover:border-purple-500"
              >
                <h4 className="text-foreground/90 mb-1 text-sm leading-tight font-semibold transition-colors group-hover:text-purple-500">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="decoration-purple-500/30 underline-offset-2 hover:underline"
                  >
                    {item.title}
                  </a>
                </h4>
                {/* <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                  {item.description}
                </p> */}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground/60 bg-muted rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                    {item.source}
                  </span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
