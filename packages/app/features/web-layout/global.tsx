'use client'
import { Auth } from 'app/auth'
import { Header } from 'app/ds/Header'
import { Link } from 'app/ds/Link'
import { Logo } from 'app/ds/Logo'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { useCurrentPath } from 'app/navigation/use-pathname'
import { useScroll, motion } from 'framer-motion'

export function GlobalWebLayout({
  children,
  hideHeader,
}: {
  children: React.ReactNode
  hideHeader?: boolean
}) {
  const pathname = useCurrentPath()
  const { scrollY } = useScroll()
  return (
    <>
      {!hideHeader && (
        <motion.header>
          <View
            ai="center"
            height={48}
            px="$3"
            // bg="$backgroundStrong"
            bg="#00000020"
            fd="row"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 3,
              backdropFilter: 'blur(10px)',
              transform: 'translate3d(0, 0, 0)',
            }}
            $theme-light={{
              bg: '#ffffff20',
            }}
          >
            <View w={100}></View>
            <View flex={1} center>
              <Link href="/">
                <Logo height={20} />
              </Link>
            </View>
            <View
              w={100}
              ai="flex-end"
              jc="center"
              pointerEvents={pathname === '/' ? 'none' : 'auto'}
              o={pathname === '/' ? 0 : 1}
            >
              <Auth.UserButton />
            </View>
          </View>
        </motion.header>
      )}
      {children}
    </>
  )
}
