import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  //   const referer = req.headers.get('referer')
  //   console.log('[github callback][referer]', referer)
  //   if (!referer?.includes('github.com/')) {
  //     console.error('[/api/auth/github/callback] Invalid referer:', referer)
  //     return new Response('Invalid request origin', { status: 403 })
  //   }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 })
  }

  const parsedState = JSON.parse(state)
  const redirect = parsedState.redirect
  const url = new URL(redirect)
  url.searchParams.set('code', code)
  url.searchParams.set('state', state)
  return Response.redirect(url)
}
