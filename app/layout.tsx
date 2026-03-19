import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import { headers } from 'next/headers'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import './globals.css'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { AppRuntimeSettings } from '@/components/layout/AppRuntimeSettings'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { UIWrapper } from '@/components/layout/UIWrapper'
import { TiltWrapper } from '@/components/rotation/TiltWrapper'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { UserTierProvider } from '@/hooks/use-user-tier'
import { getUserSettings } from '@/lib/actions/settings'
import { env } from '@/lib/env'
import { getUserTier } from '@/lib/tier-server'
import { defaultSettings } from '@/types/settings'
import { resolveRequestLocale } from '@/i18n'

const inter = Inter({
  subsets: ['latin'],
  display: 'optional',
  preload: false,
  variable: '--font-inter',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'optional',
  preload: false,
  variable: '--font-noto-sans-sc',
})

const appUrl = env.NEXT_PUBLIC_APP_URL ?? 'https://shaking-head-news.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: '摇头看新闻 - Shaking Head News',
  description:
    '在浏览新闻的同时，通过页面旋转帮助您改善颈椎健康。A modern web app with daily news and neck health features.',
  keywords: ['news', 'health', 'cervical spondylosis', 'neck exercise', '新闻', '颈椎健康'],
  authors: [{ name: '024812', url: 'https://github.com/024812' }],
  creator: '024812',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: appUrl,
    title: '摇头看新闻',
    description: '在浏览新闻的同时，通过页面旋转帮助您改善颈椎健康',
    siteName: '摇头看新闻',
  },
  twitter: {
    card: 'summary_large_image',
    title: '摇头看新闻',
    description: '在浏览新闻的同时，通过页面旋转帮助您改善颈椎健康',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [headerStore, locale, initialTierResult, initialSettings, messages] = await Promise.all([
    headers(),
    resolveRequestLocale(),
    getUserTier(),
    getUserSettings().catch(() => null),
    getMessages(),
  ])

  const nonce = headerStore.get('x-nonce') ?? undefined
  const initialTier = initialTierResult.tier
  const runtimeSettings = initialTier === 'guest' ? null : initialSettings
  const initialTheme = initialSettings?.theme ?? defaultSettings.theme
  const initialFontSize = initialSettings?.fontSize ?? defaultSettings.fontSize
  const initialLayoutMode = initialSettings?.layoutMode ?? defaultSettings.layoutMode
  const initialRotationMode = runtimeSettings?.rotationMode ?? defaultSettings.rotationMode
  const initialRotationInterval =
    runtimeSettings?.rotationInterval ?? defaultSettings.rotationInterval
  const initialAnimationEnabled =
    runtimeSettings?.animationEnabled ?? defaultSettings.animationEnabled
  const adsEnabled = initialTier !== 'pro' || initialSettings?.adsEnabled !== false

  return (
    <html
      lang={locale}
      data-font-size={initialFontSize}
      data-layout-mode={initialLayoutMode}
      suppressHydrationWarning
    >
      <head>
        <link rel="dns-prefetch" href="https://news.ravelloh.top" />
        <link rel="preconnect" href="https://news.ravelloh.top" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${notoSansSC.variable} font-sans`}>
        <SessionProvider>
          <UserTierProvider initialTier={initialTier}>
            <NextIntlClientProvider messages={messages} locale={locale}>
              <ThemeProvider
                attribute="class"
                defaultTheme={initialTheme}
                enableSystem
                disableTransitionOnChange
                nonce={nonce}
              >
                <AppRuntimeSettings initialSettings={runtimeSettings} />
                <UIWrapper>
                  <TiltWrapper
                    initialMode={initialRotationMode}
                    initialInterval={initialRotationInterval}
                    initialAnimationEnabled={initialAnimationEnabled}
                  >
                    <div className="flex min-h-screen flex-col">
                      <Header />
                      <main className="flex-1">{children}</main>
                      <Footer />
                    </div>
                  </TiltWrapper>
                </UIWrapper>
                <Toaster />
              </ThemeProvider>
            </NextIntlClientProvider>
          </UserTierProvider>
        </SessionProvider>
        {env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && adsEnabled && (
          <script
            async
            nonce={nonce}
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  )
}
