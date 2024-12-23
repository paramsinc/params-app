'use client'
import { ButtonText } from 'app/ds/Button'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { LinkButton } from 'app/ds/Button/link'
import { styled } from 'app/ds/styled'
import { Page } from 'app/ds/Page'
import { RepoCardSection } from 'app/features/home/RepoCardSection'
import { Heading } from 'app/features/home/Heading'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import type { Metadata } from '../metadata'
import { repoBySlug } from 'app/trpc/api'
import { imageLoader } from 'app/image/loader'
import { TextLink } from 'app/ds/TextLink'

const H1 = styled(Heading, {
  letterSpacing: '-0.035em',
  tag: 'h1',
  fontSize: 24,

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

export const getStaticProps = (async () => {
  const jeremySocials = {
    github: 'https://github.com/jerber',
    twitter: 'https://x.com/jerber888',
    linkedin: 'https://linkedin.com/in/jeremyberman1',
  }

  let cards: Array<{
    repo_slug: string
    profile_slug: string
    socialLinks?: {
      github: string
      twitter: string
      linkedin: string
    }
    title: string
  }> = [
    {
      profile_slug: 'fchollet',
      repo_slug: 'recommendations',
      title: 'Build a recommendation system',
    },
    {
      profile_slug: 'the-architects',
      repo_slug: 'arc-prize-2024',
      title: 'Build an Offline Solution to ARC-AGI with Test-Time Training',
    },
    {
      repo_slug: 'arc-agi',
      profile_slug: 'jeremy-berman',
      socialLinks: jeremySocials,
      title: 'Build a solution to ARC-AGI with Evolutionary Test-Time Compute',
    },
    {
      repo_slug: 'churn',
      profile_slug: 'jeremy-berman',
      socialLinks: jeremySocials,
      title: 'Build a churn prediction model',
    },
  ]
  if (process.env.VERCEL_ENV !== 'production') {
    cards = []
  }
  const repos = await Promise.all(
    cards.map(async (card) => ({ ...card, ...(await repoBySlug(card)) }))
  )

  function getImage(repo: (typeof repos)[number]) {
    return repo.profile.image_vendor_id && repo.profile.image_vendor
      ? imageLoader[repo.profile.image_vendor]({
          src: repo.profile.image_vendor_id,
          width: 1000,
        })
      : null
  }

  function makeSection(repo: (typeof repos)[number]) {
    return {
      repoSlug: repo.slug,
      description: repo.description ?? '',
      profileImage: getImage(repo),
      authorName: repo.profile.name,
      authorBio: repo.profile.short_bio ?? '',
      profileSlug: repo.profile.slug,
    }
  }

  const sections: Array<React.ComponentProps<typeof RepoCardSection>> = repos.map((repo) => ({
    repoSlug: repo.slug,
    description: repo.description ?? '',
    profileImage: getImage(repo),
    authorName: repo.profile.name,
    authorBio: repo.profile.short_bio ?? '',
    profileSlug: repo.profile.slug,
    title: repo.title,
    socialLinks: repo.socialLinks ?? null,
  }))
  return {
    props: {
      metadata: {} satisfies Metadata,
      sections,
    },
    revalidate: 1,
  }
}) satisfies GetStaticProps

export default function Home({ sections }: InferGetStaticPropsType<typeof getStaticProps>) {
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
        <View gap="$3">
          <H1>
            Find curated ML templates
            {'\n'}& book a call with the creators
          </H1>
        </View>

        <View gap="$4" $gtSm={{ gap: '$5' }}>
          {sections.map((section) => (
            <RepoCardSection key={section.repoSlug} {...section} />
          ))}
        </View>
        <View p="$2">
          <TextLink href="/privacy">
            <Text color="$color11">Privacy Policy</Text>
          </TextLink>
        </View>
      </View>
    </Page.Root>
  )
}
