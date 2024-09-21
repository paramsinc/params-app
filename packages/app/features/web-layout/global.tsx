import { Header } from 'app/ds/Header'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'

export function GlobalWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header p="$2" bg="$color2">
        <View w="100%" maw={'$space.marketingPageWidth'} als="center">
          <Text fontFamily="$heading" bold center>
            (params)
          </Text>
        </View>
      </Header>
      {children}
    </>
  )
}
