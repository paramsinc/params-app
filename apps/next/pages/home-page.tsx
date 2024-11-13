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
import { Page } from 'app/ds/Page'

const Heading = styled(Text, {
  fontFamily: '$heading',
  fontWeight: '500',
  zi: 0,
})

const H1 = styled(Heading, {
  letterSpacing: '-0.035em',
  tag: 'h1',
  fontSize: 24,

  //   $gtXs: {
  //     fontSize: 24,
  //   },
  $gtSm: {
    fontSize: 40,
  },
  $gtMd: {
    fontSize: 48,
  },
  $gtLg: {
    fontSize: 64,
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
    <Page.Root>
      {/* Background gradient */}
      <View
        zi={0}
        stretch
        ov="hidden"
        filter="blur(100px) saturate(150%)"
        o={0.25}
        $theme-light={{ opacity: 0.4 }}
        backgroundImage={`
    radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
    radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
    radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
    radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
    radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
    radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
    radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
          `}
        pointerEvents="none"
        overflow="visible"
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
          p: '$3',
        }}
      >
        <View>
          <H1>
            Find curated ML templates
            {'\n'}& book a call with the creators
          </H1>
        </View>

        <View gap="$3" $gtSm={{ gap: '$4' }}>
          {/* Use Case #1: recommendation system */}
          <H2>Build a recommendation system</H2>
          <View zi={2}>
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
              <View
                animation="quick"
                o={0.25}
                stretch
                zi={0}
                bg="$gray1Light"
                $theme-light={{ bg: '$gray2Light' }}
              />

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
                    {/* <View box={8} br={999} bg="$green10" />
                    <Text color="$color11">Production-ready</Text>
                    <View box={8} br={999} bg="$purple10" />
                    <Text color="$color11">Open Source</Text> */}
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
                  o={0.15}
                  stretch
                  zi={0}
                  bg="$gray2Light"
                  $theme-light={{ bg: '$gray1Light' }}
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
                  <View flex={1} gap="$2">
                    <Text fontWeight="600">François Chollet</Text>
                    <Text>AI @ Google, Creator of Keras, Cofounder of ARC Prize</Text>
                    <View row gap="$3">
                      <Link href="https://github.com/fchollet" target="_blank">
                        <Lucide.Github size={16} />
                      </Link>
                      <Link href="https://x.com/fchollet" target="_blank">
                        <TwitterIcon width={16} height={16} stroke="var(--color)" />
                      </Link>
                      <Link href="https://linkedin.com/in/fchollet" target="_blank">
                        <Lucide.Linkedin size={16} />
                      </Link>
                    </View>
                  </View>
                </View>

                <View gap="$1" row enterStyle={{ o: 0 }} o={1} animation="200ms">
                  <LinkButton grow href={`/@francois`}>
                    <ButtonText>Profile</ButtonText>
                  </LinkButton>

                  <LinkButton grow themeInverse href={`/book/francois`}>
                    <ButtonText>Book a Call</ButtonText>
                  </LinkButton>
                </View>
              </View>
            </View>
          </View>

          <View />

          {/* Use Case #2: churn prediction */}
          <H2>Build a churn prediction model</H2>
          <View zi={2}>
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
              <View
                animation="quick"
                o={0.25}
                stretch
                zi={0}
                bg="$gray2Light"
                $theme-light={{ bg: '$gray1Light' }}
              />

              <View p="$3" $gtSm={{ f: 1, p: '$4', jbtwn: true }} gap="$4">
                <View gap="$2">
                  <Card.Title fontFamily="$mono">@jeremy/churn</Card.Title>
                  <Card.Description>
                    Production-grade churn prediction using transformers. Features sequence modeling
                    of user events, time-aware attention mechanisms, and automated feature
                    engineering. Includes pre-built data pipelines and evaluation framework.
                  </Card.Description>
                </View>
                <View row="wrap" jbtwn ai="center" gap="$2">
                  <View row ai="center" gap="$2">
                    {/* <View box={8} br={999} bg="$green10" />
                    <Text color="$color11">Production-ready</Text>
                    <View box={8} br={999} bg="$purple10" />
                    <Text color="$color11">Open Source</Text> */}
                  </View>

                  <View mt="auto" row jc="flex-end">
                    <LinkButton href={`/@jeremy/churn`}>
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
                  o={0.15}
                  stretch
                  zi={0}
                  bg="$gray2Light"
                  $theme-light={{ bg: '$gray1Light' }}
                />
                <View row ai="center" gap="$3">
                  <Image
                    src="https://pbs.twimg.com/profile_images/1856206784458883072/6q8Vrp59_400x400.jpg"
                    unoptimized
                    width={96}
                    height={96}
                    alt="Jeremy Berman"
                    style={{ borderRadius: 999 }}
                  />
                  <View flex={1} gap="$2">
                    <Text fontWeight="600">Jeremy Berman</Text>
                    <Text>AI @ Params, Previously Cofounder @ BeatGig</Text>
                    <View row gap="$3">
                      <Link href="https://github.com/jerber" target="_blank">
                        <Lucide.Github size={16} />
                      </Link>
                      <Link href="https://x.com/jerber888" target="_blank">
                        <TwitterIcon width={16} height={16} stroke="var(--color)" />
                      </Link>
                      <Link href="https://linkedin.com/in/jeremyberman1" target="_blank">
                        <Lucide.Linkedin size={16} />
                      </Link>
                    </View>
                  </View>
                </View>

                <View gap="$1" row enterStyle={{ o: 0 }} o={1} animation="200ms">
                  <LinkButton grow href={`/@jeremy`}>
                    <ButtonText>Profile</ButtonText>
                  </LinkButton>

                  <LinkButton grow themeInverse href={`/book/jeremy`}>
                    <ButtonText>Book a Call</ButtonText>
                  </LinkButton>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Page.Root>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}
