import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { NewProfileForm } from 'app/features/profile/new/form'

const id = 'new-profile'

export const NewProfileModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const NewProfileModalContent = (
  props: Partial<React.ComponentProps<typeof NewProfileForm>>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)
  return (
    <ModalContent id={id}>
      <ModalBackdrop id={id} />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="New Profile" />
        <NewProfileForm
          {...props}
          onDidCreateProfile={() => {
            toast({
              title: 'Profile created.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const NewProfileModalTrigger = (
  props: React.ComponentProps<typeof ModalTrigger>
) => {
  return <ModalTrigger {...props} id={id} />
}
