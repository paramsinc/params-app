import { Auth } from 'app/auth'
import { Button, ButtonText } from 'app/ds/Button'
import { Empty, EmptyCard, EmptyCardTitle } from 'app/ds/Empty'
import { ErrorCard } from 'app/ds/Error/card'
import { Link } from 'app/ds/Link'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { api } from 'app/trpc/client'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { usePrevious } from 'app/helpers/use-previous'
import { Page } from 'app/ds/Page'
import { StyleSheet } from 'react-native'
import { Header } from 'app/ds/Header'
import { useDashboardLinks } from 'app/features/web-layout/useDashboardLinks'
import { UserGate } from 'app/features/user/gate'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouter().pathname

  const { hasLoaded, isSignedIn } = Auth.useUser()
  const links = useDashboardLinks()
  const activeIndex = links.findIndex((link) => link.isActive)
  const prevActiveIndex = usePrevious(activeIndex)
  return (
    <>
      <Header group bbw={StyleSheet.hairlineWidth} bbc="$borderColor">
        <Page.ContentWidthComponent row>
          {links.map((link, i) => (
            <View key={link.href} zi={1}>
              <Link href={link.href}>
                <View py="$2" px="$2" containerType="normal" group={`link` as any}>
                  {link.isActive && (
                    <motion.div
                      layoutId="active-tab"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background: 'var(--color3)',
                        borderTopLeftRadius: 'var(--t-radius-3)',
                        borderTopRightRadius: 'var(--t-radius-3)',
                        zIndex: -1,
                        boxShadow: `
                    inset 0px 1px 0px var(--color4),
                    inset 0px 8px 16px var(--color2),
                    inset 1px 0px 0px var(--color5),
                    inset -1px 0px 0px var(--color5)
                  `,
                        overflow: 'hidden',
                      }}
                    />
                  )}
                  <Text
                    bold
                    zIndex={1}
                    textDecorationLine="underline"
                    textDecorationColor="transparent"
                    {...{
                      [`$group-link-hover`]: {
                        textDecorationColor: '$color',
                      },
                    }}
                  >
                    {link.label}
                  </Text>
                </View>
              </Link>
            </View>
          ))}
        </Page.ContentWidthComponent>
      </Header>
      {hasLoaded && (
        <UserGate>
          <>{children}</>
        </UserGate>
      )}
    </>
  )
}

const MeGate = ({ children }: { children: React.ReactNode }) => {
  const auth = Auth.useUser()
  const me = api.me.useQuery(undefined, {
    enabled: auth.isSignedIn,
  })
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

        <Button themeInverse onPress={() => createMe.mutate({})} loading={createMe.isPending}>
          <ButtonText>Continue</ButtonText>
        </Button>
      </EmptyCard>
    </Empty>
  )
}
