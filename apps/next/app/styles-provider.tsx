'use client'
import { useServerInsertedHTML } from 'next/navigation'
import tamagui from 'app/ds/tamagui/tamagui.config'

export function StylesProvider({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    return <style dangerouslySetInnerHTML={{ __html: tamagui.getCSS() }} />
  })
  return <>{children}</>
}
