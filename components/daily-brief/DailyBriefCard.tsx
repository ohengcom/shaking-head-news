import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExternalLink, Share2, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DailyNewsItem } from '@/lib/api/daily-news'

interface DailyBriefCardProps {
  data: DailyNewsItem | null
}

export function DailyBriefCard({ data }: DailyBriefCardProps) {
  const t = useTranslations('dailyBrief')

  if (!data) return null

  // const handleSearch = (term: string) => {
  //   // For Member tier later: window.open(`https://www.google.com/search?q=${term}`, '_blank');
  // };

  return (
    <Card className="highlight-qa-card border-l-primary/50 flex h-full flex-col border-l-4 transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="from-primary to-primary/60 flex items-center gap-2 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
              <Calendar className="text-primary h-5 w-5" />
              {t('title')}
            </CardTitle>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {data.date} {data.day_of_week} · {data.lunar_date}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary h-8 w-8 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-2">
        <ScrollArea className="h-[400px] pr-4">
          <ul className="space-y-4">
            {data.news.map((item, index) => (
              <li key={index} className="group cursor-default text-sm leading-relaxed">
                <div className="flex gap-3">
                  <span className="text-primary/40 mt-[2px] w-4 shrink-0 text-right font-mono font-bold">
                    {index + 1}.
                  </span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {item}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>

      <CardFooter className="bg-muted/20 flex-col items-start gap-4 border-t pt-4">
        <blockquote className="border-primary text-muted-foreground w-full border-l-2 pl-4 text-xs italic">
          "{data.tip}"
        </blockquote>

        <div className="flex w-full justify-end">
          <Button
            variant="outline"
            size="sm"
            className="group hover:border-primary/50 gap-1 text-xs"
            asChild
          >
            <a href={data.link} target="_blank" rel="noopener noreferrer">
              {t('readOriginal')}{' '}
              <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
