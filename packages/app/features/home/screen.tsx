import { Link } from 'app/ds/Link'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'

export function HomeScreen(props: {
  templates?: Array<{
    name: string
    html_url: string
  }>
}) {
  return (
    <View pt={100} maw={900} w="100%" als="center" px="$3" gap="$4">
      <Text>Find your next machine learning model with Params.</Text>

      {props.templates?.map((template) => {
        return (
          <View key={template.name}>
            <Link href={template.html_url} target="_blank">
              <Text textDecorationLine="underline" bold>
                {template.name}
              </Text>
            </Link>
          </View>
        )
      })}
    </View>
  )
}
