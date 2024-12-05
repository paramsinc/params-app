import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)((?!/webhooks).*)', // Matches all API routes except /webhooks
    '/profiles/[profileSlug]/book',
    '/((?!monitoring).*)', // Exclude Sentry monitoring route
  ],
}
