export { default as List } from './list'
import type { FlashList } from '@shopify/flash-list'
import { ComponentPropsWithRef } from 'react'

type GetRefType<T> = T extends { current: infer R } ? R : never

export type LongList<a = any> = GetRefType<ComponentPropsWithRef<typeof FlashList<a>>['ref']>
