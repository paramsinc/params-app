import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Input } from 'app/ds/Input'
import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { TextArea } from 'app/ds/TextArea'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { env } from 'app/env'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { slugify } from 'app/trpc/slugify'

const { useMutation } = api.createProfile

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function NewProfileForm({
  onDidCreateProfile,
}: {
  onDidCreateProfile: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
}) {
  const me = api.me.useQuery()
  const mutation = useMutation({
    onSuccess: onDidCreateProfile,
  })

  // TODO loading state
  if (me.data === undefined) return null

  // TODO if me.data is undefined...throw

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider>
            <Form.Controller
              name="name"
              rules={{ required: true }}
              defaultValue={[me.data?.first_name, me.data?.last_name].filter(Boolean).join(' ')}
              render={({ field, fieldState }) => {
                const nameValue = field.value
                return (
                  <>
                    <Card theme={fieldState.error ? 'red' : undefined}>
                      <Card.Title>Profile Name</Card.Title>
                      <Input
                        onChangeText={field.onChange}
                        value={nameValue}
                        placeholder="Developer Name"
                        ref={field.ref}
                      />

                      <Card.Description>
                        This is the name that will be displayed on your profile. Either your
                        personal name or company name, depending on what users should see.
                      </Card.Description>
                    </Card>

                    <Form.Controller
                      name="slug"
                      rules={{ required: 'Please enter a slug' }}
                      defaultValue={slugify(nameValue)}
                      render={({ field, fieldState }) => (
                        <Card theme={fieldState.error ? 'red' : undefined}>
                          <Card.Title>Slug</Card.Title>
                          <View row gap="$1" ai="center">
                            <Card.Description>{env.APP_URL}/@</Card.Description>
                            <Input
                              // TODO native pre-fabric...
                              onChangeText={(next) => field.onChange(slugify(next))}
                              onChange={(e) => e.preventDefault()}
                              value={field.value ?? ''}
                              placeholder="slug"
                              ref={field.ref}
                            />
                          </View>

                          <Card.Description>The public URL for your profile.</Card.Description>
                        </Card>
                      )}
                    />
                  </>
                )
              }}
            />

            <Form.Controller
              name="bio"
              render={({ field, fieldState }) => (
                <Card theme={fieldState.error ? 'red' : undefined}>
                  <Card.Title>Bio (Markdown)</Card.Title>
                  <TextArea
                    onChangeText={field.onChange}
                    value={field.value ?? ''}
                    placeholder="Enter a bio..."
                    styled
                    ref={field.ref}
                  />
                </Card>
              )}
            />

            <Form.Submit>
              {({ isSubmitting, handleSubmit }) => (
                <Button
                  loading={isSubmitting || mutation.isPending}
                  als="flex-start"
                  onPress={handleSubmit(async ({ name, slug, bio }) => {
                    mutation.mutate({
                      name,
                      slug,
                      bio,
                    })
                  })}
                >
                  <ButtonText>Submit</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>

        <ErrorCard error={mutation.error} />
      </Scroll>
    </View>
  )
}

const CardFrame = styled(View, {
  p: '$3',
  bw: 1,
  boc: '$borderColor',
  // borderRadius: '$3',
  bg: '$color1',
  gap: '$3',
})

const CardTitle = styled(Text, {
  bold: true,
  color: '$color11',
})

const CardDescription = styled(Text, {})

const Card = withStaticProperties(CardFrame, {
  Title: CardTitle,
  Description: CardDescription,
})
