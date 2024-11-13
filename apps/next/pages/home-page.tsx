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

export default function Home() {
  return (
    <View>
      {/* Background gradient */}
      <View
        zi={-1}
        stretch
        ov="hidden"
        o={0.15}
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
          m: '$4',
          gap: '$4',
        }}
      >
        <View>
          <Text fontSize={40} fontWeight="500" letterSpacing={'-0.03em'} lineHeight={'1.3em'}>
            Find curated ML templates
            {'\n'}& book a call with the creators
          </Text>
        </View>

        <View gap="$4">
          {/* François's Template Card */}
          <View>
            <View $gtSm={{ row: 'reverse' }} br="$4" bw={1} boc="$borderColor" ov="hidden">
              <View animation="quick" o={0.25} stretch zi={0} bg="$gray11" themeInverse />

              <View p="$3" $gtSm={{ f: 1, p: '$4' }} gap="$4">
                <View>
                  <Card.Title>@francois/recommendation-system</Card.Title>
                  <Card.Description>
                    A scalable recommendation engine built with TensorFlow, featuring collaborative
                    filtering, content-based filtering, and hybrid approaches. Includes pre-trained
                    models and example datasets.
                  </Card.Description>
                </View>

                <View row ai="center" gap="$2">
                  <View box={8} br={999} bg="$green10" />
                  <Text color="$color11">Production-ready</Text>
                  <Text color="$color11">•</Text>
                  <Text color="$color11">Updated 2 days ago</Text>
                </View>

                <View mt="auto" row jc="flex-end">
                  <Button>
                    <ButtonText>View Repo</ButtonText>
                    <ButtonIcon icon={Lucide.ChevronRight} />
                  </Button>
                </View>
              </View>

              <View
                p="$3"
                ov="hidden"
                $gtSm={{
                  maw: 400,
                  p: '$4',
                  br: '$4',
                  m: '$1',
                  boc: '$borderColor',
                  jc: 'space-between',
                }}
                gap="$4"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
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
                {/* <View theme="light" o={0.15} stretch zi={0} bg="$color2" /> */}
                <View row gap="$4" ai="center">
                  {/* <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg"
                    width={96}
                    height={96}
                    alt="François Chollet"
                    style={{ borderRadius: 999 }}
                  /> */}
                  <View>
                    <Text fontWeight="600">François Chollet</Text>
                    <Text color="$color11">AI Researcher at Google</Text>
                  </View>
                </View>

                <View gap="$2">
                  <Button>
                    <ButtonText>View Profile</ButtonText>
                  </Button>

                  <Button themeInverse>
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
