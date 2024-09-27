export { default } from 'app/trpc/nextjs/[trpc]'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}
