import { cloneElement, createContext, useContext, useState, useId } from 'react'

const Context = createContext<{
  states: {
    [key in '__default' | (string & {})]: {
      open: boolean
      onOpenChange: (open: boolean) => void
    }
  }
}>({
  states: {
    __default: { open: false, onOpenChange: (open: boolean) => {} },
  },
})

type State = React.ContextType<typeof Context>['states'][string]

export const Open = (
  props: { children: React.ReactNode; id?: string } & (
    | (State & {
        initialOpen?: never
      })
    | {
        open?: never
        onOpenChange?: never
        initialOpen?: boolean
      }
  )
) => {
  const parentContext = useContext(Context)
  const [localOpen, setLocalOpen] = useState<boolean>()
  const localId = useId()
  const id = props.id ?? localId
  let state: React.ContextType<typeof Context>['states'][string] = {
    open: localOpen ?? props.initialOpen ?? false,
    onOpenChange: setLocalOpen,
  }
  if (props.open != null) {
    state = {
      open: props.open,
      onOpenChange: props.onOpenChange,
    }
  }
  return (
    <Context.Provider
      value={{
        states: {
          ...parentContext.states,
          [id]: state,
          __default: state,
        },
      }}
    >
      {props.children}
    </Context.Provider>
  )
}

export const useOpen = (id: string | undefined) => {
  const context = useContext(Context)

  const state = id ? context.states[id] : context.states.__default

  if (!state) {
    error('Open: no state found for id', id)
    return {
      open: false,
      onOpenChange: (open: boolean) => {},
    }
  }

  return state
}

const error = (...args: (string | undefined)[]) => {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('[Open]' + args.join(' '))
  }
  console.error('[Open]', ...args)
}

export const OpenTrigger = ({
  children,
  id,
}: {
  id?: string
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
  const { open, onOpenChange } = useOpen(id)
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

export const OpenContent = ({ children, id }: { children: React.ReactNode; id?: string }) => {
  const { open } = useOpen(id)
  return open ? <>{children}</> : null
}
