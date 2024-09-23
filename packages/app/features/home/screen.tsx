import { Auth } from 'app/auth'
import { Link } from 'app/ds/Link'
import { Text as T } from 'app/ds/Text'
import { TextLink } from 'app/ds/TextLink'
import { View } from 'app/ds/View'
import { styled } from 'app/ds/styled'
import { api } from 'app/trpc/client'
import { Platform } from 'react-native'
import { cloneElement } from 'react'
import { fakeRepos } from 'app/features/home/fakeRepos'
import { fakeRepoImages } from 'app/features/home/fakeRepoImages'

const Text = T

const fancyFontFamily = '$heading' as const

const H1 = styled(Text, {
  fontSize: 24,
  fontWeight: '500',
  fontFamily: fancyFontFamily,
})

const formatPrice = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  // zero digits
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fancy = false

const FancyButton = ({ children }: { children: React.ReactNode }) => {
  const height = 28
  return (
    <View
      px="$2"
      h={height}
      background="linear-gradient(200deg, var(--color9), var(--color5))"
      style={{
        // inner shadow
        boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.05)',
      }}
      $theme-light={{
        background: 'linear-gradient(200deg, var(--color10), var(--color12))',
      }}
      br={6}
    >
      <Text
        fontFamily={fancyFontFamily}
        fow="500"
        lineHeight={height}
        $theme-light={{ color: '$color1' }}
      >
        {children}
      </Text>
    </View>
  )
}

const Glow = ({ children }: { children: React.ReactElement }) => {
  return (
    <View>
      <View
        $theme-light={{ dsp: 'none' }}
        stretch
        filter="blur(40px) saturate(1.5)"
        transform="scale(1.3) rotate(30deg)"
      >
        {cloneElement(children)}
      </View>
      <View>{children}</View>
    </View>
  )
}

export function HomeScreen(props: {
  templates?: Array<{
    name: string
    html_url: string
  }>
}) {
  const auth = Auth.useUser()
  const signOut = Auth.useSignOut()
  const createMe = api.createMe.useMutation()
  const me = api.me.useQuery()
  const deleteMe = api.deleteMe.useMutation()

  return (
    <View bg={fancy && '$backgroundStrong'}>
      <View pt={100} maw={750} w="100%" als="center" px="$3" gap="$4">
        <View gap="$1">
          <H1>{`Discover curated machine learning starters`}</H1>
          <H1>{`& get advice from the experts who built them.`}</H1>
        </View>
        <View gap={fancy ? '$1.5' : '$4'}>
          {fakeRepos?.map((template, i) => {
            const image = fakeRepoImages[template.user_name as keyof typeof fakeRepoImages]
            const price = formatPrice.format(template.price)
            const minDigitCount = 3
            const intStr = i.toString().padStart(minDigitCount, '0')
            const imgSize = 103

            if (fancy) {
              const Text = styled(T, {
                fontFamily: fancyFontFamily,
              })

              return (
                <View
                  key={template.repo_name}
                  br={8}
                  p="$3"
                  row
                  zi={i}
                  ov="hidden"
                  // bw={2}
                  boc="$color2"
                  gap="$3"
                  backgroundImage="linear-gradient(160deg, transparent, var(--backgroundStrong), var(--color1), var(--color2))"
                  $theme-light={{
                    backgroundImage:
                      'linear-gradient(160deg, var(--color2), var(--color1), var(--color3), var(--color4))',
                  }}
                >
                  <Glow>
                    <img
                      style={{
                        width: 75,
                        height: 75,
                        display: 'inline-flex',
                        margin: 0,
                        borderRadius: 999,
                        objectFit: 'cover',
                      }}
                      src={image}
                    />
                  </Glow>
                  <View grow gap="$2">
                    <View row jbtwn>
                      <T bold>{template.repo_name}</T>

                      <T color="$color11">#{intStr}</T>
                    </View>
                    <Text>
                      by <Text bold>{template.user_name}</Text>
                    </Text>

                    <Text maxWidth={500} color="$color11">
                      {template.description}
                    </Text>

                    <View row gap="$2" mt="$2" jbtwn ai="center">
                      <FancyButton>Book a Call ({price})</FancyButton>

                      <View $theme-light={{ filter: 'invert(1)' }}>
                        <img
                          style={{
                            width: 20,
                            height: 20,
                            margin: 0,
                            display: 'block',
                          }}
                          src="https://img.icons8.com/fluent-systems-filled/200/FFFFFF/github.png"
                        />
                      </View>
                      {/* <FancyButton>view on github</FancyButton> */}
                    </View>
                  </View>
                </View>
              )
            }

            const bigImg = (
              <View key={template.repo_name}>
                <View row gap="$3" ai="flex-start">
                  <View>
                    <img
                      style={{
                        width: imgSize,
                        height: imgSize,
                        margin: 0,
                        borderRadius: '6px',
                        alignSelf: 'center',
                        objectFit: 'cover',
                      }}
                      src={image}
                    />
                  </View>

                  <View f={1}>
                    <Text color="$color11">{`#${intStr} `}</Text>
                    <Text textDecorationLine="underline" textDecorationColor="transparent">
                      <Text bold>{template.repo_name}</Text>{' '}
                    </Text>

                    <TextLink href="https://twitter.com/fchollet" target="_blank">
                      <Text>
                        by{' '}
                        <Text gap="$1" dsp="inline-flex">
                          {template.user_name}
                        </Text>
                      </Text>
                    </TextLink>
                    <Text mt="$1">
                      <Text color="blue" textDecorationLine="underline" mt="$2">
                        schedule a call {price}
                      </Text>{' '}
                    </Text>
                    <Text textDecorationLine="underline">view on github</Text>
                  </View>
                </View>

                <View gap="$3" row dsp="none">
                  <View w={imgSize} />
                  <View>
                    <TextLink href="https://twitter.com/fchollet" target="_blank">
                      <Text textDecorationLine="underline" gap="$1" dsp="inline-flex">
                        by {template.user_name}
                      </Text>
                    </TextLink>
                    <View row>
                      <Text color="blue" textDecorationLine="underline">
                        schedule a call ${price}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )
            return bigImg
          })}
          {/* {props.templates?.map((template, i) => {
            return (
              <View key={template.name}>
                <Text textDecorationLine="underline" textDecorationColor="transparent">
                  <Text color="$color11">{`#00${i + 1} `}</Text>
                  <TextLink href={template.html_url} target="_blank">
                    <Text textDecorationLine="underline" bold color="blue">
                      {template.name}
                    </Text>
                  </TextLink>{' '}
                  by{' '}
                  <TextLink href="https://twitter.com/fchollet" target="_blank">
                    <Text textDecorationLine="underline" gap="$1" dsp="inline-flex">
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
          })} */}
        </View>

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
            ) : (
              <button onClick={() => deleteMe.mutate()}>Delete Me</button>
            )}
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
