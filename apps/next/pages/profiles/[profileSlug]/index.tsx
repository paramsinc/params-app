import { d, db, schema } from 'app/db/db'
import { ProfileDetailPublicPage } from 'app/features/profile/detail-public/page'
import { ssgApi } from 'app/trpc/ssg'

export default function ProfileDetailPublicPageWrapper() {
  return <ProfileDetailPublicPage />
}

import type { GetStaticPaths, GetStaticProps } from 'next'

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
    .limit(50)
    .execute()
  return {
    paths: profiles.map((p) => ({ params: { profileSlug: p.profileSlug } })),
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  const profileSlug = ctx.params?.profileSlug as string

  await Promise.all([
    ssgApi.profileBySlug_public.prefetch({ profile_slug: profileSlug }),
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
    },
    revalidate: 1,
  }
}
