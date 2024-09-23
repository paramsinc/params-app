import { FlashList } from '@shopify/flash-list'
import { LongListProps } from './types'

/**
 * Rules!!!
 *
 * - Don't use key inside of items
 * - Don't use margin inside of items, it breaks web measurement
 */
export default FlashList as any as <T>(
  props: LongListProps<T> & {
    ref?: React.Ref<FlashList<T>>
  }
) => React.ReactElement
