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
import { RepoCardSection } from 'app/features/home/RepoCardSection'
import { Heading } from 'app/features/home/Heading'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import type { Metadata } from '../metadata'
import { db } from 'app/db/db'
import { repoBySlug } from 'app/trpc/api'
import { imageLoader } from 'app/image/loader'

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

export const getStaticProps = (async () => {
  const jeremySocials = {
    github: 'https://github.com/jerber',
    twitter: 'https://x.com/jerber888',
    linkedin: 'https://linkedin.com/in/jeremyberman1',
  }

  let cards: Array<{
    repo_slug: string
    profile_slug: string
    socialLinks: {
      github: string
      twitter: string
      linkedin: string
    }
    title: string
  }> = [
    {
      repo_slug: 'churn',
      profile_slug: 'jeremy-berman',
      socialLinks: jeremySocials,
      title: 'Build a churn prediction model',
    },
    {
      repo_slug: 'arc-agi',
      profile_slug: 'jeremy-berman',
      socialLinks: jeremySocials,
      title: 'Build a solution to ARC-AGI',
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
    socialLinks: repo.socialLinks,
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
          <LinkButton href="/new" als="flex-start">
            <ButtonText>Submit your repo</ButtonText>
          </LinkButton>
        </View>

        <View gap="$4" $gtSm={{ gap: '$5' }}>
          {sections.map((section) => (
            <RepoCardSection key={section.repoSlug} {...section} />
          ))}
          {/* <RepoCardSection
            title="Build a recommendation system"
            repoSlug="recommendation-system"
            description="A scalable recommendation engine built with TensorFlow, featuring collaborative filtering, content-based filtering, and hybrid approaches. Includes pre-trained models and example datasets."
            profileImage="https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg"
            authorName="François Chollet"
            authorBio="AI @ Google, Creator of Keras, Cofounder of ARC Prize"
            socialLinks={{
              github: 'https://github.com/fchollet',
              twitter: 'https://x.com/fchollet',
              linkedin: 'https://linkedin.com/in/fchollet',
            }}
            profileSlug="francois"
          />

          <RepoCardSection
            title="Build a churn prediction model"
            repoSlug="churn"
            description="Production-grade churn prediction using transformers. Features sequence modeling of user events, time-aware attention mechanisms, and automated feature engineering. Includes pre-built data pipelines and evaluation framework."
            profileImage="https://pbs.twimg.com/profile_images/1856206784458883072/6q8Vrp59_400x400.jpg"
            authorName="Jeremy Berman"
            authorBio="AI @ Params, Previously Cofounder @ BeatGig"
            socialLinks={{
              github: 'https://github.com/jerber',
              twitter: 'https://x.com/jerber888',
              linkedin: 'https://linkedin.com/in/jeremyberman1',
            }}
            profileSlug="jeremy"
          /> */}
        </View>
      </View>
    </Page.Root>
  )
}
