import { env } from 'app/env'
import { entries, values } from 'app/helpers/object'
import type { CDNVendor } from 'app/multi-media/CDNVendor'
import { cdnImageTransformations } from 'app/multi-media/cdnImageTransformations'

export const imageLoader = {
  raw: ({ src }) => src,
  cloudinary: ({ src: publicId, width }) => {
    const transformations = entries(cdnImageTransformations)
    const [transformation] =
      transformations.find(([_, transformation]) => transformation.width >= width) ??
      transformations[transformations.length - 1]!

    return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/t_${transformation}/${publicId}`
  },
} satisfies Record<CDNVendor, (input: { src: string; width: number; quality?: number }) => string>
