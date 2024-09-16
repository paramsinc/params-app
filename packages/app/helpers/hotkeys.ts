import { useLatestCallback } from 'app/helpers/use-latest-callback'
import * as keys from 'react-hotkeys-hook'
import { Key as HotKey } from 'ts-key-enum'

export function useHotkeys(key: HotKey, callback: () => void) {
  return keys.useHotkeys(key, useLatestCallback(callback))
}

export { HotKey }
