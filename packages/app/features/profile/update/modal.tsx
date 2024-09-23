import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalDialogHeader,
  ModalDialogHeaderTitle,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import useToast from 'app/ds/Toast'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { ProfileUpdateForm } from 'app/features/profile/update/form'

const id = 'profile-update-modal'

const Content = (props: Pick<React.ComponentProps<typeof ProfileUpdateForm>, 'profileSlug'>) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)
  return (
    <ModalContent id={id}>
      <ModalBackdrop />
      <ModalDialog>
        <ModalDialogHeader>
          <ModalDialogHeaderTitle>Update Profile</ModalDialogHeaderTitle>
        </ModalDialogHeader>
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
            toast({
              title: 'Profile deleted',
              preset: 'done',
            })
            onOpenChange(false)
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
