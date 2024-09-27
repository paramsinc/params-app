import { makeCDN } from 'app/multi-media/make-cdn'
import cloudinary from './cloudinary'
import raw from './raw'
import { keys } from 'app/helpers/object'
import { CDNVendor } from 'app/multi-media/CDNVendor'

export const cdns = [cloudinary, raw] as const

export const cdn = { cloudinary, raw } as const satisfies {
  [key in CDNVendor]: ReturnType<typeof makeCDN<key>>
}

const k = keys(cdn)
