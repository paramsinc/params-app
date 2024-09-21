import { createContext } from 'app/ds/createContext'
import { Open, OpenTrigger, useOpen } from 'app/ds/Open'
import { platform } from 'app/ds/platform'
import { View } from 'app/ds/View'
import { Modal as NativeModal } from 'react-native'

const makeId = (id?: string) => `${['modal', id].join('__')}`

function Root(props: React.ComponentProps<typeof Open>) {
  const id = makeId(props.id)
  return <Open {...props} id={id} />
}

function Content(
  props: Pick<
    React.ComponentProps<typeof NativeModal>,
    'presentationStyle' | 'children' | 'transparent'
  > & {
    id?: string
  }
) {
  const { onOpenChange, open } = useOpen(makeId(props.id))

  return (
    <NativeModal
      {...props}
      visible={open}
      onRequestClose={() => onOpenChange(false)}
      transparent={props.transparent ?? platform.OS === 'web'}
    />
  )
}

const Trigger = function (props: React.ComponentProps<typeof OpenTrigger>) {
  return <OpenTrigger {...props} id={makeId(props.id)} />
}

const Backdrop = View.styleable<{ id?: string }>(function Backdrop({ id, ...props }) {
  const { onOpenChange } = useOpen(makeId(id))
  return (
    <View
      stretch
      zi={-1}
      {...props}
      bg="$color5"
      opacity={0.2}
      animation="quick"
      hoverStyle={{ opacity: 0.5 }}
      onPress={(e) => {
        onOpenChange(false)
        props.onPress?.(e)
      }}
    />
  )
})

export const Modal = Root
export const ModalContent = Content
export const ModalTrigger = Trigger
export const ModalBackdrop = Backdrop
