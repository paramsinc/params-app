'use client'

import {
  useEffect,
  useRef,
  MutableRefObject,
  useLayoutEffect,
  isValidElement,
  forwardRef,
  memo,
  Fragment,
  useState,
} from 'react'

import type { FlashListProps, ViewToken } from '@shopify/flash-list'
import { useWindowVirtualizer, useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { debounce } from 'radash'
import { useRouter } from 'next/router'

import { LongListProps } from './types'
import { Scroll } from 'app/ds/Scroll'
import { View } from 'app/ds/View'

const measurementsCache: any = {}

const DEFAULT_VIEWABILITY_THRESHOLD_PERCENTAGE = 80

const renderComponent = (Component: any, props?: {}) => {
  if (!Component) return null
  if (isValidElement(Component)) return Component
  return <Component {...props} />
}
function InfiniteScrollListImpl<Item>(props: LongListProps<Item> & {}, ref: any) {
  const {
    data,
    renderItem,
    extraData,
    onViewableItemsChanged,
    viewabilityConfig,
    ItemSeparatorComponent,
    estimatedItemSize,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    onEndReached,
    numColumns = 1,
    overscan,
    style,
    useWindowScroll = false,
    preserveScrollPosition = false,
    initialScrollIndex,
    onMomentumScrollEnd, // TODO garbage collection requires this
    inverted,
  } = props
  let count = data?.length ?? 0
  if (numColumns) {
    count = Math.ceil(count / numColumns)
  }

  if (!useWindowScroll && ListFooterComponent && numColumns === 1 && count > 0) {
    count++
  }

  const lazyRef = useRef({
    value: undefined,
    get initialOffset() {
      if (!preserveScrollPosition) return
      if (this.value !== undefined) return this.value as number
      const pos = sessionStorage.getItem(key)
      let value = 0
      if (pos) {
        const parsedPos = Number(pos)
        value = parsedPos
      }
      this.value = value
      return value
    },
  })

  const viewableItems = useRef<ViewToken[]>([])
  const parentRef = useRef<HTMLDivElement>(null)
  const scrollMarginOffsetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault()
      const currentTarget = e.currentTarget as HTMLElement

      if (currentTarget) {
        currentTarget.scrollTop -= e.deltaY
      }
    }
    if (inverted) {
      parentRef.current?.addEventListener('wheel', handleScroll, {
        passive: false,
      })
    }

    return () => {
      if (inverted) {
        parentRef.current?.removeEventListener('wheel', handleScroll)
      }
    }
  }, [inverted])
  const parentOffsetRef = useRef(0)
  const router = useRouter()
  const key = `myapp-scroll-restoration-${router?.asPath}-window-scroll-${useWindowScroll}`

  useLayoutEffect(() => {
    parentOffsetRef.current = scrollMarginOffsetRef.current?.offsetTop ?? 0
  }, [])
  const positionWasRestored = useRef<boolean>(false)

  let rowVirtualizer: Virtualizer<any, any>
  const [initialOffset] = useState(() => {
    if (initialScrollIndex && estimatedItemSize) {
      return initialScrollIndex * estimatedItemSize
    }
    if (!preserveScrollPosition || positionWasRestored.current) return
    const pos = sessionStorage.getItem(key)
    if (pos) {
      const parsedPos = Number(pos)
      positionWasRestored.current = true
      return parsedPos
    }
    return 0
  })
  if (useWindowScroll) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    rowVirtualizer = useWindowVirtualizer({
      count,
      estimateSize: () => estimatedItemSize ?? 0,
      scrollMargin: parentOffsetRef.current,
      overscan: overscan ?? 2,
      initialOffset,
      initialMeasurementsCache: measurementsCache[key],
    })
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    rowVirtualizer = useVirtualizer({
      count,
      estimateSize: () => estimatedItemSize ?? 0,
      getScrollElement: () => parentRef.current,
      scrollMargin: parentOffsetRef.current,
      overscan: overscan ?? 4,
      initialOffset,
      initialMeasurementsCache: measurementsCache[key],
    })
  }

  const renderedItems = rowVirtualizer.getVirtualItems()

  const endReached = useLatestCallback(onEndReached)

  useEffect(() => {
    const lastItem = renderedItems[renderedItems.length - 1]
    if (!lastItem) {
      return
    }
    if (data && data.length > 0 && (lastItem.index + 1) * numColumns >= data.length) {
      endReached()
    }
  }, [data, endReached, numColumns, renderedItems])

  const saveScrollPosition = useLatestCallback(() => {
    sessionStorage.setItem(key, rowVirtualizer.scrollOffset.toString())
    measurementsCache[key] = rowVirtualizer.measurementsCache
  })
  const saveWhenIdle = useLatestCallback(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(saveScrollPosition)
    } else {
      saveScrollPosition()
    }
  })
  useEffect(() => {
    if (!preserveScrollPosition) return

    const debouncedCallback = debounce({ delay: 100 }, saveWhenIdle)
    rowVirtualizer.scrollElement?.addEventListener('scroll', debouncedCallback)

    return () => {
      if (!preserveScrollPosition) return

      rowVirtualizer.scrollElement?.removeEventListener('scroll', debouncedCallback)
    }
  }, [rowVirtualizer.scrollElement, saveScrollPosition, preserveScrollPosition, saveWhenIdle])

  if (props.optOut) {
    return (
      <Scroll>
        {renderComponent(ListHeaderComponent)}
        {data?.length === 0 && renderComponent(ListEmptyComponent)}
        {data?.map((item, index) => {
          return (
            <View width="100%" key={props.keyExtractor(item, index)}>
              {renderItem?.({ item, index, target: 'Cell' })}
              {renderComponent(ItemSeparatorComponent, {
                index,
                leadingItem: item,
                trailingItem: data?.[index + 1],
              })}
            </View>
          )
        })}
        {renderComponent(ListFooterComponent)}
      </Scroll>
    )
  }

  const transformStyle = (inverted && { transform: 'scaleY(-1)' }) || {}

  return (
    <>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ...transformStyle,
        }}
      >
        <div
          ref={(v) => {
            // @ts-ignore
            parentRef.current = v
            if (ref) {
              ref.current = v
            }
          }}
          style={
            !useWindowScroll
              ? {
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  contain: 'strict',
                  flexGrow: 1,
                  //@ts-ignore
                  ...style,
                }
              : undefined
          }
        >
          <div style={transformStyle}>{renderComponent(ListHeaderComponent)}</div>
          <div
            ref={scrollMarginOffsetRef}
            style={{
              height:
                rowVirtualizer.getTotalSize() === 0
                  ? '100%'
                  : rowVirtualizer.getTotalSize() - (useWindowScroll ? 0 : parentOffsetRef.current),
              width: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${
                  renderedItems[0]?.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              {!data || data?.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    position: 'absolute',
                    inset: 0,
                    ...transformStyle,
                  }}
                >
                  {renderComponent(ListEmptyComponent)}
                </div>
              ) : null}
              {renderedItems.map((virtualItem) => {
                const index = virtualItem.index
                const chuckItem = data?.slice(index * numColumns, index * numColumns + numColumns)

                return (
                  <div
                    key={virtualItem.key}
                    data-index={index}
                    ref={rowVirtualizer.measureElement}
                    style={{ width: '100%', ...transformStyle }}
                  >
                    {typeof data?.[index * numColumns] !== 'undefined' ? (
                      <div
                        style={{
                          display: 'flex',
                          width: '100%',
                          justifyContent: 'space-between',
                        }}
                      >
                        {chuckItem?.map((item, i) => {
                          const realIndex = index * numColumns + i
                          return (
                            <ViewabilityTracker
                              key={realIndex}
                              index={realIndex}
                              itemVisiblePercentThreshold={
                                viewabilityConfig?.itemVisiblePercentThreshold ??
                                DEFAULT_VIEWABILITY_THRESHOLD_PERCENTAGE
                              }
                              item={data[realIndex]}
                              viewableItems={viewableItems}
                              onViewableItemsChanged={onViewableItemsChanged}
                            >
                              {renderItem?.({
                                index: realIndex,
                                item,
                                extraData,
                                target: 'Cell',
                              }) ?? null}
                              {realIndex < data.length - 1 &&
                                renderComponent(ItemSeparatorComponent, {
                                  index: realIndex,
                                  leadingItem: item,
                                  trailingItem: data?.[realIndex + 1],
                                })}
                            </ViewabilityTracker>
                          )
                        })}
                        {chuckItem &&
                          chuckItem?.length < numColumns &&
                          new Array(numColumns - chuckItem?.length).fill(0).map((_, itemIndex) => (
                            <div
                              key={`${
                                index * numColumns + itemIndex + (numColumns - chuckItem?.length)
                              }`}
                              style={{
                                width: '100%',
                              }}
                            />
                          ))}
                      </div>
                    ) : index === count - 1 && ListFooterComponent && !useWindowScroll ? (
                      <div style={transformStyle}>{renderComponent(ListFooterComponent)}</div>
                    ) : null}
                  </div>
                )
              })}
              {/* {!useWindowScroll && renderComponent(ListFooterComponent)} */}
            </div>
          </div>

          {useWindowScroll && renderComponent(ListFooterComponent)}
        </div>
      </div>
    </>
  )
}

