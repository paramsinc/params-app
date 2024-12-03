import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import { CreateProfileMemberForm } from './form'
import useToast from 'app/ds/Toast'

const id = 'create-profile-member-modal'

export const CreateProfileMemberModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const CreateProfileMemberModalContent = (
  props: Partial<React.ComponentProps<typeof CreateProfileMemberForm>> &
    Pick<React.ComponentProps<typeof CreateProfileMemberForm>, 'profileId'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)

  return (
    <ModalContent id={id}>
      <ModalBackdrop id={id} />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="Add Team Member" />
        <CreateProfileMemberForm
          {...props}
          onDidCreateMember={(...args) => {
            props.onDidCreateMember?.(...args)
            toast({
              title: 'Team member added.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const CreateProfileMemberModalTrigger = (
  props: React.ComponentProps<typeof ModalTrigger>
) => {
  return <ModalTrigger {...props} id={id} />
}
