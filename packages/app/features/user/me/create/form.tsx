import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { View } from 'app/ds/View'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import {
  UserFirstNameField,
  UserLastNameField,
  UserEmailField,
} from 'app/features/user/me/create/fields'
import { Auth } from 'app/auth'
import { Empty, EmptyCard, EmptyCardTitle } from 'app/ds/Empty'
import { Scroll } from 'app/ds/Scroll'

const { useMutation } = api.createMe

const Form = makeForm<NonNullable<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>>()

export function CreateMeForm({
  onDidCreateUser,
}: {
  onDidCreateUser: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
}) {
  const mutation = useMutation({
    onSuccess: onDidCreateUser,
  })
  const auth = Auth.useUser()

  if (!auth.hasLoaded) {
    return null
  }

  if (!auth.isSignedIn) {
    return (
      <Empty>
        <EmptyCard>
          <EmptyCardTitle>Sign Up / Log In</EmptyCardTitle>

          <Auth.AuthFlowTrigger>
            <Button>
              <ButtonText>Continue</ButtonText>
            </Button>
          </Auth.AuthFlowTrigger>
        </EmptyCard>
      </Empty>
    )
  }

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider
            defaultValues={{
              email: auth.userEmail,
              first_name: auth.userFirstName,
              last_name: auth.userLastName,
            }}
          >
            <Form.Controller
              name="first_name"
              rules={{ required: 'First name is required' }}
              render={({ field, fieldState }) => (
                <UserFirstNameField
                  firstName={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />

            <Form.Controller
              name="last_name"
              rules={{ required: 'Last name is required' }}
              render={({ field, fieldState }) => (
                <UserLastNameField
                  lastName={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />

            <Form.Controller
              name="email"
              rules={{ required: 'Email is required' }}
              render={({ field, fieldState }) => (
                <UserEmailField
                  email={field.value ?? ''}
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
                    mutation.mutate(data)
                  })}
                  inverse
                >
                  <ButtonText>Save & Continue</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>
      </Scroll>
    </View>
  )
}
