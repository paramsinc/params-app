import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { View } from 'app/ds/View'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { PlanPriceField, PlanDurationField } from 'app/features/plan/update/fields'

const { useMutation } = api.createOnetimePlan

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function CreateOnetimePlanForm({
  profileId,
  onDidCreatePlan,
}: {
  profileId: string
  onDidCreatePlan: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
}) {
  const mutation = useMutation({
    onSuccess: onDidCreatePlan,
  })

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider
            defaultValues={{
              currency: 'usd',
            }}
          >
            <Form.Controller
              name="price"
              rules={{ required: 'Price is required' }}
              render={({ field, fieldState }) => (
                <PlanPriceField
                  price={field.value === null ? null : field.value ?? 0}
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
                  minutes={field.value === null ? null : field.value ?? 0}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />

            <ErrorCard error={mutation.error} />

            <Form.Submit>
              {({ isSubmitting, handleSubmit }) => (
                <Button
                  loading={isSubmitting || mutation.isPending}
                  onPress={handleSubmit(async (data) => {
                    await mutation.mutateAsync({ ...data, profile_id: profileId })
                  })}
                  inverse
                >
                  <ButtonText>Create Plan</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>
      </Scroll>
    </View>
  )
}
