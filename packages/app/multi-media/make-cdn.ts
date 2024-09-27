import { cdnImageTransformations } from 'app/multi-media/cdnImageTransformations'

type Base<Vendor extends string> = {
  uploadImage: (
    base64: string,
    options?: {
      folder?: string
      publicId?: string
    }
  ) => Promise<{
    id: string
    vendor: Vendor
  }>
  getTransformedImageUrls: (publicId: string) => {
    [key in keyof typeof cdnImageTransformations]: string
  }
}

export const makeCDN = <Vendor extends string, CDN extends Base<Vendor> = Base<Vendor>>(
  vendor: Vendor,
  cdn: CDN
): CDN & { vendor: Vendor } => {
  return { ...cdn, vendor }
}
