import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import useToast from 'app/ds/Toast'
import { ConnectAccountContent } from 'app/features/profile/stripe/connect-account'
import { api } from 'app/trpc/client'

const id = 'connect-account'

export const ConnectAccountModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const ConnectAccountModalContent = (
  props: Pick<React.ComponentProps<typeof ConnectAccountContent>, 'profileSlug'>
) => {
  const { onOpenChange } = useModalState(id)
  const query = api.profileConnectAccount.useQuery(
    {
      profile_slug: props.profileSlug,
    },
    {
      enabled: false,
    }
  )
  const { toast } = useToast()
  return (
    <ModalContent id={id}>
      <ModalBackdrop id={id} />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="Payout Settings" />
        <ConnectAccountContent
          profileSlug={props.profileSlug}
          onComplete={() => {
            onOpenChange(false)
            toast({
              preset: 'done',
              title: 'Payout onboarding complete',
              message: 'You can now receive payments.',
            })
            query.refetch()
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const ConnectAccountModalTrigger = (
  props: React.ComponentProps<typeof ModalTrigger>
) => {
  return <ModalTrigger {...props} id={id} />
}
