import 'server-only'

import { z } from 'zod'

const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    return trimmed.length === 0 ? undefined : trimmed
  }, schema.optional())

const optionalString = emptyStringToUndefined(z.string())
const optionalUrl = emptyStringToUndefined(z.string().url())

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    AUTH_SECRET: optionalString,
    NEXTAUTH_SECRET: optionalString,
    AUTH_GOOGLE_ID: optionalString,
    AUTH_GOOGLE_SECRET: optionalString,
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    AUTH_MICROSOFT_ENTRA_ID_ID: optionalString,
    AUTH_MICROSOFT_ENTRA_ID_SECRET: optionalString,
    AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: optionalString,
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    NEXT_PUBLIC_APP_URL: optionalUrl,
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: optionalString,
    NEWS_API_BASE_URL: optionalUrl,
    PRO_USER_IDS: optionalString,
    PRO_USER_EMAILS: optionalString,
  })
  .superRefine((value, context) => {
    const resolvedAuthSecret = value.AUTH_SECRET ?? value.NEXTAUTH_SECRET
    const resolvedGoogleId = value.AUTH_GOOGLE_ID ?? value.GOOGLE_CLIENT_ID
    const resolvedGoogleSecret = value.AUTH_GOOGLE_SECRET ?? value.GOOGLE_CLIENT_SECRET
    const microsoftValues = [
      value.AUTH_MICROSOFT_ENTRA_ID_ID,
      value.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      value.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
    ]

    if (value.NODE_ENV === 'production' && !resolvedAuthSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_SECRET is required in production.',
        path: ['AUTH_SECRET'],
      })
    }

    if (Boolean(resolvedGoogleId) !== Boolean(resolvedGoogleSecret)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Google auth requires both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.',
        path: ['AUTH_GOOGLE_ID'],
      })
    }

    const configuredMicrosoftValues = microsoftValues.filter(Boolean).length
    if (configuredMicrosoftValues > 0 && configuredMicrosoftValues < microsoftValues.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Microsoft auth requires AUTH_MICROSOFT_ENTRA_ID_ID, AUTH_MICROSOFT_ENTRA_ID_SECRET, and AUTH_MICROSOFT_ENTRA_ID_TENANT_ID.',
        path: ['AUTH_MICROSOFT_ENTRA_ID_ID'],
      })
    }
  })

type EnvData = z.infer<typeof envSchema>

type ResolvedEnv = {
  NODE_ENV: EnvData['NODE_ENV']
  AUTH_SECRET: string | undefined
  AUTH_GOOGLE_ID: string | undefined
  AUTH_GOOGLE_SECRET: string | undefined
  AUTH_MICROSOFT_ENTRA_ID_ID: string | undefined
  AUTH_MICROSOFT_ENTRA_ID_SECRET: string | undefined
  AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: string | undefined
  UPSTASH_REDIS_REST_URL: string | undefined
  UPSTASH_REDIS_REST_TOKEN: string | undefined
  NEXT_PUBLIC_APP_URL: string | undefined
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: string | undefined
  NEWS_API_BASE_URL: string
  PRO_USER_IDS: string | undefined
  PRO_USER_EMAILS: string | undefined
  isProduction: boolean
  isDevelopment: boolean
  hasGoogleAuth: boolean
  hasMicrosoftAuth: boolean
}

let cachedEnv: Readonly<ResolvedEnv> | null = null

function resolveEnv(): Readonly<ResolvedEnv> {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsedEnv = envSchema.safeParse(process.env)

  if (!parsedEnv.success) {
    const issues = parsedEnv.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')

    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  const data = parsedEnv.data
  const authSecret = data.AUTH_SECRET ?? data.NEXTAUTH_SECRET
  const googleClientId = data.AUTH_GOOGLE_ID ?? data.GOOGLE_CLIENT_ID
  const googleClientSecret = data.AUTH_GOOGLE_SECRET ?? data.GOOGLE_CLIENT_SECRET

  cachedEnv = {
    NODE_ENV: data.NODE_ENV,
    AUTH_SECRET: authSecret,
    AUTH_GOOGLE_ID: googleClientId,
    AUTH_GOOGLE_SECRET: googleClientSecret,
    AUTH_MICROSOFT_ENTRA_ID_ID: data.AUTH_MICROSOFT_ENTRA_ID_ID,
    AUTH_MICROSOFT_ENTRA_ID_SECRET: data.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: data.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
    UPSTASH_REDIS_REST_URL: data.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: data.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_APP_URL: data.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: data.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
    NEWS_API_BASE_URL: data.NEWS_API_BASE_URL ?? 'https://news.ravelloh.top',
    PRO_USER_IDS: data.PRO_USER_IDS,
    PRO_USER_EMAILS: data.PRO_USER_EMAILS,
    isProduction: data.NODE_ENV === 'production',
    isDevelopment: data.NODE_ENV === 'development',
    hasGoogleAuth: Boolean(googleClientId && googleClientSecret),
    hasMicrosoftAuth: Boolean(
      data.AUTH_MICROSOFT_ENTRA_ID_ID &&
      data.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      data.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
    ),
  }

  return cachedEnv
}

export function getEnv(): Readonly<ResolvedEnv> {
  return resolveEnv()
}

export const env = new Proxy({} as Readonly<ResolvedEnv>, {
  get(_target, property: string | symbol) {
    return (resolveEnv() as Record<string | symbol, unknown>)[property]
  },
  has(_target, property: string | symbol) {
    return property in resolveEnv()
  },
  ownKeys() {
    return Reflect.ownKeys(resolveEnv())
  },
  getOwnPropertyDescriptor(_target, property: string | symbol) {
    return {
      configurable: true,
      enumerable: true,
      value: (resolveEnv() as Record<string | symbol, unknown>)[property],
    }
  },
})
