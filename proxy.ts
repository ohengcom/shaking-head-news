import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const proxy = auth((request) => {
  if (!request.auth && request.nextUrl.pathname.startsWith('/settings')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/settings/:path*'],
}
