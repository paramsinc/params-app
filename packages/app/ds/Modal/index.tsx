import { Header } from 'app/ds/Header'
import { Lucide } from 'app/ds/Lucide'
import { Open, OpenTrigger, useOpen } from 'app/ds/Open'
import { platform } from 'app/ds/platform'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
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
  const { onOpenChange } = useOpen(undefined)
  return (
    <View
      stretch
      zi={-1}
      {...props}
      bg="$color12"
      opacity={0.2}
      animation="quick"
      hoverStyle={{ opacity: 0.18 }}
      onPress={(e) => {
        onOpenChange(false)
        props.onPress?.(e)
      }}
      focusable={false}
      cursor="pointer"
    />
  )
})

export const ModalContent = Content

export const ModalTrigger = Trigger
export const ModalBackdrop = Backdrop
export const useModalState = (id: string | undefined) => useOpen(makeId(id))

export const ModalDialog = styled(View, {
  // TODO iOS height...hm need to handle safe area for non sheets
  bg: '$color1',
  w: '100%',
  height: '100%',
  margin: 'auto',
  $gtMd: {
    maxWidth: 700,
    br: '$true',
    ov: 'hidden',
  },
  variants: {
    autoHeight: {
      true: {
        height: 'auto',
      },
      false: {
        $gtMd: {
          maxHeight: 800,
        },
      },
    },
  } as const,
  defaultVariants: {
    autoHeight: false,
  },
})

const headerHeight = 50

export const ModalDialogHeader = styled(Header, {
  bg: '$backgroundStrong',
  px: '$2',
  fd: 'row',
  height: headerHeight,
  ai: 'center',
})

const HeaderSmart = ({ title, button }: { title: string; button?: React.ReactNode }) => {
  const { onOpenChange } = useModalState(undefined)
  return (
    <ModalDialogHeader>
      <ModalDialogHeaderTitle>{title}</ModalDialogHeaderTitle>
      <View onPress={() => onOpenChange(false)} cursor="pointer">
        <Lucide.X />
      </View>
      <View grow />
      {button}
    </ModalDialogHeader>
  )
}
const ModalDialogHeaderTitleFrame = styled(Text, {
  bold: true,
  lineHeight: headerHeight,
  center: true,
})

export const ModalDialogHeaderTitle = (
  props: React.ComponentProps<typeof ModalDialogHeaderTitleFrame>
) => {
  return (
    <View stretch zi={0} ai="center">
      <ModalDialogHeaderTitleFrame {...props} />
    </View>
  )
}

export const Modal = withStaticProperties(Root, {
  Content,
  Trigger,
  Backdrop,
  Dialog: withStaticProperties(ModalDialog, {
    Header: withStaticProperties(ModalDialogHeader, {
      Title: ModalDialogHeaderTitle,
    }),
    HeaderSmart,
  }),
})
