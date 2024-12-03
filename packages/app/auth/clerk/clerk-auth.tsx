'use client'
import { makeAuth } from 'app/auth/make-auth'
import { Clerk } from '@clerk/clerk-js'
import {
  ClerkProvider,
  useAuth,
  UserButton,
  SignUpButton,
  SignedOut,
  useUser,
  SignUp as ClerkSignUp,
  SignInButton,
} from '@clerk/nextjs'
import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { env } from 'app/env'
import { getConfig, getVariableValue } from 'tamagui'
import { Button, ButtonText } from 'app/ds/Button'
import { useEffect, useState, useServerEffect } from 'app/react'
import { platform } from 'app/ds/platform'
import { useCurrentPath } from 'app/navigation/use-pathname'
import { Lucide } from 'app/ds/Lucide'
import { useDashboardLinks } from 'app/features/web-layout/useDashboardLinks'

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
  const links = useDashboardLinks()
  return (
    <Font>
      <UserButton>
        {children}
        <UserButton.MenuItems>
          {links.map((link) => (
            <UserButton.Link
              key={link.href}
              label={link.label}
              href={link.href}
              labelIcon={<link.icon size={16} color="var(--accent)" />}
            />
          ))}
        </UserButton.MenuItems>
      </UserButton>
    </Font>
  )
}

function Font({ children }: { children: React.ReactNode }) {
  const config = getConfig()
  return (
    <div
      style={{
        fontFamily: getVariableValue(config.fonts.body?.family),
        display: 'contents',
      }}
    >
      {children}
    </div>
  )
}

function SignUp({
  children,
  action = 'sign up',
}: {
  children?: React.ReactElement
  action?: 'sign in' | 'sign up'
}) {
  const [redirectUrl, setRedirectUrl] = useState<string>()
  const path = useCurrentPath()
  useServerEffect(() => {
    if (platform.OS === 'web') {
      setRedirectUrl(window.location.href)
    }
  }, [path])
  const Comp = action === 'sign in' ? SignInButton : SignUpButton
  return (
    <Font>
      <Comp
        mode="modal"
        key={redirectUrl}
        signInForceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      >
        {children}
      </Comp>
    </Font>
  )
}

export default makeAuth({
  useUser() {
    const { isLoaded, userId } = useAuth()
    const user = useUser()

    if (!isLoaded) return { hasLoaded: false }

    if (userId) {
      return {
        isSignedIn: true,
        userId,
        hasLoaded: true,
        userFirstName: user.user?.firstName ?? undefined,
        userLastName: user.user?.lastName ?? undefined,
        userEmail: user.user?.emailAddresses[0]?.emailAddress,
      }
    }

    return {
      hasLoaded: true,
      isSignedIn: false,
      userId: null,
      userFirstName: null,
      userLastName: null,
      userEmail: null,
    }
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
  AuthFlowTrigger({ children, action = 'sign up' }) {
    return (
      <SignedOut>
        <SignUp children={children} action={action} />
      </SignedOut>
    )
  },
  getToken,
  SignUp: ClerkSignUp,
})
