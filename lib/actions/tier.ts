'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import {
  getSubscriptionTierForUser,
  setSubscriptionTierForUser,
  type SubscriptionTier,
} from '@/lib/user-profile'
import { AuthError, logError } from '@/lib/utils/error-handler'

export async function toggleProSubscription(): Promise<{
  success: boolean
  tier?: SubscriptionTier
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to change your subscription tier')
    }

    const currentTier = await getSubscriptionTierForUser({
      userId: session.user.id,
      email: session.user.email,
    })
    const nextTier: SubscriptionTier = currentTier === 'pro' ? 'member' : 'pro'

    await setSubscriptionTierForUser({
      userId: session.user.id,
      tier: nextTier,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })

    revalidatePath('/')
    revalidatePath('/features')
    revalidatePath('/settings')
    revalidatePath('/rss')
    revalidatePath('/stats')

    return {
      success: true,
      tier: nextTier,
    }
  } catch (error) {
    logError(error, {
      action: 'toggleProSubscription',
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change subscription tier',
    }
  }
}
