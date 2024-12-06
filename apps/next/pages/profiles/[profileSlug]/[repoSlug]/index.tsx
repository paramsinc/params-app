export { RepositoryDetailPublicPage as default } from 'app/features/repository/detail-public/page'

import { d, db, schema } from 'app/db/db'
import { env } from 'app/env'
import { imageLoader } from 'app/image/loader'
import { ssgApi } from 'app/trpc/ssg'
import type { Metadata } from '../../../../metadata'

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

  const repoPromise = ssgApi.repo.bySlug_public.fetch({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
  })

  const [profile, repo] = await Promise.all([
    ssgApi.profileBySlug_public.fetch({ profile_slug: profileSlug }),
    repoPromise,
    ssgApi.repo.paramsJson
      .fetch({ profile_slug: profileSlug, repo_slug: repoSlug })
      .then(async (paramsJson) => {
        const mainDocsFile = paramsJson?.docs.main
        if (mainDocsFile && mainDocsFile.toLowerCase() !== 'readme.md') {
          const repo = await repoPromise
          await ssgApi.github.repoFiles.prefetch({
            profile_slug: profileSlug,
            repo_slug: repoSlug,
            path: [repo.github_repo?.path_to_code, mainDocsFile].filter(Boolean).join('/'),
          })
        }
      }),
    ssgApi.onetimePlansByProfileSlug_public.prefetch({ profile_slug: profileSlug }),
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
      metadata: {
        title: `@${profile.slug}/${repo.slug} on ${env.APP_NAME}`,
        description: repo.description ?? '',
        openGraph: {
          title: `@${profile.slug}/${repo.slug} on ${env.APP_NAME}`,
          description: repo.description ?? '',
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
          siteName: env.APP_NAME,
        },
        twitter: {
          cardType: 'summary_large_image',
          site: `https://${env.APP_URL}`,
        },
      } satisfies Metadata,
    },
    revalidate: 30,
  }
}
