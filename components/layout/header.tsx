import Link from 'next/link'
import { Newspaper, User, Sparkles, Crown } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { getUserTier } from '@/lib/tier-server'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export async function Header() {
  const session = await auth()
  const { tier } = await getUserTier()
  const t = await getTranslations('nav')
  const tCommon = await getTranslations('common')
  const tTier = await getTranslations('tier')

  const isGuest = tier === 'guest'
  const isMember = tier === 'member'
  const isPro = tier === 'pro'

  return (
    <>
      {/* Guest 升级提示 Banner */}
      {isGuest && (
        <div className="bg-primary/10 border-primary/20 border-b px-4 py-2 text-center text-sm">
          <span className="text-muted-foreground">{tTier('guestBanner')}</span>
          <Link href="/features" className="text-primary ml-2 font-medium hover:underline">
            {tTier('viewFeatures')}
          </Link>
        </div>
      )}

      <header className="border-border bg-background/80 sticky top-0 z-50 mx-4 mt-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80"
            >
              <Newspaper className="text-primary h-6 w-6" />
              <span className="text-xl font-bold">{tCommon('appName')}</span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-200"
              >
                {t('home')}
              </Link>
              <Link
                href="/stats"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-200"
              >
                {t('stats')}
              </Link>
              <Link
                href="/settings"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-200"
              >
                {t('settings')}
              </Link>
              <Link
                href="/features"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-200"
              >
                {t('features')}
              </Link>
              <Link
                href="/about"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-200"
              >
                {t('about')}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    {/* 用户徽章 */}
                    {isPro ? (
                      <Badge
                        variant="default"
                        className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                      >
                        <Sparkles className="h-3 w-3" />
                        Pro
                      </Badge>
                    ) : isMember ? (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" />
                        {tTier('memberBadge')}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm leading-none font-medium">{session.user.name}</p>
                        {isPro && (
                          <Badge
                            variant="default"
                            className="h-5 gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 text-[10px] text-white"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Pro
                          </Badge>
                        )}
                        {isMember && (
                          <Badge variant="secondary" className="h-5 gap-0.5 px-1.5 text-[10px]">
                            <Crown className="h-2.5 w-2.5" />
                            {tTier('memberBadge')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs leading-none">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      {t('settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/stats" className="cursor-pointer">
                      {t('stats')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/features" className="cursor-pointer">
                      {t('features')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <LogoutButton />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
