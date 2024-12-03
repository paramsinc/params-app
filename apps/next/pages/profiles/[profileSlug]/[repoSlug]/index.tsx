export { RepositoryDetailPublicPage as default } from 'app/features/repository/detail-public/page'

import { ssgApi } from 'app/trpc/ssg'

import type { GetStaticPaths, GetStaticProps } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
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
    ssgApi.repo.bySlug.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
    ssgApi.repo.paramsJson.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
    ssgApi.repo.tree.prefetch({ profile_slug: profileSlug, repo_slug: repoSlug }),
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
