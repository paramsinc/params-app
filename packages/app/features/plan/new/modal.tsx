import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalDialog,
  ModalTrigger,
  useModalState,
} from 'app/ds/Modal'
import { CreateOnetimePlanForm } from 'app/features/plan/new/form'
import useToast from 'app/ds/Toast'

const id = 'create-onetime-plan-modal'

export const CreateOnetimePlanModal = (props: React.ComponentProps<typeof Modal>) => {
  return <Modal {...props} id={id} />
}

export const CreateOnetimePlanModalContent = (
  props: Partial<React.ComponentProps<typeof CreateOnetimePlanForm>> &
    Pick<React.ComponentProps<typeof CreateOnetimePlanForm>, 'profileId'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)

  return (
    <ModalContent id={id}>
      <ModalBackdrop />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="New Plan" />
        <CreateOnetimePlanForm
          {...props}
          onDidCreatePlan={() => {
            toast({
              title: 'Plan created..',
              preset: 'done',
            })
            onOpenChange(false)
          }}
        />
      </ModalDialog>
    </ModalContent>
  )
}

export const CreateOnetimePlanModalTrigger = (props: React.ComponentProps<typeof ModalTrigger>) => {
  return <ModalTrigger {...props} id={id} />
}
