'use client'
import { Auth } from 'app/auth'
import { Header } from 'app/ds/Header'
import { Logo } from 'app/ds/Logo'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'

export function GlobalWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header ai="center" height={48} px="$3" bg="$color1" fd="row">
        <View w={100}></View>
        <View grow center>
          <Logo size={120} />
        </View>
        <View w={100} ai="flex-end">
          <Auth.UserButton />
        </View>
      </Header>
      {children}
    </>
  )
}
