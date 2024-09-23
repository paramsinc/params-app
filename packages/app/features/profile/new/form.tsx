import { Input } from 'app/ds/Input'
import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { env } from 'app/env'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { slugify } from 'app/trpc/slugify'

const { useMutation } = api.createProfile

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function NewProfileForm() {
  const me = api.me.useQuery()
  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider>
            <Form.Controller
              name="name"
              rules={{ required: true }}
              render={({ field, fieldState }) => {
                const nameValue =
                  field.value ?? [me.data?.first_name, me.data?.last_name].filter(Boolean).join(' ')
                return (
                  <>
                    <Card theme={fieldState.error ? 'red' : undefined}>
                      <Card.Title>Profile Name</Card.Title>
                      <Input
                        onChangeText={field.onChange}
                        value={nameValue}
                        placeholder="Developer Name"
                      />

                      <Card.Description>
                        This is the name that will be displayed on your profile. Either your
                        personal name or company name, depending on what users should see.
                      </Card.Description>
                    </Card>

                    <Form.Controller
                      name="slug"
                      rules={{ required: true }}
                      render={({ field, fieldState }) => (
                        <Card theme={fieldState.error ? 'red' : undefined}>
                          <Card.Title>Slug</Card.Title>
                          <View row gap="$1" ai="center">
                            <Card.Description>{env.APP_URL}/@</Card.Description>
                            <Input
                              // TODO native pre-fabric...
                              onChangeText={(next) => field.onChange(slugify(next))}
                              onChange={(e) => e.preventDefault()}
                              value={field.value ?? slugify(nameValue)}
                              placeholder="developer-name"
                            />
                          </View>

                          <Card.Description>The public URL for your profile</Card.Description>
                        </Card>
                      )}
                    />
                  </>
                )
              }}
            />
          </Form.RootProvider>
        </View>
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
