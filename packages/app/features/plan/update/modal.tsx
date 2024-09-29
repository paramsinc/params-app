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
import { UpdateOnetimePlanForm } from 'app/features/plan/update/form'

const id = 'update-onetime-plan-modal'

const Content = (
  props: Partial<React.ComponentProps<typeof UpdateOnetimePlanForm>> &
    Pick<React.ComponentProps<typeof UpdateOnetimePlanForm>, 'planId'>
) => {
  const { toast } = useToast()
  const { onOpenChange } = useModalState(id)

  return (
    <ModalContent id={id}>
      <ModalBackdrop />
      <ModalDialog>
        <Modal.Dialog.HeaderSmart title="Update Plan" />
        <UpdateOnetimePlanForm
          {...props}
          onDidUpdatePlan={(...args) => {
            props.onDidUpdatePlan?.(...args)
            toast({
              title: 'Plan updated successfully.',
              preset: 'done',
            })
            onOpenChange(false)
          }}
          onDidDeletePlan={(...args) => {
            props.onDidDeletePlan?.(...args)
            toast({
              title: 'Plan deleted.',
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

export const UpdateOnetimePlanModal = withStaticProperties(
  function Root(props: React.ComponentProps<typeof Modal>) {
    return <Modal {...props} id={id} />
  },
  {
    Content,
    Trigger,
  }
)
