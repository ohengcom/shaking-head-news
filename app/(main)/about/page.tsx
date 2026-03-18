import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const maxDuration = 10

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function AboutPage() {
  const t = await getTranslations('home')
  const tAbout = await getTranslations('about')

  return (
    <div className="container mx-auto py-8 md:py-12">
      <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold">{t('features.news.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('features.news.description')}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold">{t('features.rotation.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('features.rotation.description')}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold">{t('features.stats.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('features.stats.description')}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold">{t('features.i18n.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('features.i18n.description')}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold">{t('features.sync.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('features.sync.description')}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold">{t('features.theme.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('features.theme.description')}</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground space-y-6 rounded-lg border p-6 shadow-sm">
          <div>
            <h2 className="mb-3 text-2xl font-semibold">{tAbout('background')}</h2>
            <p className="text-muted-foreground">{tAbout('backgroundDescription')}</p>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-semibold">{tAbout('techStack')}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">Next.js 16</span>
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">React 19</span>
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">TypeScript 5.7</span>
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">Tailwind CSS 4</span>
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">Framer Motion</span>
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">NextAuth.js v5</span>
              <span className="bg-primary/10 rounded-full px-3 py-1 text-sm">Upstash Redis</span>
            </div>
          </div>

          <div className="border-t pt-6 text-center">
            <p className="text-muted-foreground text-sm">{tAbout('license')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
