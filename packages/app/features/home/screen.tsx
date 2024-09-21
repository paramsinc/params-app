import { Auth } from 'app/auth'
import { Link } from 'app/ds/Link'
import { Text as T } from 'app/ds/Text'
import { TextLink } from 'app/ds/TextLink'
import { View } from 'app/ds/View'
import { styled } from 'app/ds/styled'
import { api } from 'app/trpc/client'
import { Platform } from 'react-native'
import { cloneElement } from 'react'

const Text = T

const fancyFontFamily = '$heading' as const

const H1 = styled(Text, {
  fontSize: 24,
  fontWeight: '500',
  fontFamily: fancyFontFamily,
})

const models = [
  {
    user_name: 'Francois Chollet',
    repo_name: 'recommendation-system',
    price: 1500,
    description:
      'A recommendation system starter that leverages matrix factorization and deep learning techniques for precise recommendations.',
  },
  {
    user_name: 'Francois Chollet',
    repo_name: 'image-classification',
    price: 1500,
    description:
      'Template for image classification using convolutional networks. Optimized for ease of use and quick adaptation to new datasets.',
  },
  {
    user_name: 'Mike Knoop',
    repo_name: 'object-detection',
    price: 1300,
    description:
      'An object detection model employing region proposal networks. Tuned for high accuracy and real-time performance.',
  },
  {
    user_name: 'Jeremy Berman',
    repo_name: 'ocr',
    price: 600,
    description:
      'Optical character recognition starter that supports multi-language text extraction, utilizing sequence-to-sequence architectures.',
  },
  {
    user_name: 'Andrej Karpathy',
    repo_name: 'self-supervised-learning',
    price: 1300,
    description:
      'A framework for self-supervised learning designed to build representations from unlabeled data using contrastive methods.',
  },
  {
    user_name: 'Fernando Rojo',
    repo_name: 'graph-neural-networks',
    price: 550,
    description:
      'Graph neural network template for learning from relational data. Built for tasks like node classification and link prediction.',
  },
  {
    user_name: 'Sara Hooker',
    repo_name: 'fairness-audit',
    price: 500,
    description:
      'A toolkit for auditing model fairness, providing metrics and methods to identify and mitigate bias across various datasets.',
  },
  {
    user_name: 'Jeremy Berman',
    repo_name: 'nlp-sentiment-analysis',
    price: 600,
    description:
      'Sentiment analysis model based on transformer architecture. Pre-trained for text classification and easy to fine-tune.',
  },
  {
    user_name: 'Fernando Rojo',
    repo_name: 'language-modeling',
    price: 550,
    description:
      'Language modeling starter built on recurrent networks, ideal for sequence generation tasks like autocomplete and text generation.',
  },
  {
    user_name: 'Sara Hooker',
    repo_name: 'autoencoder-anomaly-detection',
    price: 500,
    description:
      'Autoencoder-based anomaly detection system for unsupervised learning. Well-suited for outlier detection in complex datasets.',
  },
  {
    user_name: 'Mike Knoop',
    repo_name: 'rag',
    price: 1300,
    description:
      'A retrieval-augmented generation framework combining search techniques with generative models for question-answering tasks.',
  },
  {
    user_name: 'Jeremy Howard',
    repo_name: 'audio-classification',
    price: 1000,
    description:
      'Audio classification model leveraging spectrogram inputs and deep learning. Suitable for sound event detection and music classification.',
  },
  {
    user_name: 'Andrej Karpathy',
    repo_name: 'video-action-recognition',
    price: 1300,
    description:
      'A model for video action recognition using 3D convolutional networks. Designed for temporal data processing in video streams.',
  },
  {
    user_name: 'Hugo Larochelle',
    repo_name: 'reinforcement-learning',
    price: 900,
    description:
      'Reinforcement learning starter kit using policy gradient methods. Adaptable for environments requiring decision-making policies.',
  },
  {
    user_name: 'Geoffrey Hinton',
    repo_name: 'deep-belief-network',
    price: 1400,
    description:
      'A deep belief network template for hierarchical learning of features. Optimized for unsupervised pre-training and classification.',
  },
  {
    user_name: 'Hugo Larochelle',
    repo_name: 'unsupervised-representation-learning',
    price: 900,
    description:
      'Unsupervised learning framework that builds latent representations through autoencoders and variational techniques.',
  },
  {
    user_name: 'Yoshua Bengio',
    repo_name: 'generative-adversarial-network',
    price: 1450,
    description:
      'GAN template for generating synthetic data, employing adversarial training to create high-fidelity images or other content.',
  },
  {
    user_name: 'Jeremy Howard',
    repo_name: 'vision-transformer',
    price: 1000,
    description:
      'Vision transformer starter built to process images without convolutions, enabling efficient learning on high-resolution inputs.',
  },
  {
    user_name: 'Yoshua Bengio',
    repo_name: 'transformer-qa',
    price: 1450,
    description:
      'Transformer-based model for question-answering tasks, leveraging attention mechanisms to extract answers from large corpora.',
  },
  {
    user_name: 'Geoffrey Hinton',
    repo_name: 'capsule-networks',
    price: 1400,
    description:
      'Capsule network starter that preserves spatial hierarchies within data. Effective for detecting part-whole relationships in images.',
  },
]

