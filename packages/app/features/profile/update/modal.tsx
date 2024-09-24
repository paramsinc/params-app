import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import useToast from 'app/ds/Toast'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { ProfileUpdateForm } from 'app/features/profile/update/form'

const id = 'profile-update-modal'

const Content = (
  props: Pick<React.ComponentProps<typeof ProfileUpdateForm>, 'profileSlug'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)
  return (
    <ModalContent id={id}>
      <ModalBackdrop />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="Update Profile" />
        <ProfileUpdateForm
          {...props}
          onDidUpdateProfile={() => {
            toast({
              title: 'Profile updated',
              preset: 'done',
            })
            onOpenChange(false)
          }}
          onDidDeleteProfile={() => {
            onOpenChange(false)
            toast({
              title: 'Profile deleted',
              preset: 'done',
            })
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

function Trigger(props: React.ComponentProps<typeof ModalTrigger>) {
  return <ModalTrigger {...props} id={id} />
}

export const UpdateProfileModal = withStaticProperties(
  function Root(props: React.ComponentProps<typeof Modal>) {
    return <Modal {...props} id={id} />
  },
  {
    Content,
    Trigger,
  }
)
