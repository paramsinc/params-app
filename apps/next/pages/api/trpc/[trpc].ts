export { default } from 'app/trpc/route/[trpc]'

export const config = {
  maxDuration: 45,
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}