const prices = new Map<string, number>()

const getPrice = (user_name: string): number => {
  if (prices.has(user_name)) {
    return prices.get(user_name)!
  }
  // something between 300 and 1200, rounded to the nearest 50
  const price = Math.round((Math.random() * 900 + 300) / 50) * 50
  prices.set(user_name, price)
  return price
}

const images = {
  'Mike Knoop': 'https://pbs.twimg.com/profile_images/1800408200229113856/4hvnirWk_400x400.jpg',
  'Francois Chollet': 'https://media.intro.co/avatars/552590KI_iE22H.jpg',
  'Jeremy Berman': 'https://pbs.twimg.com/profile_images/1717254564930347008/jp9Mn1hY_400x400.jpg',
  'Fernando Rojo': 'https://pbs.twimg.com/profile_images/1182392379761987591/9XPy4NfP_400x400.jpg',
  'Sara Hooker': 'https://pbs.twimg.com/profile_images/1403376500192071683/zvr_Hkox_400x400.jpg',
  'Andrej Karpathy': 'https://karpathy.ai/assets/me_new.jpg',
  'Jeremy Howard': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Jeremy_Howard.jpg',
  'Hugo Larochelle': 'https://pbs.twimg.com/profile_images/690922518450999299/P_ysEBaS_400x400.png',
  'Yoshua Bengio':
    'https://mila.quebec/sites/default/files/styles/member_full/public/member/5139/portrait-of-yoshua-bengio.jpg.webp?itok=uJTLJmwn',
  'Geoffrey Hinton': 'https://e3.365dm.com/21/03/2048x1152/skynews-geoffrey-hinton_5309331.jpg',
}

const formatPrice = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  // zero digits
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fancy = true

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
        <Text>(params)</Text>
        <View gap="$1">
          <H1>{`Discover curated machine learning starters`}</H1>
          <H1>{`& get advice from the experts who built them.`}</H1>
        </View>
        <View gap={fancy ? '$1.5' : '$4'}>
          {models?.map((template, i) => {
            const image = images[template.user_name as keyof typeof images]
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
            return (
              <View key={template.repo_name} row>
                <Text color="$color11">{`#${intStr} `}</Text>
                <View grow>
                  <Text textDecorationLine="underline" textDecorationColor="transparent">
                    <Text textDecorationLine="underline" bold>
                      {template.repo_name}
                    </Text>{' '}
                    by{' '}
                    <TextLink href="https://twitter.com/fchollet" target="_blank">
                      <Text textDecorationLine="underline" gap="$1" dsp="inline-flex">
                        <span>{template.user_name}</span>
                        <img
                          style={{
                            width: 21,
                            height: 21,
                            display: 'inline-flex',
                            margin: 0,
                            borderRadius: 6,
                            alignSelf: 'center',
                            objectFit: 'cover',
                          }}
                          src={image}
                        />
                      </Text>
                    </TextLink>
                  </Text>
                  <View row>
                    <Text color="blue" textDecorationLine="underline">
                      schedule a call ${price}
                    </Text>
                  </View>
                </View>
              </View>
            )
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
