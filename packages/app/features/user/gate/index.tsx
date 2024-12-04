import { Auth } from 'app/auth'
import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { BackgroundGradient } from 'app/ds/Gradient/BackgroundGradient'
import { Input } from 'app/ds/Input'
import { Logo } from 'app/ds/Logo'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { queryClient } from 'app/trpc/client/query-client'
import { GetQueryData, getQueryKey, setQueryData } from 'app/trpc/keys'

const { useMutation } = api.createMe

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function UserGate({
  children,
  loading = null,
}: {
  children: React.ReactNode
  loading?: React.ReactElement | null
}) {
  const auth = Auth.useUser()
  const me = api.me.useQuery(undefined, {
    enabled: auth.isSignedIn,
  })
  const createMe = useMutation({
    onSuccess(data, variables, context) {
      const key = getQueryKey(api.me, undefined, 'query')
      queryClient.setQueryData(key, data satisfies GetQueryData<typeof api.me>)
    },
  })
  if (me.data) {
    return <>{children}</>
  }
  if (auth.isSignedIn) {
    if (me.isPending) {
      return loading
    }
    return (
      <View grow>
        <Scroll centerContent>
          <View p="$3" w="100%" maw={700} gap="$3" als="center">
            <Text>Confirming your account details...</Text>
            <Form.RootProvider
              defaultValues={{
                first_name: auth.userFirstName,
                last_name: auth.userLastName,
              }}
            >
              <View gap="$2">
                <Form.Controller
                  name="first_name"
                  rules={{ required: 'First name is required' }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      theme={fieldState.error ? 'red' : undefined}
                      placeholder="First name"
                    />
                  )}
                />
                <Form.Controller
                  name="last_name"
                  rules={{ required: 'Last name is required' }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      theme={fieldState.error ? 'red' : undefined}
                      placeholder="Last name"
                    />
                  )}
                />
              </View>
              <ErrorCard error={createMe.error} />
              <Form.Submit>
                {(form) => {
                  return (
                    <Button
                      loading={createMe.isPending ?? me.isPending}
                      onPress={form.handleSubmit(async (data) => {
                        await createMe.mutateAsync(data)
                      })}
                      als="flex-start"
                      themeInverse
                    >
                      <ButtonText>Save</ButtonText>
                    </Button>
                  )
                }}
              </Form.Submit>
            </Form.RootProvider>
          </View>
        </Scroll>
      </View>
    )
  }

  if (auth.hasLoaded) {
    return (
      <View grow>
        <BackgroundGradient />
        <Scroll centerContent p="$3">
          <View
            p="$4"
            py="$5"
            bw={0.5}
            boc="$color7"
            w="100%"
            maw={700}
            gap="$3"
            als="center"
            br="$4"
            $platform-web={{
              backdropFilter: 'blur(50px)',
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            <Text center>Log in or sign up to continue to {env.APP_NAME}.</Text>
            <View row gap="$2" center>
              <Auth.AuthFlowTrigger action="sign in">
                <Button inverse>
                  <ButtonText>Log In</ButtonText>
                </Button>
              </Auth.AuthFlowTrigger>
              <Auth.AuthFlowTrigger>
                <Button inverse>
                  <ButtonText>Sign Up</ButtonText>
                </Button>
              </Auth.AuthFlowTrigger>
            </View>
          </View>
        </Scroll>
      </View>
    )
  }

  return <>{loading}</>
}
