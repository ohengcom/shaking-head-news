'use client'

import { useTranslations } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { Check, X, Eye, Sparkles, Crown, User, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTier } from '@/lib/config/features'
import { cn } from '@/lib/utils'

interface FeaturesComparisonProps {
  currentTier: UserTier
}

type FeatureValue = 'included' | 'not-included' | 'preview' | string

interface Feature {
  key: string
  guest: FeatureValue
  member: FeatureValue
  pro: FeatureValue
}

export function FeaturesComparison({ currentTier }: FeaturesComparisonProps) {
  const t = useTranslations('features')
  const { data: session } = useSession()

  const features: Feature[] = [
    { key: 'instantUse', guest: 'included', member: 'not-included', pro: 'not-included' },
    {
      key: 'newsSources',
      guest: t('featureValues.defaultOnly'),
      member: t('featureValues.hotLists'),
      pro: t('featureValues.allSources'),
    },
    {
      key: 'rotationMode',
      guest: t('featureValues.continuousFixed'),
      member: t('featureValues.selectable'),
      pro: t('featureValues.selectable'),
    },
    {
      key: 'rotationInterval',
      guest: t('featureValues.fixed30s'),
      member: t('featureValues.adjustable5to60'),
      pro: t('featureValues.adjustable5to60'),
    },
    {
      key: 'rotationAngle',
      guest: t('featureValues.fixed15deg'),
      member: t('featureValues.adjustable8to25'),
      pro: t('featureValues.adjustable8to25'),
    },
    { key: 'pauseRotation', guest: 'included', member: 'included', pro: 'included' },
    {
      key: 'fontSize',
      guest: t('featureValues.mediumFixed'),
      member: t('featureValues.adjustable4levels'),
      pro: t('featureValues.adjustable4levels'),
    },
    {
      key: 'layoutMode',
      guest: t('featureValues.defaultLayout'),
      member: t('featureValues.compactNormal'),
      pro: t('featureValues.compactNormal'),
    },
    {
      key: 'darkMode',
      guest: t('featureValues.manualSwitch'),
      member: 'included',
      pro: 'included',
    },
    { key: 'multiLanguage', guest: 'included', member: 'included', pro: 'included' },
    {
      key: 'ads',
      guest: t('featureValues.forceShow'),
      member: t('featureValues.forceShow'),
      pro: t('featureValues.canDisable'),
    },
    { key: 'cloudSync', guest: 'not-included', member: 'included', pro: 'included' },
    { key: 'statistics', guest: 'not-included', member: 'preview', pro: 'included' },
    { key: 'healthReminders', guest: 'not-included', member: 'not-included', pro: 'included' },
    { key: 'exerciseGoals', guest: 'not-included', member: 'not-included', pro: 'included' },
    { key: 'keyboardShortcuts', guest: 'not-included', member: 'not-included', pro: 'included' },
    {
      key: 'progressSave',
      guest: t('featureValues.sessionOnly'),
      member: t('featureValues.permanent'),
      pro: t('featureValues.permanent'),
    },
    {
      key: 'userBadge',
      guest: t('featureValues.none'),
      member: t('featureValues.memberBadge'),
      pro: t('featureValues.proBadge'),
    },
  ]

  const guestBenefits = [
    t('cardBenefits.guest.01'),
    t('cardBenefits.guest.02'),
    t('cardBenefits.guest.03'),
  ]

  const memberBenefits = [
    t('cardBenefits.member.01'),
    t('cardBenefits.member.02'),
    t('cardBenefits.member.03'),
  ]

  const proBenefits = [t('cardBenefits.pro.01'), t('cardBenefits.pro.02'), t('cardBenefits.pro.03')]

  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:grid-cols-3">
        <PricingCard
          icon={<User className="h-6 w-6" />}
          title={t('guestTitle')}
          price={t('guestPrice')}
          description={t('guestDescription')}
          isCurrent={currentTier === 'guest'}
          benefits={guestBenefits}
          t={t}
        />

        <PricingCard
          icon={<Crown className="h-6 w-6" />}
          title={t('memberTitle')}
          price={t('memberPrice')}
          description={t('memberDescription')}
          isCurrent={currentTier === 'member'}
          isHighlighted
          benefits={memberBenefits}
          t={t}
          onAction={() => signIn()}
        />

        <PricingCard
          icon={<Sparkles className="h-6 w-6" />}
          title={t('proTitle')}
          price={t('proPrice')}
          description={t('proDescription')}
          isCurrent={currentTier === 'pro'}
          isPro
          benefits={proBenefits}
          t={t}
          isAuthenticated={!!session}
        />
      </div>

      <div className="bg-card/50 overflow-hidden rounded-2xl border backdrop-blur-sm">
        <div className="bg-muted/30 border-b p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Zap className="text-primary h-5 w-5" />
            完整功能对比
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">详细了解每个层级的功能差异</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/20 border-b">
                <th className="min-w-[200px] p-4 text-left font-semibold">功能</th>
                <th className="min-w-[120px] p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <User className="text-muted-foreground h-5 w-5" />
                    <span className="font-semibold">{t('guestTitle')}</span>
                  </div>
                </th>
                <th className="bg-primary/5 min-w-[120px] p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Crown className="text-primary h-5 w-5" />
                    <span className="text-primary font-semibold">{t('memberTitle')}</span>
                  </div>
                </th>
                <th className="min-w-[120px] p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text font-semibold text-transparent">
                      {t('proTitle')}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={feature.key}
                  className={cn(
                    'hover:bg-muted/30 border-b transition-colors last:border-0',
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  )}
                >
                  <td className="p-4 font-medium">{t(`featureList.${feature.key}`)}</td>
                  <td className="p-4 text-center">
                    <FeatureValueDisplay
                      value={feature.guest}
                      featureKey={feature.key}
                      tier="guest"
                    />
                  </td>
                  <td className="bg-primary/5 p-4 text-center">
                    <FeatureValueDisplay
                      value={feature.member}
                      featureKey={feature.key}
                      tier="member"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <FeatureValueDisplay value={feature.pro} featureKey={feature.key} tier="pro" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="from-primary/5 border-t bg-gradient-to-r via-transparent to-amber-500/5 p-6">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {currentTier === 'guest' && (
              <>
                <p className="text-muted-foreground text-sm">立即登录，免费解锁会员功能</p>
                <Button onClick={() => signIn()} className="gap-2">
                  <Crown className="h-4 w-4" />
                  {t('loginFree')}
                </Button>
              </>
            )}
            {currentTier === 'member' && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {t('memberCurrentMessage')}
              </p>
            )}
            {currentTier === 'pro' && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {t('proCurrentMessage')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureValueDisplay({
  value,
  featureKey,
  tier,
}: {
  value: FeatureValue
  featureKey?: string
  tier?: UserTier
}) {
  if (value === 'included') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
        <Check className="h-5 w-5 text-green-500" />
      </span>
    )
  }

  if (value === 'not-included') {
    return (
      <span className="bg-muted inline-flex h-8 w-8 items-center justify-center rounded-full">
        <X className="text-muted-foreground/40 h-5 w-5" />
      </span>
    )
  }

  if (value === 'preview') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-yellow-600 dark:text-yellow-500">
        <Eye className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">预览</span>
      </span>
    )
  }

  if (featureKey === 'newsSources') {
    if (tier === 'guest') {
      return (
        <span className="text-muted-foreground bg-muted/50 rounded-md px-3 py-1 text-sm">
          {value}
        </span>
      )
    }

    if (tier === 'member') {
      return (
        <span className="bg-primary/10 text-primary rounded-md px-3 py-1 text-sm font-medium">
          {value}
        </span>
      )
    }

    if (tier === 'pro') {
      return (
        <span className="rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-sm font-bold text-amber-600 dark:text-amber-400">
          {value}
        </span>
      )
    }
  }

  return (
    <span className="text-muted-foreground bg-muted/50 rounded-md px-2 py-1 text-sm">{value}</span>
  )
}