const ViewabilityTracker = ({
  index,
  item,
  children,
  onViewableItemsChanged,
  viewableItems,
  itemVisiblePercentThreshold,
}: {
  index: number
  item: any
  children: any
  onViewableItemsChanged: FlashListProps<any>['onViewableItemsChanged']
  viewableItems: MutableRefObject<ViewToken[]>
  itemVisiblePercentThreshold: number
}) => {
  const ref = useRef<any>(null)

  useEffect(() => {
    let observer: IntersectionObserver
    if (onViewableItemsChanged) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (viewableItems.current.findIndex((v) => v.index === index) === -1)
              viewableItems.current.push({
                item,
                index,
                isViewable: true,
                key: index.toString(),
                timestamp: new Date().valueOf(),
              })
          } else {
            viewableItems.current = viewableItems.current.filter((v) => v.index !== index)
          }

          viewableItems.current = viewableItems.current.sort(
            (a, b) =>
              //@ts-ignore
              a.index - b.index
          )

          onViewableItemsChanged?.({
            viewableItems: viewableItems.current,

            // TODO: implement changed
            changed: [],
          })
        },

        {
          // will trigger intersection callback when item is 70% visible
          threshold: itemVisiblePercentThreshold / 100,
        }
      )

      if (ref.current) observer.observe(ref.current)
    }

    return () => {
      observer?.disconnect()
      viewableItems.current = viewableItems.current.filter((v) => v.index !== index)
    }
  }, [onViewableItemsChanged, viewableItems, index, item, itemVisiblePercentThreshold])

  return (
    <div style={{ width: '100%' }} ref={ref}>
      {children}
    </div>
  )
}

export default memo(forwardRef(InfiniteScrollListImpl))
