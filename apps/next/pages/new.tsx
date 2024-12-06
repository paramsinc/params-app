export { default } from './dashboard/new'
import type { GetStaticProps } from 'next'
import type { Metadata } from 'next'

export const getStaticProps = (async () => {
  return {
    props: {
      metadata: {
        title: 'New Repo | Params',
      } satisfies Metadata,
    },
  }
}) satisfies GetStaticProps
