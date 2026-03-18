'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, useTransition } from 'react'
import {
  type FeatureConfig,
  type UserTier,
  getFeaturesForTier,
  isFeatureEnabled,
} from '@/lib/config/features'
import { toggleProSubscription } from '@/lib/actions/tier'
import { useToast } from '@/hooks/use-toast'

export interface UseUserTierReturn {
  tier: UserTier
  features: FeatureConfig
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  isMember: boolean
  isPro: boolean
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  hasFeature: (feature: keyof FeatureConfig) => boolean
  togglePro: () => void
  isTogglingPro: boolean
}

const UserTierContext = createContext<UserTier>('guest')

export function UserTierProvider({
  initialTier = 'guest',
  children,
}: {
  initialTier?: UserTier
  children: React.ReactNode
}) {
  return <UserTierContext.Provider value={initialTier}>{children}</UserTierContext.Provider>
}

export function useUserTier(): UseUserTierReturn {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const initialTier = useContext(UserTierContext)
  const [forcedTier, setForcedTier] = useState<UserTier | null>(null)
  const [isTogglingPro, startToggleTransition] = useTransition()

  let tier: UserTier = forcedTier ?? initialTier

  if (status === 'unauthenticated') {
    tier = 'guest'
  } else if (status === 'authenticated') {
    if (forcedTier) {
      tier = forcedTier
    } else {
      tier =
        session?.user?.tier === 'pro' ? 'pro' : initialTier === 'guest' ? 'member' : initialTier
    }
  }

  const features = getFeaturesForTier(tier)
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null

  const togglePro = () => {
    if (status !== 'authenticated') {
      toast({
        title: '登录后可用',
        description: '请先登录，再切换 Pro 权限。',
        variant: 'destructive',
      })
      return
    }

    startToggleTransition(async () => {
      const result = await toggleProSubscription()

      if (!result.success || !result.tier) {
        toast({
          title: '切换失败',
          description: result.error || '无法更新当前账号的 Pro 状态。',
          variant: 'destructive',
        })
        return
      }

      const nextTier: UserTier = result.tier === 'pro' ? 'pro' : 'member'
      setForcedTier(nextTier)
      router.refresh()

      toast({
        title: result.tier === 'pro' ? 'Pro 已激活' : '已切回会员',
        description:
          result.tier === 'pro' ? '当前账号已解锁 Pro 功能。' : '当前账号已恢复为会员权限。',
      })
    })
  }

  return {
    tier,
    features,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isGuest: tier === 'guest',
    isMember: tier === 'member',
    isPro: tier === 'pro',
    user,
    hasFeature: (feature) => isFeatureEnabled(tier, feature),
    togglePro,
    isTogglingPro,
  }
}
