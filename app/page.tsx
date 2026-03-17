import { Suspense } from 'react'
import { NewsDisplay } from '@/components/news/NewsDisplay'
import { getTranslations } from 'next-intl/server'
import { getAiNewsItems, getHotListNews, getNews, getUserCustomNews } from '@/lib/actions/news'
import { HOT_LIST_SOURCES } from '@/lib/api/hot-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewsList } from '@/components/news/NewsList'
import { NewsListSkeleton } from '@/components/news/NewsListSkeleton'
import { AdBanner } from '@/components/ads/AdBanner'
import { auth } from '@/lib/auth'
import { getUserSettings } from '@/lib/actions/settings'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { RefreshButton } from '@/components/common/RefreshButton'

export const revalidate = 3600 // ISR: 每小时重新验证一次

async function SuspendedGuestNews() {
  const [dailyResponse, aiNews] = await Promise.all([
    getNews('zh').catch(() => ({ items: [], total: 0 })), // Fetch standard daily news explicitly
    getAiNewsItems().catch(() => []),
  ])
  const mergedNews = [...dailyResponse.items, ...aiNews]
  return <NewsList news={mergedNews} showLoginCTA={true} />
}

async function SuspendedCustomNews() {
  const tPage = await getTranslations('page')
  const customNews = await getUserCustomNews().catch(() => [])

  if (customNews.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{tPage('noCustomFeeds')}</AlertTitle>
        <AlertDescription>{tPage('noCustomFeedsDescription')}</AlertDescription>
      </Alert>
    )
  }
  return <NewsList news={customNews} showLoginCTA={false} />
}

async function SuspendedAiNews({ isMember }: { isMember: boolean }) {
  const aiNews = await getAiNewsItems().catch(() => [])
  return <NewsList news={aiNews} showLoginCTA={!isMember} />
}

async function SuspendedDynamicNews({
  id,
  sourceName,
  isMember,
}: {
  id: string
  sourceName: string
  isMember: boolean
}) {
  const news = await getHotListNews(id, sourceName).catch(() => [])
  return <NewsList news={news} showLoginCTA={!isMember} />
}

export default async function HomePage() {
  const t = await getTranslations('home')
  const tNews = await getTranslations('news')
  const tPage = await getTranslations('page')
  const session = await auth()
  const settings = session?.user ? await getUserSettings() : null
  const isPro = settings?.isPro ?? false
  const isMember = !!session?.user

  // Ensure these render instantly while data fetches in suspense bounds
  const enabledSourceIds = (settings?.newsSources || [])
    .filter((id) => id !== 'everydaynews')
    .filter((id) => HOT_LIST_SOURCES.some((s) => s.id === id))

  // Guest View: Merge Daily and AI, no tabs, no trending
  if (!isMember) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[200px_1fr_200px] xl:gap-24">
          {/* Left Sidebar Ad */}
          <aside className="sticky top-0 hidden h-screen flex-col justify-center xl:flex">
            {/* Ad component remains same */}
            <AdBanner
              position="sidebar"
              size="large"
              className="min-h-[600px] w-full"
              initialIsPro={false}
            />
          </aside>

          <main className="mx-auto w-full max-w-4xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
              <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
            </div>

            <div className="space-y-6">
              <Suspense fallback={<NewsListSkeleton />}>
                <SuspendedGuestNews />
              </Suspense>
            </div>
          </main>

          {/* Right Sidebar Ad */}
          <aside className="sticky top-0 hidden h-screen flex-col justify-center xl:flex">
            <AdBanner
              position="sidebar"
              size="large"
              className="min-h-[600px] w-full"
              initialIsPro={false}
            />
          </aside>
        </div>
      </div>
    )
  }

  // Member View: Tabs
  return (
    <div className="container mx-auto py-8">
      {/* 3-column layout: Sidebar (Left) - Main Content - Sidebar (Right) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[200px_1fr_200px] xl:gap-24">
        {/* Left Sidebar Ad - Vertically Centered */}
        <aside className="sticky top-0 hidden h-screen flex-col justify-center xl:flex">
          <AdBanner
            position="sidebar"
            size="large"
            className="min-h-[600px] w-full"
            initialIsPro={isPro}
          />
        </aside>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>

          <Tabs defaultValue={isPro ? 'custom' : 'daily'} className="w-full">
            <TabsList className="scrollbar-hide mb-6 flex h-auto w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
              {/* Pro Custom Feed */}
              {isPro && <TabsTrigger value="custom">{tPage('myFeed')}</TabsTrigger>}

              <TabsTrigger value="daily">{tNews('daily')}</TabsTrigger>
              <TabsTrigger value="ai">{tNews('ai')}</TabsTrigger>

              {/* Dynamic Tabs */}
              {enabledSourceIds.map((id) => {
                const source = HOT_LIST_SOURCES.find((s) => s.id === id)
                return (
                  <TabsTrigger key={id} value={id}>
                    {source?.icon} {source?.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Pro Custom Content */}
            {isPro && (
              <TabsContent value="custom" className="min-h-[500px] space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">{tPage('myCustomFeed')}</h2>
                  <RefreshButton />
                </div>
                <Suspense fallback={<NewsListSkeleton />}>
                  <SuspendedCustomNews />
                </Suspense>
              </TabsContent>
            )}

            <TabsContent value="daily" className="min-h-[500px] space-y-4">
              <NewsDisplay />
            </TabsContent>

            <TabsContent value="ai" className="min-h-[500px] space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{tPage('itNewsAi')}</h2>
              </div>
              <Suspense fallback={<NewsListSkeleton />}>
                <SuspendedAiNews isMember={isMember} />
              </Suspense>
            </TabsContent>

            {/* Dynamic Contents */}
            {enabledSourceIds.map((id) => {
              const sourceName = HOT_LIST_SOURCES.find((s) => s.id === id)?.name || id
              return (
                <TabsContent key={id} value={id} className="min-h-[500px] space-y-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">{sourceName}</h2>
                    <RefreshButton />
                  </div>
                  <Suspense fallback={<NewsListSkeleton />}>
                    <SuspendedDynamicNews id={id} sourceName={sourceName} isMember={isMember} />
                  </Suspense>
                </TabsContent>
              )
            })}
          </Tabs>
        </main>

        {/* Right Sidebar Ad - Vertically Centered */}
        <aside className="sticky top-0 hidden h-screen flex-col justify-center xl:flex">
          <AdBanner
            position="sidebar"
            size="large"
            className="min-h-[600px] w-full"
            initialIsPro={isPro}
          />
        </aside>
      </div>
    </div>
  )
}
