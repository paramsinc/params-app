'use client'
import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { Card } from 'app/ds/Form/layout'
import { Logo } from 'app/ds/Logo'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'
import { Link } from 'app/ds/Link'
import { Theme } from 'app/ds/Theme'
import { LinkButton } from 'app/ds/Button/link'
import { styled } from 'app/ds/styled'

const Heading = styled(Text, {
  fontFamily: '$heading',
  fontWeight: '500',
})

const H1 = styled(Heading, {
  letterSpacing: '-0.035em',
  tag: 'h1',
  fontSize: 24,

  //   $gtXs: {
  //     fontSize: 24,
  //   },
  $gtSm: {
    fontSize: 32,
  },
  $gtMd: {
    fontSize: 40,
  },
  $gtLg: {
    fontSize: 48,
  },
  $gtXl: {
    fontSize: 64,
  },
})

const H2 = styled(Heading, {
  letterSpacing: '-0.025em',
  tag: 'h2',
  fontSize: 20,

  $gtXs: {
    fontSize: 20,
  },
  $gtSm: {
    fontSize: 24,
  },
  $gtMd: {
    fontSize: 32,
  },
})

export default function Home() {
  return (
    <View>
      {/* Background gradient */}
      <View
        zi={0}
        stretch
        ov="hidden"
        o={0.25}
        $theme-light={{ opacity: 0.4 }}
        style={{
          backgroundImage: `
            radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
            radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
            radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
            radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
            radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
            radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
            radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
          `,
          filter: 'blur(100px) saturate(150%)',
        }}
      />

      <View
        p="$4"
        maw={1200}
        als="center"
        gap="$6"
        w="100%"
        mt="$6"
        $sm={{
          mt: '$5',
          gap: '$5',
        }}
      >
        <View>
          <H1>
            Find curated ML templates
            {'\n'}& book a call with the creators
          </H1>
        </View>

        <View gap="$3" $gtSm={{ gap: '$4' }}>
          {/* François's Template Card */}
          <H2>Build a recommendation system</H2>
          <View>
            <View
              $gtSm={{ row: 'reverse' }}
              br="$4"
              style={{
                boxShadow: `
                    0px 2px 4px rgba(0, 0, 0, 0.02),
                    0px 4px 8px rgba(0, 0, 0, 0.02),
                    inset 0px 1px 1px rgba(255, 255, 255, 0.04),
                    inset 0px -1px 1px rgba(0, 0, 0, 0.02)
                  `,
              }}
              ov="hidden"
            >
              <View animation="quick" o={0.25} stretch zi={0} bg="$color11" themeInverse />

              <View p="$3" $gtSm={{ f: 1, p: '$4', jbtwn: true }} gap="$4">
                <View gap="$2">
                  <Card.Title fontFamily="$mono">@francois/recommendation-system</Card.Title>
                  <Card.Description>
                    A scalable recommendation engine built with TensorFlow, featuring collaborative
                    filtering, content-based filtering, and hybrid approaches. Includes pre-trained
                    models and example datasets.
                  </Card.Description>
                </View>
                <View row="wrap" jbtwn ai="center" gap="$2">
                  <View row ai="center" gap="$2">
                    <View box={8} br={999} bg="$green10" />
                    <Text color="$color11">Production-ready</Text>
                    <View box={8} br={999} bg="$purple10" />
                    <Text color="$color11">Open Source</Text>
                  </View>

                  <View mt="auto" row jc="flex-end">
                    <LinkButton href={`/@francois/recommendation-system`}>
                      <ButtonText>View Repo</ButtonText>
                      <ButtonIcon icon={Lucide.ChevronRight} />
                    </LinkButton>
                  </View>
                </View>
              </View>

              <View
                p="$3"
                ov="hidden"
                $gtSm={{
                  w: 450,
                  p: '$4',
                  br: '$4',
                  m: '$1',
                  boc: '$borderColor',
                  jc: 'space-between',
                }}
                gap="$4"
                style={{
                  boxShadow: `
                    0px 2px 4px rgba(0, 0, 0, 0.02),
                    0px 4px 8px rgba(0, 0, 0, 0.02),
                    inset 0px 1px 1px rgba(255, 255, 255, 0.04),
                    inset 0px -1px 1px rgba(0, 0, 0, 0.02)
                  `,
                  //   backdropFilter: 'blur(10px)',
                  //   WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <View
                  //   themeInverse
                  theme="light"
                  o={0.15}
                  stretch
                  zi={0}
                  bg="$color2"
                  $theme-light={{ bg: '$color3' }}
                  animation="200ms"
                />
                {/* <View theme="light" o={0.15} stretch zi={0} bg="$color2" /> */}
                <View row ai="center" gap="$3">
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg"
                    unoptimized
                    width={96}
                    height={96}
                    alt="François Chollet"
                    style={{ borderRadius: 999 }}
                  />
                  {/* <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg"
                    width={96}
                    height={96}
                    alt="François Chollet"
                    style={{ borderRadius: 999 }}
                  /> */}
                  <View flex={1}>
                    <Text fontWeight="600">François Chollet</Text>
                    <Text color="$color11">
                      AI @ Google, Creator of Keras, Cofounder of ARC Prize
                    </Text>
                  </View>
                </View>

                <View gap="$1" row enterStyle={{ o: 0, y: 10 }} y={0} o={1} animation="200ms">
                  <LinkButton grow href={`/@francois`}>
                    <ButtonIcon icon={Lucide.Armchair} />
                    <ButtonText>View Profile</ButtonText>
                  </LinkButton>

                  <Button grow themeInverse>
                    <ButtonIcon icon={Lucide.PhoneCall} />
                    <ButtonText>Book a Call</ButtonText>
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
