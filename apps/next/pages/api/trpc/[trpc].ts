export { default } from 'app/trpc/route/[trpc]'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}
