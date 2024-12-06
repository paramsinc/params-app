import { d, db, schema } from 'app/db/db'
import { ProfileDetailPublicPage } from 'app/features/profile/detail-public/page'
import { ssgApi } from 'app/trpc/ssg'
import type { Metadata } from '../../../metadata'

export default function ProfileDetailPublicPageWrapper() {
  return <ProfileDetailPublicPage />
}

import type { GetStaticPaths, GetStaticProps } from 'next'
import { imageLoader } from 'app/image/loader'

export const getStaticPaths: GetStaticPaths = async () => {
  const profiles = await db
    .selectDistinctOn([schema.profiles.id], {
      profileSlug: schema.profiles.slug,
    })
    .from(schema.profiles)
    .where(
      d.exists(
        db
          .select({
            id: schema.repositories.id,
          })
          .from(schema.repositories)
          .innerJoin(
            schema.githubRepoIntegrations,
            d.eq(schema.repositories.id, schema.githubRepoIntegrations.repo_id)
          )
      )
    )
    .limit(20)
    .execute()
  console.log('[static-paths][profiles]', profiles)
  return {
    paths: profiles.map((p) => ({ params: { profileSlug: p.profileSlug } })),
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  const profileSlug = ctx.params?.profileSlug as string

  try {
    const [profile] = await Promise.all([
      ssgApi.profileBySlug_public.fetch({ profile_slug: profileSlug }),
      ssgApi.onetimePlansByProfileSlug_public.prefetch({ profile_slug: profileSlug }),
      ssgApi.profileBySlug_public.prefetch({ profile_slug: profileSlug }),
    ])

    const trpcState = ssgApi.dehydrate()

    console.log(
      '[trpcState]',
      trpcState.queries.map((q) => q.queryKey)
    )

    return {
      props: {
        trpcState,
        profileSlug,
        metadata: {
          titleTemplate: '%s | Params',
          title: profile.name,
          description: profile.short_bio ?? '',
          openGraph: {
            title: profile.name,
            description: profile.short_bio ?? '',
            images: [
              ...(profile.image_vendor && profile.image_vendor_id
                ? [
                    {
                      url: imageLoader[profile.image_vendor]({
                        src: profile.image_vendor_id,
                        width: 1500,
                        quality: 100,
                      }),
                    },
                  ]
                : []),
            ],
          },
        } satisfies Metadata,
      },
      revalidate: 1,
    }
  } catch {
    return {
      notFound: true,
    }
  }
}
