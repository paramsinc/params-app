import type { cdns } from 'app/multi-media/cdn'

export type CDNVendor = (typeof cdns)[number]['vendor']
