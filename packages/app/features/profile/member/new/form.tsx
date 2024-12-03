import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Input } from 'app/ds/Input'
import { Scroll } from 'app/ds/Scroll'
import { View } from 'app/ds/View'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'

const { useMutation } = api.createProfileMember

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function CreateProfileMemberForm({
  profileId,
  onDidCreateMember,
}: {
  profileId: string
  onDidCreateMember: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
}) {
  const mutation = useMutation({
    onSuccess: onDidCreateMember,
  })

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider
            defaultValues={{
              profile_id: profileId,
              email: '',
              first_name: '',
              last_name: '',
            }}
          >
            <Card>
              <Card.Title>Email</Card.Title>
              <Form.Controller
                name="email"
                rules={{ required: 'Email is required' }}
                render={({ field, fieldState }) => (
                  <Input
                    placeholder="member@company.com"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error}
                    inputRef={field.ref}
                  />
                )}
              />
            </Card>

            <Card>
              <Card.Title>First Name</Card.Title>
              <Form.Controller
                name="first_name"
                rules={{ required: 'First name is required' }}
                render={({ field, fieldState }) => (
                  <Input
                    placeholder="John"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error}
                    inputRef={field.ref}
                  />
                )}
              />
            </Card>

            <Card>
              <Card.Title>Last Name</Card.Title>
              <Form.Controller
                name="last_name"
                rules={{ required: 'Last name is required' }}
                render={({ field, fieldState }) => (
                  <Input
                    placeholder="Doe"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error}
                    inputRef={field.ref}
                  />
                )}
              />
            </Card>

            <ErrorCard error={mutation.error} />

            <Form.Submit>
              {({ isSubmitting, handleSubmit }) => (
                <Button
                  loading={isSubmitting || mutation.isPending}
                  als="flex-start"
                  onPress={handleSubmit(async (data) => {
                    await mutation.mutateAsync({
                      ...data,
                      profile_id: profileId,
                    })
                  })}
                  themeInverse
                >
                  <ButtonText>Add Member</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>
      </Scroll>
    </View>
  )
}
