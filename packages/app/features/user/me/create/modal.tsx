import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import { CreateMeForm } from 'app/features/user/me/create/form'
import useToast from 'app/ds/Toast'

const id = 'create-me-modal'

export const CreateMeModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const CreateMeModalContent = (props: Partial<React.ComponentProps<typeof CreateMeForm>>) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)

  return (
    <ModalContent id={id}>
      <ModalBackdrop />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="Create Account" />
        <CreateMeForm
          {...props}
          onDidCreateUser={() => {
            toast({
              title: 'Account saved.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const CreateMeModalTrigger = (props: React.ComponentProps<typeof ModalTrigger>) => {
  return <ModalTrigger {...props} id={id} />
}
