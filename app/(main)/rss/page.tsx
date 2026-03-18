import { Suspense } from 'react'
import { getRSSSources, getDefaultRSSSources } from '@/lib/actions/rss'
import { RSSSourceList } from '@/components/rss/RSSSourceList'
import { AddRSSSourceDialog } from '@/components/rss/AddRSSSourceDialog'
import { ExportOPMLButton } from '@/components/rss/ExportOPMLButton'
import { ImportOPMLButton } from '@/components/rss/ImportOPMLButton'
import { Card, CardContent } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'
import { getUserTier } from '@/lib/tier-server'
import { LockedFeature } from '@/components/tier/LockedFeature'
import { TierFeatureServer } from '@/components/tier/TierFeatureServer'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

export const maxDuration = 10

async function RSSContent() {
  const { tier, features } = await getUserTier()
  const t = await getTranslations('rss')
  const tTier = await getTranslations('tier')

  const isGuest = tier === 'guest'
  const isPro = tier === 'pro'

  // Guest 用户显示默认源（只读）
  if (isGuest) {
    const defaultSources = await getDefaultRSSSources()
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
            <p className="text-muted-foreground">{t('addSourceDescription')}</p>
          </div>
        </div>

        {/* 登录提示 */}
        <LockedFeature
          featureName="customRssEnabled"
          requiredTier="member"
          description={tTier('loginToUnlockDescription')}
        />

        {/* 默认源列表（只读） */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">默认新闻源</h3>
          {defaultSources.map((source) => (
            <Card key={source.id} className="opacity-75">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{source.name}</h4>
                    <p className="text-muted-foreground text-sm">
                      {source.description || source.url}
                    </p>
                  </div>
                  <Badge variant="outline">{source.language === 'zh' ? '中文' : 'English'}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Member/Pro 用户可以管理自定义源
  const sources = await getRSSSources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('addSourceDescription')}</p>
        </div>
        <div className="flex gap-2">
          {/* OPML 功能仅 Pro 可用 */}
          <TierFeatureServer feature="opmlImportExportEnabled">
            <ImportOPMLButton />
            <ExportOPMLButton />
          </TierFeatureServer>

          {/* Pro 提示 */}
          {!isPro && features.customRssEnabled && (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Sparkles className="h-3 w-3" />
              OPML 需要 Pro
            </Badge>
          )}

          <AddRSSSourceDialog />
        </div>
      </div>

      <RSSSourceList initialSources={sources} />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="bg-muted h-6 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="bg-muted h-6 w-16 animate-pulse rounded" />
                  <div className="bg-muted h-6 w-16 animate-pulse rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function RSSPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <RSSContent />
      </Suspense>
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'RSS 源管理 - 摇头看新闻',
  description: '管理您的 RSS 订阅源，自定义新闻来源',
}
