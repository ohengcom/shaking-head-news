import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { auth } from '@/auth'
import { getStorageItem, StorageKeys } from '@/lib/storage'
import type { UserSettings } from '@/types/settings'

const DEFAULT_LOCALE = 'zh'

export async function resolveRequestLocale(): Promise<'zh' | 'en'> {
  const session = await auth().catch(() => null)

  if (session?.user?.id) {
    const storedSettings = await getStorageItem<UserSettings>(
      StorageKeys.userSettings(session.user.id)
    ).catch(() => null)

    if (storedSettings?.language === 'zh' || storedSettings?.language === 'en') {
      return storedSettings.language
    }
  }

  const cookieStore = await cookies()
  return cookieStore.get('locale')?.value === 'en' ? 'en' : DEFAULT_LOCALE
}

export default getRequestConfig(async () => {
  const locale = await resolveRequestLocale()

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
