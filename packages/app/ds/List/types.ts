import { ComponentType, ReactElement } from 'react'

import { FlashListProps } from '@shopify/flash-list'

type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type LongListProps<T> = RequiredFields<FlashListProps<T>, 'renderItem' | 'keyExtractor'> &
  Pick<FlashListProps<T>, 'estimatedItemSize'> & {
    overscan?: number
    index?: number
    optOut?: boolean
    useWindowScroll?: boolean
    preserveScrollPosition?: boolean
    // override this type, avoid some style code that cause the web to be re-rendered.
    ListHeaderComponent?:
      | ComponentType<{
          context?: unknown
        }>
      | ReactElement
    ListFooterComponent?:
      | ComponentType<{
          context?: unknown
        }>
      | ReactElement
  } & (
    | {
        useWindowScroll: true
        containerSize?: never
      }
    | {
        useWindowScroll?: false
        containerSize?: number
      }
  )
