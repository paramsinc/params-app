import { Auth } from 'app/auth'
import { Link } from 'app/ds/Link'
import { Text } from 'app/ds/Text'
import { TextLink } from 'app/ds/TextLink'
import { View } from 'app/ds/View'
import { styled } from 'app/ds/styled'
import { api } from 'app/trpc/client'
import { Platform } from 'react-native'

const H1 = styled(Text, {
  fontSize: 24,
  fontWeight: '500',
  fontFamily: 'circular std',
})

export function HomeScreen(props: {
  templates?: Array<{
    name: string
    html_url: string
  }>
}) {
  const auth = Auth.useUser()
  const signOut = Auth.useSignOut()
  const home = api.hello.useQuery()
  const createMe = api.createMe.useMutation()
  const me = api.me.useQuery()

  return (
    <View>
      <View pt={100} maw={900} w="100%" als="center" px="$3" gap="$4">
        <Text>(params)</Text>
        <View gap="$1">
          <H1>{`Discover curated machine learning starters`}</H1>
          <H1>{`& get advice from the experts who built them.`}</H1>
        </View>
        <View>
          {props.templates?.map((template, i) => {
            return (
              <View key={template.name}>
                <Text
                  textDecorationLine="underline"
                  textDecorationColor="transparent"
                >
                  <Text color="$color11">{`#00${i + 1} `}</Text>
                  <TextLink href={template.html_url} target="_blank">
                    <Text textDecorationLine="underline" bold color="blue">
                      {template.name}
                    </Text>
                  </TextLink>{' '}
                  by{' '}
                  <TextLink href="https://twitter.com/fchollet" target="_blank">
                    <Text
                      textDecorationLine="underline"
                      gap="$1"
                      dsp="inline-flex"
                    >
                      <span>Francois Chollet</span>
                      <img
                        style={{
                          width: 20,
                          height: 20,
                          display: 'inline-flex',
                          margin: 0,
                          borderRadius: 6,
                          alignSelf: 'center',
                        }}
                        src="https://pbs.twimg.com/profile_images/1611009368765468673/lLWbGjjj_400x400.jpg"
                      />
                    </Text>
                  </TextLink>
                </Text>
              </View>
            )
          })}
        </View>

        {JSON.stringify(home.data)}

        {auth.hasLoaded && auth.isSignedIn ? (
          <>
            <Auth.UserButton />
            {me.data === null ? (
              <button
                onClick={() =>
                  createMe.mutate({
                    first_name: 'Fernando',
                    last_name: 'Rojo',
                    email: 'fernando@params.com',
                    slug: 'fernando-rojo',
                  })
                }
              >
                {createMe.isPending ? `Creating...` : `Create Me`}
              </button>
            ) : null}
          </>
        ) : (
          <Auth.AuthFlowTrigger>Sign in</Auth.AuthFlowTrigger>
        )}

        {/* <View row ai="center" gap="$2">
          <Text color="$color11">Become a Contributor</Text>
        </View> */}
      </View>
    </View>
  )
}
