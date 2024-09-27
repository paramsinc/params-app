type Base<Vendor extends string> = {
  uploadImage: (
    image: File,
    options?: {
      folder?: string
      publicId?: string
    }
  ) => Promise<{
    id: string
    vendor: Vendor
  }>
}

export const makeCDN = <Vendor extends string, CDN extends Base<Vendor> = Base<Vendor>>(
  vendor: Vendor,
  cdn: CDN
): CDN & { vendor: Vendor } => {
  return { ...cdn, vendor }
}
