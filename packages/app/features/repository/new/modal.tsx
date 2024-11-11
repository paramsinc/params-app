import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import useToast from 'app/ds/Toast'
import { NewRepositoryForm } from './form'
import { NewRepositoryFromGithubForm } from 'app/features/repository/new/form-from-github'

const id = 'new-repository'

export const NewRepositoryModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const NewRepositoryModalContent = (
  props: Pick<React.ComponentProps<typeof NewRepositoryForm>, 'profileId'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)
  return (
    <ModalContent id={id}>
      <ModalBackdrop id={id} />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="New Repository" />
        <NewRepositoryForm
          {...props}
          onDidCreateRepository={() => {
            toast({
              title: 'Repository created.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const NewRepositoryFromGithubModalContent = (
  props: Pick<React.ComponentProps<typeof NewRepositoryFromGithubForm>, 'profileId' | 'profileSlug'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)
  return (
    <ModalContent id={id}>
      <ModalBackdrop id={id} />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="New Repository" />
        <NewRepositoryFromGithubForm
          {...props}
          onDidCreateRepository={() => {
            toast({
              title: 'Repository created.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const NewRepositoryModalTrigger = (props: React.ComponentProps<typeof ModalTrigger>) => {
  return <ModalTrigger {...props} id={id} />
}
