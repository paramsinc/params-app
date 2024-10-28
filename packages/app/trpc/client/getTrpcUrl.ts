export function getTrpcUrl() {
  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`
  if (typeof window !== 'undefined')
    // browser should use relative path
    return ''
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}
