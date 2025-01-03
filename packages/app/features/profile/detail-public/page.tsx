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
import { env } from 'app/env'
import { useState } from 'app/react'
import { StripeCheckout } from 'app/features/stripe-connect/checkout/checkout'
import { Scroll } from 'app/ds/Scroll'
import { StripeProvider_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/provider'
import { OfferCheckoutForm_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/checkout'
import { formatCurrencyInteger } from 'app/features/stripe-connect/checkout/success/formatUSD'
import { Link } from 'app/ds/Link'
import { Card } from 'app/ds/Form/layout'
import { MarkdownRenderer } from 'app/features/repository/detail-public/MarkdownRenderer'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPublicPage(props: { profileSlug?: string }) {
  const { params } = useParams()

  return (
    <Page.Root>
      <View
        zIndex={1}
        width="min(90%, 1600px)"
        left="min(10%, 100px)"
        margin="0 auto"
        absolute
        height="100vh"
        top={80}
        pointerEvents="none"
        transform="translate3d(0, 0, 0)"
        opacity={0.15}
        style={{
          filter: 'blur(100px) saturate(150%)',
          backgroundImage: `
    radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
    radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
    radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
    radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
    radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
    radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
    radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
  `,
        }}
      />
      <Page.Scroll>
        <Page.Content>
          <Content profileSlug={params.profileSlug ?? props.profileSlug} />
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
  const repos = profile.repos
  return (
    <View gap="$4" maw="$marketingPageWidth" als="center" w="100%">
      <View gap="$3" $gtMd={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          $gtMd={{
            fg: 1,
            fb: 0,
          }}
        >
          <View bg="$borderColor" aspectRatio={16 / 9}>
            {!!profile.image_vendor && !!profile.image_vendor_id && (
              <Image
                fill
                loader={profile.image_vendor}
                src={profile.image_vendor_id}
                alt={profile.name}
                contentFit="cover"
                sizes="(max-width: 1200px) 100vw, 60vw"
                priority
              />
            )}
          </View>
        </View>
        <View
          $gtMd={{
            width: '40%',
            // position: 'sticky',
            // top: 0,
            als: 'flex-start',
            alignItems: 'flex-start',
          }}
          gap="$3"
        >
          <View>
            <Text bold fontSize={24} fontFamily="$mono">
              {profile.name}
            </Text>
          </View>
          <Text>{profile.short_bio}</Text>

          <CreateBooking_Link profileSlug={profileSlug} />

          <View height={2} bg="$color7" />

          <View gap="$3">
            <Text color="$color11" bold>
              About
            </Text>
            {!!profile.bio && <MarkdownRenderer linkPrefix={``}>{profile.bio}</MarkdownRenderer>}
          </View>
        </View>
      </View>

      <View gap="$3">
        <Text bold>Repositories</Text>
        <View gap="$1">
          {repos.map((repo, i) => (
            <Link href={`/@${profileSlug}/${repo.slug}`} key={repo.id}>
              <Card>
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
              </Card>
            </Link>
          ))}
        </View>
      </View>
    </View>
  )
}

const CreateBooking_Link = ({ profileSlug }: { profileSlug: string }) => {
  const plansQuery = api.onetimePlansByProfileSlug_public.useQuery({
    profile_slug: profileSlug,
  })
  const plans = plansQuery.data
  const lastPlan = plans?.[plans.length - 1]
  return (
    <LinkButton inverse href={`/book/${profileSlug}`}>
      <ButtonText>Book a Call</ButtonText>
    </LinkButton>
  )
}
