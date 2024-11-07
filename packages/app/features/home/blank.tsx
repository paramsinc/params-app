import { Button, ButtonText } from 'app/ds/Button'
import { Card } from 'app/ds/Form/layout'
import { Input } from 'app/ds/Input'
import { Logo } from 'app/ds/Logo'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { useHotKeys } from 'app/helpers/use-hotkeys'
import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { useRouter } from 'app/navigation/use-router'
import { useRef, useState } from 'app/react'
import { H1, Form, AnimatePresence } from 'tamagui'
import ReCAPTCHA from 'react-google-recaptcha'
import { env } from 'app/env'
import { useThemeName } from 'app/ds/useThemeName'
import { api } from 'app/trpc/client'
import { ErrorCard } from 'app/ds/Error/card'

export function BlankHome() {
  const router = useRouter()
  // const keys = useHotKeys(
  //   'f',
  //   useLatestCallback(() => {
  //     router.push('/@francois')
  //   })
  // )
  return (
    <View grow center>
      <View w="100%" p="$4" als="center" maw={800} gap="$4">
        <Text bold tag="h1" fontSize={24}>
          Open source, code-reviewed AI starter templates.
        </Text>
        <WaitlistForm />
      </View>
    </View>
  )
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const captcha = useRef<ReCAPTCHA>(null)
  const theme = useThemeName()
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false)
  const mutation = api.joinWaitlist.useMutation()

  if (mutation.data?.email) {
    return (
      <Card theme="green">
        <Text bold color="$color11">
          You're on the waitlist.
        </Text>

        <Text>
          You'll get an email at <Text bold>{mutation.data.email}</Text> when approved.
        </Text>
      </Card>
    )
  }

  const submit = async () => {
    const captchaValue = await captcha.current?.executeAsync()
    if (captchaValue) {
      mutation.mutate({ email, captcha: captchaValue })
    } else {
      alert('Captcha expired, please try refreshing.')
    }
  }

  return (
    <AnimatePresence exitBeforeEnter>
      {mutation.data ? (
        <Card
          theme="green"
          key="success"
          enterStyle={{ opacity: 0, y: 10 }}
          o={1}
          y={0}
          animation="quick"
        >
          <Text bold color="$color11">
            You're on the waitlist.
          </Text>

          <Text>
            You'll get an email at <Text bold>{mutation.data.email}</Text> when approved.
          </Text>
        </Card>
      ) : (
        <Form
          key="form"
          onSubmit={async () => {
            await submit()
          }}
        >
          <Card
            // need to animate to fix tamagui flicker for light/dark mode
            enterStyle={{ opacity: 0, y: 10 }}
            o={isRecaptchaReady ? 1 : 0}
            y={isRecaptchaReady ? 0 : 10}
            animation="quick"
            exitStyle={{ opacity: 0, y: 10 }}
          >
            <Input
              placeholder="fernando@params.com"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => {
                submit()
              }}
              autoComplete="email"
            />
            <Form.Trigger asChild>
              <Button als="flex-start" loading={mutation.isPending} disabled={!isRecaptchaReady}>
                <ButtonText>Join Waitlist</ButtonText>
              </Button>
            </Form.Trigger>

            <ErrorCard error={mutation.error} />
          </Card>
          <ReCAPTCHA
            ref={captcha}
            size="invisible"
            sitekey={env.RECAPTCHA_SITE_KEY}
            theme={theme?.includes('dark') ? 'dark' : 'light'}
            asyncScriptOnLoad={() => setIsRecaptchaReady(true)}
            style={{ display: 'none' }}
          />
        </Form>
      )}
    </AnimatePresence>
  )
}
