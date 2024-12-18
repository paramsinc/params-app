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
import { useDashboardLinks } from 'app/features/web-layout/useDashboardLinks'
import { dark, neobrutalism } from '@clerk/themes'
import { useThemeName } from 'app/ds/useThemeName'
import { Lucide } from 'app/ds/Lucide'

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
  if (links.isPending) return null
  return (
    <Font>
      <UserButton>
        {children}
        <UserButton.MenuItems>
          <UserButton.Link
            label="Dashboard"
            href="/dashboard"
            labelIcon={<Lucide.Database size={16} color="var(--accent)" />}
          />
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
  const path = useCurrentPath()

  const [redirectUrl = path, setRedirectUrl] = useState<string>()
  useServerEffect(() => {
    setRedirectUrl(window.location.pathname + window.location.search)
  }, [path])
  if (action === 'sign in') {
    return (
      <SignInButton
        mode="modal"
        key={redirectUrl + 'sign_in'}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
      >
        {children}
      </SignInButton>
    )
  }
  return (
    <SignUpButton
      mode="modal"
      key={redirectUrl + 'sign_up'}
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
    >
      {children}
    </SignUpButton>
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
    const theme = useThemeName()
    const isDark = theme === 'dark'
    console.log('[clerk-auth][theme]', isDark)
    const path = useCurrentPath()
    return (
      <ClerkProvider
        publishableKey={env.CLERK_PUBLISHABLE_KEY!}
        Clerk={clerk}
        signInFallbackRedirectUrl={path}
        signUpFallbackRedirectUrl={path}
        appearance={{
          baseTheme: dark,
        }}
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
