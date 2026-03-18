'use client'

import { useSession } from 'next-auth/react'
import { createContext, useContext } from 'react'
import {
  type FeatureConfig,
  type UserTier,
  getFeaturesForTier,
  isFeatureEnabled,
} from '@/lib/config/features'

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
  const initialTier = useContext(UserTierContext)

  let tier: UserTier = initialTier

  if (status === 'unauthenticated') {
    tier = 'guest'
  } else if (status === 'authenticated') {
    tier = session?.user?.tier === 'pro' ? 'pro' : initialTier === 'guest' ? 'member' : initialTier
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
  }
}
