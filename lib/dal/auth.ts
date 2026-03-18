import { cache } from 'react'
import { auth } from '@/lib/auth'
import { getSubscriptionTierForUser } from '@/lib/user-profile'

export interface CurrentUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  subscription: 'member' | 'pro'
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const session = await auth()

    if (!session?.user) {
      return null
    }

    return {
      id: session.user.id || session.user.email || '',
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      subscription: session.user.tier === 'pro' ? 'pro' : 'member',
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
})

export const verifyAuth = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
})

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function hasProSubscription(): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const tier = await getSubscriptionTierForUser({
    userId: user.id,
    email: user.email,
  })

  return tier === 'pro'
}
