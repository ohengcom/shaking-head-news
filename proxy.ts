import { Buffer } from 'buffer'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { env } from '@/lib/env'

export const proxy = auth((request) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const requestHeaders = new Headers(request.headers)
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    'https://accounts.google.com',
    'https://www.googletagmanager.com',
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
    'https://tpc.googlesyndication.com',
    'https://fundingchoicesmessages.google.com',
    'https://cse.google.com',
    'https://*.adtrafficquality.google',
  ]

  if (!env.isProduction) {
    scriptSources.push("'unsafe-eval'")
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://news.ravelloh.top https://accounts.google.com https://*.upstash.io https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://*.adtrafficquality.google",
    "frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://www.google.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://*.adtrafficquality.google",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ]
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  if (!request.auth && request.nextUrl.pathname.startsWith('/settings')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)

    const response = NextResponse.redirect(loginUrl)
    response.headers.set('x-nonce', nonce)
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', csp)
  return response
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
