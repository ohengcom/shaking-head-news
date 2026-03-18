import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      tier: 'member' | 'pro'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    tier?: 'member' | 'pro'
    authProvider?: string
    providerAccountId?: string
  }
}
