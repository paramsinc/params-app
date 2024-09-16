/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef } from 'react'

export default function useConsoleLog(...args: unknown[]) {
  const enabled = useRef(true)
  const disableLogs = (disable: boolean) => {
    enabled.current = !disable
  }
  if (!__DEV__) {
    return {
      disableLogs,
    }
    // break hooks rules bc this never changes
  }

  // track when args changed based on their stringified version
  const stringifiedArgs = JSON.stringify(args ?? [])

  const latestArgs = useRef(args ?? [])

  useEffect(
    function updateArgs() {
      latestArgs.current = args ?? []
    },
    [args]
  )

  useEffect(
    function logArgsWhenTheyChange() {
      if (enabled.current) {
        console.log(...latestArgs.current)
      }
    },
    [stringifiedArgs]
  )

  return {
    disableLogs,
  }
}
