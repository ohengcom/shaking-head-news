/**
 * 功能对比页面
 * 展示 Guest / Member / Pro 三层用户功能对比
 */

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getUserTier } from '@/lib/tier-server'
import { FeaturesComparison } from './FeaturesComparison'

export const maxDuration = 10

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('features')

  return {
    title: `${t('title')} - 摇头看新闻`,
    description: t('subtitle'),
  }
}

export default async function FeaturesPage() {
  const t = await getTranslations('features')
  const { tier } = await getUserTier()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      <FeaturesComparison currentTier={tier} />
    </div>
  )
}
