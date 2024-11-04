import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  try {
    if (!state) {
      return redirect('/error?message=Missing state parameter')
    }
    if (!code) {
      return redirect('/error?message=Missing code parameter')
    }

    // Parse the state parameter
    const { redirect: redirectPath } = JSON.parse(state)

    const url = new URL(redirectPath)
    url.searchParams.set('code', code)
    url.searchParams.set('state', state)

    // Redirect to the final destination
    return redirect(url.toString())
  } catch (error) {
    return redirect('/error?message=Authentication failed')
  }
}
