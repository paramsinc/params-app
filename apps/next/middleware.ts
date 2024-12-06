import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, req) => {
  // if (req.nextUrl.pathname === '/' && auth().userId) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)((?!/webhooks).*)', // Matches all API routes except /webhooks
    '/profiles/[profileSlug]/book',
    '/((?!monitoring).*)', // Exclude Sentry monitoring route
  ],
}
