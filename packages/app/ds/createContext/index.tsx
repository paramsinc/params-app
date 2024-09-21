import { createContext as create, useContext } from 'react'

export function createContext<T>(initial?: T) {
  const ctx = create<T>(initial ?? (null as any))

  return Object.assign(
    function Provider(props: React.ComponentProps<typeof ctx.Provider>) {
      return <ctx.Provider {...props} />
    },
    ctx,
    {
      use: () => useContext(ctx),
    }
  )
}
