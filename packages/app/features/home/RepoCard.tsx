import TextLink from 'app/ds/TextLink/link'
import { View } from 'app/ds/View'
import { fakeRepoImages } from 'app/features/home/fakeRepoImages'
import { fakeRepos } from 'app/features/home/fakeRepos'
import { formatPrice } from 'app/features/home/screen'
import { Text } from 'app/ds/Text'

export function RepoCard({ template, i }: { template: (typeof fakeRepos)[number]; i: number }) {
  const image = fakeRepoImages[template.user_name as keyof typeof fakeRepoImages]
  const price = formatPrice.format(template.price)
  const minDigitCount = 3
  const intStr = i.toString().padStart(minDigitCount, '0')
  const imgSize = 103
  return (
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
            <Text color="$blue10" textDecorationLine="underline" mt="$2">
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
}
