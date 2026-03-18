import { Buffer } from 'buffer'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { ensureInternalUserProfile, getSubscriptionTierForUser } from '@/lib/user-profile'

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

const providers = []

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  )
}

if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider === 'microsoft-entra-id' && account.access_token) {
        try {
          const response = await fetch('https://graph.microsoft.com/v1.0/me/photos/48x48/$value', {
            headers: { Authorization: `Bearer ${account.access_token}` },
          })

          if (response.ok) {
            const buffer = await response.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')
            token.picture = `data:image/jpeg;base64,${base64}`
          }
        } catch (error) {
          console.error('Failed to fetch Microsoft profile photo:', error)
        }
      }

      if (account?.provider && account.providerAccountId) {
        const profile = await ensureInternalUserProfile({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          email: user?.email ?? token.email,
          name: user?.name ?? token.name,
          image: typeof token.picture === 'string' ? token.picture : user?.image,
        })

        token.id = profile.id
        token.tier = profile.subscriptionTier
        token.email = profile.email ?? token.email
        token.name = profile.name ?? token.name

        if (profile.image && typeof token.picture !== 'string') {
          token.picture = profile.image
        }
      } else if (typeof token.id === 'string') {
        token.tier = await getSubscriptionTierForUser({
          userId: token.id,
          email: token.email,
        })
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id
        session.user.tier = token.tier === 'pro' ? 'pro' : 'member'
      }

      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  secret: authSecret,
})
