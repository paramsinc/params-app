import { cloneElement, createContext, useContext, useState } from 'react'

const Context = createContext({
  open: false,
  onOpenChange: (open: boolean) => {},
})

export const Open = (
  props: { children: React.ReactNode } & (
    | (React.ContextType<typeof Context> & {
        initialOpen?: never
      })
    | {
        open?: never
        onOpenChange?: never
        initialOpen?: boolean
      }
  )
) => {
  const [localOpen, setLocalOpen] = useState<boolean>()
  let state: React.ContextType<typeof Context> = {
    open: localOpen ?? props.initialOpen ?? false,
    onOpenChange: setLocalOpen,
  }
  if (props.open != null) {
    state = {
      open: props.open,
      onOpenChange: props.onOpenChange,
    }
  }
  return <Context.Provider value={state}>{props.children}</Context.Provider>
}

export const useOpen = () => useContext(Context)

export const OpenTrigger = ({
  children,
}: {
  children:
    | React.ReactElement
    | (({
        isOpen,
        onOpenChange,
      }: {
        isOpen: boolean
        onOpenChange: (next: boolean) => void
      }) => React.ReactElement)
}) => {
  const { open, onOpenChange } = useOpen()
  if (typeof children === 'function') {
    return children({ isOpen: open, onOpenChange })
  }
  return cloneElement(children, {
    onPress: (e: any) => {
      children.props?.onPress?.(e)
      onOpenChange(!open)
    },
  })
}

export const OpenContent = ({ children }: { children: React.ReactNode }) => {
  const { open } = useOpen()
  return open ? <>{children}</> : null
}
