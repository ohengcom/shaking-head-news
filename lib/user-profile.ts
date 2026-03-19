import { defaultSettings, type UserSettings } from '@/types/settings'
import { env } from '@/lib/env'
import { sanitizeEmail } from '@/lib/utils/input-validation'
import { getStorageItem, setStorageItem, StorageKeys } from '@/lib/storage'

export type SubscriptionTier = 'member' | 'pro'

interface UserAccountLink {
  provider: string
  providerAccountId: string
}

export interface UserProfile {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  subscriptionTier: SubscriptionTier
  accounts: UserAccountLink[]
  createdAt: string
  updatedAt: string
}

interface EnsureUserProfileInput {
  provider: string
  providerAccountId: string
  email?: string | null
  name?: string | null
  image?: string | null
}

function parseEnvList(value?: string): Set<string> {
  if (!value) {
    return new Set()
  }

  return new Set(
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  )
}

const proUserIds = parseEnvList(env.PRO_USER_IDS)
const proUserEmails = parseEnvList(env.PRO_USER_EMAILS)

function normalizeEmail(email?: string | null): string | undefined {
  if (!email) {
    return undefined
  }

  const sanitized = sanitizeEmail(email)
  return sanitized || undefined
}

function encodeFallbackSegment(value: string): string {
  return encodeURIComponent(value).replace(/%/g, '_')
}

export function buildFallbackUserId({
  provider,
  providerAccountId,
  email,
}: Pick<EnsureUserProfileInput, 'provider' | 'providerAccountId' | 'email'>): string {
  const normalizedEmail = normalizeEmail(email)
  const rawId = normalizedEmail
    ? `email:${normalizedEmail}`
    : `provider:${provider}:${providerAccountId}`

  return `fallback:${encodeFallbackSegment(rawId)}`
}

function getEnvSubscriptionTier(userId: string, email?: string | null): SubscriptionTier | null {
  const normalizedEmail = email ? email.toLowerCase() : undefined

  if (proUserIds.has(userId.toLowerCase())) {
    return 'pro'
  }

  if (normalizedEmail && proUserEmails.has(normalizedEmail)) {
    return 'pro'
  }

  return null
}

function dedupeAccounts(accounts: UserAccountLink[]): UserAccountLink[] {
  const seen = new Set<string>()

  return accounts.filter((account) => {
    const key = `${account.provider}:${account.providerAccountId}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

async function ensureDefaultSettings(userId: string) {
  const settingsKey = StorageKeys.userSettings(userId)
  const existingSettings = await getStorageItem<UserSettings>(settingsKey)

  if (!existingSettings) {
    await setStorageItem(settingsKey, {
      ...defaultSettings,
      userId,
    })
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profile = await getStorageItem<UserProfile>(StorageKeys.userProfile(userId))

  if (!profile) {
    return null
  }

  const envTier = getEnvSubscriptionTier(userId, profile.email)

  if (!envTier || envTier === profile.subscriptionTier) {
    return profile
  }

  const updatedProfile: UserProfile = {
    ...profile,
    subscriptionTier: envTier,
    updatedAt: new Date().toISOString(),
  }

  await setStorageItem(StorageKeys.userProfile(userId), updatedProfile)
  return updatedProfile
}

export async function getSubscriptionTierForUser({
  userId,
  email,
}: {
  userId: string
  email?: string | null
}): Promise<SubscriptionTier> {
  const normalizedEmail = normalizeEmail(email)
  const envTier = getEnvSubscriptionTier(userId, normalizedEmail)

  if (envTier) {
    return envTier
  }

  const profile = await getUserProfile(userId)
  return profile?.subscriptionTier ?? 'member'
}

export async function ensureInternalUserProfile(
  input: EnsureUserProfileInput
): Promise<UserProfile> {
  const normalizedEmail = normalizeEmail(input.email)
  const accountKey = StorageKeys.authAccount(input.provider, input.providerAccountId)

  let internalUserId = await getStorageItem<string>(accountKey)

  if (!internalUserId && normalizedEmail) {
    internalUserId = await getStorageItem<string>(StorageKeys.authEmail(normalizedEmail))
  }

  const now = new Date().toISOString()

  if (!internalUserId) {
    internalUserId = globalThis.crypto.randomUUID()
  }

  const existingProfile = await getStorageItem<UserProfile>(StorageKeys.userProfile(internalUserId))
  const subscriptionTier =
    getEnvSubscriptionTier(internalUserId, normalizedEmail ?? existingProfile?.email) ??
    existingProfile?.subscriptionTier ??
    'member'

  const profile: UserProfile = {
    id: internalUserId,
    email: normalizedEmail ?? existingProfile?.email ?? null,
    name: input.name ?? existingProfile?.name ?? null,
    image: input.image ?? existingProfile?.image ?? null,
    subscriptionTier,
    accounts: dedupeAccounts([
      ...(existingProfile?.accounts ?? []),
      {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
    ]),
    createdAt: existingProfile?.createdAt ?? now,
    updatedAt: now,
  }

  await setStorageItem(StorageKeys.userProfile(internalUserId), profile)
  await setStorageItem(accountKey, internalUserId)

  if (normalizedEmail) {
    await setStorageItem(StorageKeys.authEmail(normalizedEmail), internalUserId)
  }

  await ensureDefaultSettings(internalUserId)

  return profile
}

export async function setSubscriptionTierForUser({
  userId,
  tier,
  email,
  name,
  image,
}: {
  userId: string
  tier: SubscriptionTier
  email?: string | null
  name?: string | null
  image?: string | null
}): Promise<UserProfile> {
  const existingProfile = await getStorageItem<UserProfile>(StorageKeys.userProfile(userId))
  const normalizedEmail = normalizeEmail(email)
  const now = new Date().toISOString()

  const profile: UserProfile = {
    id: userId,
    email: normalizedEmail ?? existingProfile?.email ?? null,
    name: name ?? existingProfile?.name ?? null,
    image: image ?? existingProfile?.image ?? null,
    subscriptionTier: tier,
    accounts: existingProfile?.accounts ?? [],
    createdAt: existingProfile?.createdAt ?? now,
    updatedAt: now,
  }

  await setStorageItem(StorageKeys.userProfile(userId), profile)

  if (profile.email) {
    await setStorageItem(StorageKeys.authEmail(profile.email), userId)
  }

  await ensureDefaultSettings(userId)

  return profile
}
