import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { PlanPriceField, PlanDurationField } from 'app/features/plan/update/fields'

const { useMutation } = api.updateOnetimePlan

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]['patch']>()

export function UpdateOnetimePlanForm({
  planId,
  onDidUpdatePlan,
  onDidDeletePlan,
}: {
  planId: string
  onDidUpdatePlan: NonNullable<NonNullable<Parameters<typeof useMutation>[0]>['onSuccess']>
  onDidDeletePlan: NonNullable<
    NonNullable<Parameters<typeof api.deleteOnetimePlan.useMutation>[0]>['onSuccess']
  >
}) {
  const mutation = useMutation({
    onSuccess: onDidUpdatePlan,
  })

  const deleteMutation = api.deleteOnetimePlan.useMutation({
    onSuccess: onDidDeletePlan,
  })

  const planQuery = api.onetimePlanById_public.useQuery(
    { plan_id: planId },
    {
      enabled: !!planId,
      staleTime: 0,
      gcTime: 0,
    }
  )

  if (!planQuery.data) return null

  const plan = planQuery.data

  return (
    <Form.RootProvider
      defaultValues={{
        price: plan.price,
        currency: plan.currency,
        duration_mins: plan.duration_mins,
      }}
    >
      <View grow>
        <Scroll>
          <View p="$3" gap="$3">
            <Form.Controller
              name="price"
              rules={{ required: 'Price is required' }}
              render={({ field, fieldState }) => (
                <PlanPriceField
                  price={field.value === null ? null : field.value ?? plan.price}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />

            <Form.Controller
              name="duration_mins"
              rules={{ required: 'Duration is required' }}
              render={({ field, fieldState }) => (
                <PlanDurationField
                  minutes={field.value === null ? null : field.value ?? plan.duration_mins}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />
          </View>
        </Scroll>

        <ErrorCard error={mutation.error} />
        <ErrorCard error={deleteMutation.error} />

        <Form.Submit>
          {({ isSubmitting, handleDirtySubmit, isDirty }) => (
            <View
              row
              gap="$3"
              p="$3"
              btw={1}
              boc="$borderColor"
              themeInverse={isDirty}
              bg="$color1"
              ai="center"
            >
              <Button
                loading={isSubmitting}
                themeInverse
                disabled={!isDirty}
                onPress={handleDirtySubmit(async (data) => {
                  await mutation.mutateAsync({ plan_id: planId, patch: data })
                })}
              >
                <ButtonText>Save Changes</ButtonText>
              </Button>
              <View grow>{isDirty && <Text>Unsaved changes</Text>}</View>
              <Button onPress={() => deleteMutation.mutate({ plan_id: planId })} theme="red">
                <ButtonText>Delete Plan</ButtonText>
              </Button>
            </View>
          )}
        </Form.Submit>
      </View>
    </Form.RootProvider>
  )
}
