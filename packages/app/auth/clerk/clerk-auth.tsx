'use client'
import { makeAuth } from 'app/auth/make-auth'
import { Clerk } from '@clerk/clerk-js'
import { ClerkProvider, useAuth, UserButton, SignUpButton, SignedOut } from '@clerk/nextjs'
import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { env } from 'app/env'
import { getConfig, getVariableValue } from 'tamagui'

console.log('[clerk]', env)

const clerk = new Clerk(env.CLERK_PUBLISHABLE_KEY!)

const getToken = async (): Promise<string | null> => {
  if (!clerk.loaded) {
    await clerk.load()
  }

  const session = clerk.session

  if (!session) {
    return null
  }

  return session.getToken()
}

function Font({ children }: { children: React.ReactNode }) {
  const config = getConfig()
  return (
    <div
      style={{
        fontFamily: getVariableValue(config.fonts.body?.family),
      }}
    >
      {children}
    </div>
  )
}

export default makeAuth({
  useUser() {
    const { isSignedIn, isLoaded, userId } = useAuth()

    if (!isLoaded) return { hasLoaded: false }

    return { isSignedIn, userId, hasLoaded: true }
  },
  useSignOut() {
    const { signOut } = useAuth()
    return useLatestCallback(async () => {
      await signOut()
    })
  },
  Provider({ children }) {
    return (
      <ClerkProvider
        publishableKey={env.CLERK_PUBLISHABLE_KEY!}
        Clerk={clerk}
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        {children}
      </ClerkProvider>
    )
  },
  useGetToken() {
    return getToken
  },
  UserButton() {
    return (
      <Font>
        <UserButton />
      </Font>
    )
  },
  AuthFlowTrigger({ children }) {
    return (
      <SignedOut>
        <Font>
          <SignUpButton mode="modal">{children}</SignUpButton>
        </Font>
      </SignedOut>
    )
  },
  getToken,
})
