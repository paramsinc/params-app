'use client'
import { makeAuth } from 'app/auth/make-auth'
import { SignUp, useAuth, ClerkProvider, UserButton } from '@clerk/clerk-react'
import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { env } from 'app/env'
import { getConfig, getVariableValue } from 'tamagui'

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
      <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY!}>
        {children}
      </ClerkProvider>
    )
  },
  AuthFlow() {
    return (
      <Font>
        <SignUp />
      </Font>
    )
  },
  useGetToken() {
    const { getToken } = useAuth()
    return getToken
  },
  UserButton() {
    return (
      <Font>
        <UserButton />
      </Font>
    )
  },
})
