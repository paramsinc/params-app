import { env } from 'app/env'
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/dashboard/',
      //   allow: '/api/og/*',
    },
    sitemap: `https://${env.URL}/sitemap.xml`,
  }
}
