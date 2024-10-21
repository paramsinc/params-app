'use client'
import { Auth } from 'app/auth'
import { Header } from 'app/ds/Header'
import { Logo } from 'app/ds/Logo'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { useCurrentPath } from 'app/navigation/use-pathname'

export function GlobalWebLayout({
  children,
  hideHeader,
}: {
  children: React.ReactNode
  hideHeader?: boolean
}) {
  const pathname = useCurrentPath()
  return (
    <>
      {!hideHeader && (
        <Header
          ai="center"
          height={48}
          px="$3"
          // bg="$color1"
          fd="row"
          style={{ position: 'sticky', top: 0, zIndex: 3 }}
        >
          <View w={100}></View>
          <View grow center>
            <Logo height={20} />
          </View>
          {pathname !== '/' && (
            <View
              w={100}
              ai="flex-end"
              jc="center"
              pointerEvents={pathname !== '/' ? 'none' : 'auto'}
              o={pathname !== '/' ? 0 : 1}
            >
              <Auth.UserButton />
            </View>
          )}
        </Header>
      )}
      {children}
    </>
  )
}
