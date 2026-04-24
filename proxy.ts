import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Redirect bare / to /auth
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Build a response we can attach cookies to
  const response = NextResponse.next()

  // Create a Supabase client that can read/refresh the session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // Refresh session (needed to keep token alive)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = pathname.startsWith('/home')
  const isAuthPage  = pathname.startsWith('/auth')

  // Unauthenticated user trying to access /home → send to /auth
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Authenticated user hitting /auth → send to /home
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
