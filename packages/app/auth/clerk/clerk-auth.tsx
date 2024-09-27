'use client'
import { makeAuth } from 'app/auth/make-auth'
import { Clerk } from '@clerk/clerk-js'
import { ClerkProvider, useAuth, UserButton, SignUpButton, SignedOut } from '@clerk/nextjs'
import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { env } from 'app/env'
import { getConfig, getVariableValue } from 'tamagui'
import { Button, ButtonText } from 'app/ds/Button'
import { useEffect, useState } from 'app/react'
import { platform } from 'app/ds/platform'
import { useCurrentPath } from 'app/navigation/use-pathname'

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

function UserTrigger({ children }: { children?: React.ReactElement }) {
  return (
    <Font>
      <UserButton />
    </Font>
  )
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

function SignUp({ children }: { children?: React.ReactElement }) {
  const [redirectUrl, setRedirectUrl] = useState<string>()
  const path = useCurrentPath()
  useEffect(() => {
    if (platform.OS === 'web') {
      setRedirectUrl(window.location.href)
    }
  }, [path])
  return (
    <Font>
      <SignUpButton mode="modal" signInForceRedirectUrl={redirectUrl}>
        {children}
      </SignUpButton>
    </Font>
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
        afterSignOutUrl="/"
      >
        {children}
      </ClerkProvider>
    )
  },
  useGetToken() {
    return getToken
  },
  UserButton({ children }) {
    const { isSignedIn, isLoaded, userId } = useAuth()
    if (!isLoaded) return null
    if (isSignedIn) {
      return <UserTrigger children={children} />
    }
    return (
      <SignUp>
        <Button>
          <ButtonText>Login</ButtonText>
        </Button>
      </SignUp>
    )
  },
  AuthFlowTrigger({ children }) {
    return (
      <SignedOut>
        <SignUp children={children} />
      </SignedOut>
    )
  },
  getToken,
})
