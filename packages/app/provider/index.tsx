'use client'
import { SafeArea } from 'app/provider/safe-area'
import { Auth } from 'app/auth'

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <Auth.Provider>
      <SafeArea>{children}</SafeArea>
    </Auth.Provider>
  )
}
