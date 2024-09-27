import { Auth } from 'app/auth'
import { Button, ButtonText } from 'app/ds/Button'
import { Empty, EmptyCard, EmptyCardTitle } from 'app/ds/Empty'
import { ErrorCard } from 'app/ds/Error/card'
import { Link } from 'app/ds/Link'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { api } from 'app/trpc/client'
import { useRouter } from 'next/router'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouter().pathname
  const links = [
    {
      label: 'Profiles',
      href: '/dashboard/profiles',
      isActive: pathname.startsWith('/dashboard/profiles'),
    },
  ]
  const { hasLoaded, isSignedIn } = Auth.useUser()
  return (
    <>
      {hasLoaded && (
        <>
          {isSignedIn ? (
            <>
              <View bbw={1} boc="$borderColor">
                {links.map((link) => (
                  <Link href={link.href} key={link.href}>
                    <View py="$2" px="$3">
                      <Text
                        bold
                        textDecorationLine="underline"
                        textDecorationColor={link.isActive ? '$color12' : 'transparent'}
                      >
                        {link.label}
                      </Text>
                    </View>
                  </Link>
                ))}
              </View>
              <MeGate>{children}</MeGate>
            </>
          ) : (
            <Empty>
              <EmptyCard>
                <EmptyCardTitle>Please sign in to continue.</EmptyCardTitle>
                <Auth.AuthFlowTrigger>
                  <Button themeInverse>
                    <ButtonText>Sign in</ButtonText>
                  </Button>
                </Auth.AuthFlowTrigger>
              </EmptyCard>
            </Empty>
          )}
        </>
      )}
    </>
  )
}

const MeGate = ({ children }: { children: React.ReactNode }) => {
  const me = api.me.useQuery()
  const createMe = api.createMe.useMutation()

  if (me.data) {
    return <>{children}</>
  }
  if (me.data === undefined) return null // loading

  // only renders if our auth webhook failed to cerate
  return (
    <Empty>
      <EmptyCard>
        <EmptyCardTitle>Ready to get started?</EmptyCardTitle>

        <ErrorCard error={createMe.error} />

        <Button themeInverse onPress={() => createMe.mutate()} loading={createMe.isPending}>
          <ButtonText>Continue</ButtonText>
        </Button>
      </EmptyCard>
    </Empty>
  )
}
