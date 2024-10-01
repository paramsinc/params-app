import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import useToast from 'app/ds/Toast'
import { UpdateRepositoryForm } from './form'

const id = 'update-repository'

export const UpdateRepositoryModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const UpdateRepositoryModalContent = (
  props: Pick<React.ComponentProps<typeof UpdateRepositoryForm>, 'repoId'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)
  return (
    <ModalContent id={id}>
      <ModalBackdrop id={id} />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="Update Repository" />
        <UpdateRepositoryForm
          {...props}
          onDidUpdateRepository={() => {
            toast({
              title: 'Repository updated.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
          onDidDeleteRepository={() => {
            toast({
              title: 'Repository deleted.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const UpdateRepositoryModalTrigger = (props: React.ComponentProps<typeof ModalTrigger>) => {
  return <ModalTrigger {...props} id={id} />
}
