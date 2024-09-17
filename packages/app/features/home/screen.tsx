import { Link } from 'app/ds/Link'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Platform } from 'react-native'

export function HomeScreen(props: {
  templates?: Array<{
    name: string
    html_url: string
  }>
}) {
  return (
    <View>
      <View p="$3" bbw={1} boc="$borderColor" row jbtwn ai="center">
        <Text>(params)</Text>

        <Text>Login</Text>
      </View>
      <View pt={100} maw={900} w="100%" als="center" px="$3" gap="$4">
        <View gap="$1">
          <h1>Params</h1>
          <Text>{`A curated collection of machine learning starter templates.`}</Text>
        </View>
        {props.templates?.map((template, i) => {
          return (
            <View key={template.name}>
              <Link href={template.html_url} target="_blank">
                <Text>
                  <Text
                    textDecorationLine="underline"
                    textDecorationColor="transparent"
                  >{`00${i + 1} `}</Text>
                  <Text textDecorationLine="underline" bold>
                    {template.name}
                  </Text>
                </Text>
              </Link>
            </View>
          )
        })}
      </View>
    </View>
  )
}
