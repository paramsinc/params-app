import { useEffect, useRef, useLayoutEffect } from 'react'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * React hook which returns the latest callback without changing the reference.
 *
 * @param {T extends (...args: any[]) => void} callback Callback to use as the latest callback
 * @return {T} Memoized callback which preserves the reference
 *
 * @template T
 */
function useLatestCallback<T extends undefined | null | ((...args: any[]) => any)>(
  callback: T
): NonNullable<T> {
  const ref = useRef(callback)

  const latestCallback = useRef(function latestCallback(...args: any[]) {
    return ref.current?.apply(this as any, args)
  }).current

  useIsomorphicLayoutEffect(() => {
    ref.current = callback
  })

  return latestCallback as NonNullable<T>
}

export { useLatestCallback }
