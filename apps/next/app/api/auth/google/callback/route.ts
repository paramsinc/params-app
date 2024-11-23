import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!state) {
    return redirect('/error?message=Missing state parameter')
  }
  if (!code) {
    return redirect('/error?message=Missing code parameter')
  }

  // Parse the state parameter
  const { redirect: originalUrl } = JSON.parse(state)

  // Create URL object from the full original URL
  const url = new URL(originalUrl)

  // Add the OAuth response params
  url.searchParams.set('code', code)
  url.searchParams.set('state', state)

  // Redirect back to the full URL
  return redirect(url.toString())
}
