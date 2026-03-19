'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { rateLimitByUser, RateLimitTiers } from '@/lib/rate-limit'
import { getStorageItem, setStorageItem, StorageKeys } from '@/lib/storage'
import { defaultSettings, UserSettings, UserSettingsSchema } from '@/types/settings'
import { AuthError, logError, validateOrThrow } from '@/lib/utils/error-handler'
import { sanitizeObject } from '@/lib/utils/input-validation'

async function persistLocaleCookie(language: UserSettings['language']) {
  const cookieStore = await cookies()
  cookieStore.set('locale', language, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function getUserSettings(): Promise<UserSettings> {
  const session = await auth()

  if (!session?.user?.id) {
    return { ...defaultSettings, userId: '' }
  }

  try {
    const storedSettings = await getStorageItem<UserSettings>(
      StorageKeys.userSettings(session.user.id)
    )

    if (!storedSettings) {
      return { ...defaultSettings, userId: session.user.id }
    }

    return validateOrThrow(UserSettingsSchema, {
      ...defaultSettings,
      ...storedSettings,
      userId: session.user.id,
    })
  } catch (error) {
    logError(error, {
      action: 'getUserSettings',
      userId: session.user.id,
    })

    return { ...defaultSettings, userId: session.user.id }
  }
}

export async function updateSettings(
  settings: Partial<UserSettings>
): Promise<{ success: boolean; error?: string; settings?: UserSettings }> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to save settings')
    }

    const rateLimitResult = await rateLimitByUser(session.user.id, {
      limit: 300,
      window: 60,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many requests. Please try again later.')
    }

    const sanitizedSettings = sanitizeObject(settings, {
      maxLength: 1000,
      allowHtml: false,
    })

    const currentSettings = await getUserSettings()
    const nextSettings = {
      ...currentSettings,
      ...sanitizedSettings,
      userId: session.user.id,
    }

    const validatedSettings = validateOrThrow(UserSettingsSchema, nextSettings)
    await setStorageItem(StorageKeys.userSettings(session.user.id), validatedSettings)
    await persistLocaleCookie(validatedSettings.language)

    revalidatePath('/')
    revalidatePath('/settings')
    revalidatePath('/stats')
    revalidatePath('/rss')

    return {
      success: true,
      settings: validatedSettings,
    }
  } catch (error) {
    logError(error, {
      action: 'updateSettings',
      settings,
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    }
  }
}

export async function resetSettings(): Promise<{
  success: boolean
  error?: string
  settings?: UserSettings
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to reset settings')
    }

    const rateLimitResult = await rateLimitByUser(session.user.id, {
      ...RateLimitTiers.STRICT,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many reset attempts. Please try again later.')
    }

    const resetValue = {
      ...defaultSettings,
      userId: session.user.id,
    }

    await setStorageItem(StorageKeys.userSettings(session.user.id), resetValue)
    await persistLocaleCookie(resetValue.language)

    revalidatePath('/')
    revalidatePath('/settings')
    revalidatePath('/stats')
    revalidatePath('/rss')

    return {
      success: true,
      settings: resetValue,
    }
  } catch (error) {
    logError(error, {
      action: 'resetSettings',
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset settings',
    }
  }
}
