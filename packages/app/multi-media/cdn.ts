import { makeCDN } from 'app/multi-media/make-cdn'
import cloudinary from './cloudinary'

const cdns = [cloudinary]

export type CDNVendor = (typeof cdns)[number]['vendor']

export const cdn = { cloudinary } satisfies {
  [key in CDNVendor]: ReturnType<typeof makeCDN<key>>
}
