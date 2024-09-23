import { Header } from 'app/ds/Header'
import { Logo } from 'app/ds/Logo'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'

export function GlobalWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header p="$2" bg="$color1">
        <View w="100%" maw={'$space.marketingPageWidth'} als="center" ai="center">
          <Logo size={120} />
        </View>
      </Header>
      {children}
    </>
  )
}