function PricingCard({
  icon,
  title,
  price,
  description,
  isCurrent,
  isHighlighted,
  isPro,
  benefits,
  t,
  onAction,
  isAuthenticated,
}: {
  icon: React.ReactNode
  title: string
  price: string
  description: string
  isCurrent: boolean
  isHighlighted?: boolean
  isPro?: boolean
  benefits: string[]
  t: ReturnType<typeof useTranslations<'features'>>
  onAction?: () => void
  isAuthenticated?: boolean
}) {
  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-2xl border p-6 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg',
        isHighlighted && 'border-primary shadow-primary/10 scale-[1.02] shadow-lg',
        isPro && 'border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent',
        !isHighlighted && !isPro && 'bg-card hover:border-primary/50'
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground rounded-full px-4 py-1 text-xs font-semibold shadow-lg">
            推荐
          </span>
        </div>
      )}

      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
            {t('proAccessManaged')}
          </span>
        </div>
      )}

      <div className="mb-6 pt-2 text-center">
        <div
          className={cn(
            'mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
            isHighlighted && 'bg-primary/10 text-primary',
            isPro && 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500',
            !isHighlighted && !isPro && 'bg-muted text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <h3
          className={cn(
            'mb-2 text-xl font-bold',
            isPro && 'bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent'
          )}
        >
          {title}
        </h3>
        <div className="mb-2 text-3xl font-bold">{price}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <ul className="mb-6 space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-3 text-sm">
            <Check className="h-4 w-4 shrink-0 text-green-500" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="outline" className="w-full" disabled>
          <Check className="mr-2 h-4 w-4" />
          {t('currentPlan')}
        </Button>
      ) : isPro ? (
        isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/5 dark:text-amber-400"
            disabled
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('serverManaged')}
          </Button>
        ) : (
          <div className="text-center">
            <span className="text-muted-foreground text-sm">{t('loginToActivateLink')}</span>
          </div>
        )
      ) : isHighlighted ? (
        <Button className="w-full" onClick={onAction}>
          <Crown className="mr-2 h-4 w-4" />
          {t('loginFree')}
        </Button>
      ) : (
        <Button variant="outline" className="w-full" disabled>
          {title}
        </Button>
      )}
    </div>
  )
}
