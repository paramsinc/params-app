import { Card } from 'app/ds/Form/layout'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'
import { Link } from 'app/ds/Link'
import { LinkButton } from 'app/ds/Button/link'
import { ButtonText, ButtonIcon } from 'app/ds/Button'
import { TwitterIcon } from './TwitterIcon'
import { styled } from 'app/ds/styled'
import { Heading } from 'app/features/home/Heading'

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

interface RepoCardSectionProps {
  title: string
  repoSlug: string
  description: string
  profileImage: string | null
  authorName: string
  authorBio: string
  socialLinks: {
    github: string
    twitter: string
    linkedin: string
  }
  profileSlug: string
}

export function RepoCardSection({
  title,
  repoSlug,
  description,
  profileImage,
  authorName,
  authorBio,
  socialLinks,
  profileSlug,
}: RepoCardSectionProps) {
  const fullRepoName = `@${profileSlug}/${repoSlug}`

  console.log('[authorBio]', authorBio)

  return (
    <View gap="$3" $gtSm={{ gap: '$4' }}>
      <H2>{title}</H2>
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
              <Card.Title fontFamily="$mono">{fullRepoName}</Card.Title>
              <Card.Description>{description}</Card.Description>
            </View>
            <View row="wrap" jbtwn ai="center" gap="$2">
              <View mt="auto" row jc="flex-end">
                <LinkButton href={`/${fullRepoName}`}>
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
            }}
          >
            <View o={0.15} stretch zi={0} bg="$gray2Light" $theme-light={{ bg: '$gray1Light' }} />
            <View row ai="center" gap="$3">
              {!!profileImage && (
                <Image
                  src={profileImage}
                  unoptimized
                  width={150}
                  height={96}
                  alt={authorName}
                  style={{ borderRadius: 6 }}
                  contentFit="cover"
                />
              )}
              <View flex={1} gap="$2">
                <Text fontWeight="600">{authorName}</Text>
                <Text>{authorBio}</Text>
                <View row gap="$3">
                  <Link href={socialLinks.github} target="_blank">
                    <Lucide.Github size={16} />
                  </Link>
                  <Link href={socialLinks.twitter} target="_blank">
                    <TwitterIcon width={16} height={16} stroke="var(--color)" />
                  </Link>
                  <Link href={socialLinks.linkedin} target="_blank">
                    <Lucide.Linkedin size={16} />
                  </Link>
                </View>
              </View>
            </View>

            <View gap="$1" row o={1}>
              <LinkButton grow href={`/@${profileSlug}`}>
                <ButtonText>Profile</ButtonText>
              </LinkButton>

              <LinkButton grow inverse href={`/book/${profileSlug}`}>
                <ButtonText>Book a Call</ButtonText>
              </LinkButton>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
