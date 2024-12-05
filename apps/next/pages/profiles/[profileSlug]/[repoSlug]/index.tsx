export { RepositoryDetailPublicPage as default } from 'app/features/repository/detail-public/page'

import { d, db, schema } from 'app/db/db'
import { ssgApi } from 'app/trpc/ssg'

import type { GetStaticPaths, GetStaticProps } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  const repos = await db
    .select({
      repo_slug: schema.repositories.slug,
      profile_slug: schema.profiles.slug,
    })
    .from(schema.repositories)
    .innerJoin(schema.profiles, d.eq(schema.repositories.profile_id, schema.profiles.id))
    .limit(50)
    .execute()

  return {
    paths: repos.map((repo) => ({
      params: { profileSlug: repo.profile_slug, repoSlug: repo.repo_slug },
    })),
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  const profileSlug = ctx.params?.profileSlug as string
  const repoSlug = ctx.params?.repoSlug as string

  console.log('[profiles/[profileSlug]/[repoSlug][getStaticProps]', { profileSlug, repoSlug })

  await Promise.all([
    ssgApi.profileBySlug_public.prefetch({ profile_slug: profileSlug }),
    ssgApi.onetimePlansByProfileSlug_public.prefetch({ profile_slug: profileSlug }),
    ssgApi.repo.bySlug_public.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
    ssgApi.repo.paramsJson.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
    // ssgApi.repo.tree.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
    ssgApi.repo.readme.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
    ssgApi.repo.bookableProfiles_public.prefetch({
      profile_slug: profileSlug,
      repo_slug: repoSlug,
    }),
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
      repoSlug,
    },
    revalidate: 30,
  }
}
