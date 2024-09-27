import { Button, ButtonText } from 'app/ds/Button'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'
import { Modal, ModalBackdrop, ModalContent, ModalDialog, ModalTrigger } from 'app/ds/Modal'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { imageLoader } from 'app/image/loader'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { Highlight, themes } from 'prism-react-renderer'
import { LinkButton } from 'app/ds/Button/link'
import { platform } from 'app/ds/platform'
import * as linking from 'expo-linking'
import { env } from 'app/env'
import { useState } from 'app/react'
import { StripeCheckout } from 'app/features/stripe-connect/checkout/checkout'
import { Scroll } from 'app/ds/Scroll'
import { StripeProvider_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/provider'
import { StripeCheckoutForm_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/checkout'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPublicPage() {
  const { params } = useParams()

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <Content profileSlug={params.profileSlug} />
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

function Content({ profileSlug }: { profileSlug: string }) {
  const profileQuery = api.profileBySlug_public.useQuery(
    { profile_slug: profileSlug },
    {
      enabled: !!profileSlug,
    }
  )
  if (!profileQuery.data) {
    return null
  }
  const profile = profileQuery.data
  const loader =
    profile.image_vendor && imageLoader[profile.image_vendor as keyof typeof imageLoader]
  const repos = profile.repos
  return (
    <View gap="$4" maw="$marketingPageWidth" als="center" w="100%">
      <View gap="$3" $gtMd={{ row: true }}>
        <View $gtMd={{ grow: true }}>
          <View aspectRatio={16 / 9} bg="$borderColor">
            {!!profile.image_vendor && !!profile.image_vendor_id && (
              <Image
                fill
                loader={profile.image_vendor}
                src={profile.image_vendor_id}
                alt={profile.name}
                contentFit="cover"
                sizes="(max-width: 1200px) 100vw, 60vw"
              />
            )}
            <View stretch center>
              <View br="$rounded" box={75} bg="white" center pl={2}>
                <Lucide.Play color="black" size={29} />
              </View>
            </View>
          </View>
        </View>
        <View $gtMd={{ width: '40%' }} gap="$4">
          <View>
            <Text bold fontSize={24} fontFamily="$body">
              {profile.name}
            </Text>
          </View>

          {/* <CreateBooking profileSlug={profileSlug} /> */}
          {/* <CreateBooking_ConfirmOnBackend profileId={profile.id} /> */}
          <CreateBooking_Link profileSlug={profileSlug} />
          <View gap="$3">
            <Text color="$color11" bold>
              About
            </Text>
            <Text>{profile.bio}</Text>
          </View>
        </View>
      </View>

      <View gap="$3">
        <Text bold>Repositories</Text>
        <View gap="$1">
          {repos.map((repo, i) => (
            <View key={repo.id} p="$3" bg="$color2" gap="$3" bw={2} boc="$borderColor">
              <View row gap="$3" ai="flex-start">
                <View grow>
                  <Text color="$color11">{`#${repo.index.toString().padStart(3, '0')} `}</Text>
                  <Text textDecorationLine="underline" textDecorationColor="transparent">
                    <Text bold>{repo.slug}</Text>{' '}
                  </Text>

                  <Text>
                    <Text gap="$1" color="$color11">
                      by {profile.name}
                    </Text>
                  </Text>
                </View>
                {!!repo.github_url && (
                  <View>
                    <LinkButton href={repo.github_url} target="_blank" als="flex-start">
                      <ButtonText>view code on github</ButtonText>
                    </LinkButton>
                  </View>
                )}
              </View>
              <Highlight
                theme={themes.shadesOfPurple}
                code={`import wandb
from wandb.integration.keras import WandbMetricsLogger, WandbModelCheckpoint
​
wandb.login()`}
                language="python"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre style={{ ...style, padding: '8px 0', maxWidth: 800, display: 'none' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        <span style={{ width: 30, display: 'inline-block', paddingLeft: 6 }}>
                          {i + 1}
                        </span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

// TODO make this a page
const CreateBooking = ({ profileSlug }: { profileSlug: string }) => {
  const profileQuery = api.profileBySlug_public.useQuery({ profile_slug: profileSlug })
  const sessionMutation = api.createProfileCheckoutSession.useMutation()
  const profile = profileQuery.data
  const clientSecret = sessionMutation.data?.clientSecret
  return (
    <Modal
      open={clientSecret != null}
      onOpenChange={(next) => {
        if (!next) {
          sessionMutation.reset()
        }
      }}
    >
      <Button
        themeInverse
        loading={sessionMutation.isPending}
        disabled={!profile}
        onPress={() => {
          if (!profile) {
            return
          }
          const route = `/booking-checkout/success?session_id={CHECKOUT_SESSION_ID}`
          sessionMutation.mutate({
            profile_id: profile.id,
            return_success_url:
              platform.OS === 'web'
                ? `${window.location.origin}${route}`
                : `https://${env.APP_URL}${route}`,
          })
        }}
      >
        <ButtonText>Book a Call ($425+)</ButtonText>
      </Button>
      <ModalContent>
        <ModalBackdrop />
        <ModalDialog>
          <Modal.Dialog.HeaderSmart title="Book a Call" />
          <Scroll>
            <StripeCheckout clientSecret={clientSecret} />
          </Scroll>
        </ModalDialog>
        {/* <View pointerEvents="box-none" grow center>
          {calUserQuery.data && (
            <Calcom.Booker eventSlug="sixty-minutes-video" username={calUserQuery.data?.username} />
          )}
        </View> */}
      </ModalContent>
    </Modal>
  )
}

const CreateBooking_ConfirmOnBackend = ({ profileId }: { profileId: string | undefined }) => {
  return (
    <Modal>
      <ModalTrigger>
        <Button themeInverse disabled={!profileId}>
          <ButtonText>Book a Call ($425+)</ButtonText>
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalBackdrop />
        <ModalDialog>
          <Modal.Dialog.HeaderSmart title="Book a Call" />
          <Scroll>
            <StripeProvider_ConfirmOnBackend amountCents={425_00} currency="usd">
              <View p="$3">
                {profileId ? (
                  <StripeCheckoutForm_ConfirmOnBackend
                    profile_id={profileId}
                    organization_id={null}
                  />
                ) : null}
              </View>
            </StripeProvider_ConfirmOnBackend>
          </Scroll>
        </ModalDialog>
      </ModalContent>
    </Modal>
  )
}

const CreateBooking_Link = ({ profileSlug }: { profileSlug: string }) => {
  return (
    <LinkButton themeInverse href={`/@${profileSlug}/book`}>
      <ButtonText>Book a Call ($425+)</ButtonText>
    </LinkButton>
  )
}
