import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Image } from 'app/ds/Image'
import { Link } from 'app/ds/Link'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
import { View } from 'app/ds/View'
import {
  NewProfileModal,
  NewProfileModalContent,
  NewProfileModalTrigger,
} from 'app/features/profile/new/modal'
import {
  ConnectAccountModal,
  ConnectAccountModalContent,
  ConnectAccountModalTrigger,
} from 'app/features/profile/stripe/modal'
import { useRouter } from 'app/navigation/use-router'
import { api } from 'app/trpc/client'

export function ProfilesListContent() {
  const myProfiles = api.myProfiles.useQuery()
  const router = useRouter()

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content gap="$3">
          {myProfiles.data ? (
            <>
              <Card row ai="center">
                <Card.Title flex={1}>My Profiles</Card.Title>

                <NewProfileModal>
                  <NewProfileModalTrigger>
                    <Button absolute right={0} m="$2" inverse>
                      <ButtonIcon icon={Lucide.Plus} />
                      <ButtonText>New</ButtonText>
                    </Button>
                  </NewProfileModalTrigger>
                  <NewProfileModalContent
                    onDidCreateProfile={({ profile }) => {
                      router.push(`/dashboard/profiles/${profile.slug}`)
                    }}
                  />
                </NewProfileModal>
              </Card>

              <View gap="$1">
                {myProfiles.data?.map((profile) => {
                  const isMissingAvailability = !profile.availability_ranges?.length
                  const isMissingStripePayouts = profile.has_stripe_payouts_enabled !== true
                  return (
                    <Card key={profile.id} gap="$3">
                      <View row gap="$3">
                        <View width={100} height={(100 * 9) / 16} bg="$backgroundStrong">
                          {profile.image_vendor && profile.image_vendor_id ? (
                            <Image
                              loader={profile.image_vendor}
                              src={profile.image_vendor_id}
                              fill
                              sizes="200px"
                              alt={profile.name}
                            />
                          ) : null}
                        </View>
                        <View grow jc="center">
                          <View gap="$2">
                            <Link href={`/@${profile.slug}`}>
                              <Card.Title fontFamily="$mono">@{profile.slug}</Card.Title>
                            </Link>
                            <Card.Description>
                              {profile.short_bio ?? '(Missing mini bio)'}
                            </Card.Description>
                            <Card.Description color="$color11">
                              {profile.personal_profile_user_id != null
                                ? 'Personal Profile'
                                : 'Team Profile'}
                            </Card.Description>
                          </View>
                        </View>

                        <View row gap="$1">
                          <LinkButton href={`/@${profile.slug}`}>
                            <ButtonText>View</ButtonText>
                          </LinkButton>
                          <LinkButton href={`/dashboard/profiles/${profile.slug}`}>
                            <ButtonText>Manage</ButtonText>
                          </LinkButton>
                        </View>
                      </View>

                      <ConnectCard profileSlug={profile.slug} />

                      {isMissingAvailability && (
                        <Card theme="yellow">
                          <Card.Title>Missing Availability</Card.Title>
                          <Card.Description color="$color11">
                            Please set your availability to start receiving bookings. Currently, you
                            have no open time slots.
                          </Card.Description>

                          <LinkButton
                            als="flex-start"
                            inverse
                            href={`/dashboard/availability?profileId=${profile.id}`}
                          >
                            <ButtonText>Set Availability</ButtonText>
                          </LinkButton>
                        </Card>
                      )}
                    </Card>
                  )
                })}
              </View>
            </>
          ) : (
            <ErrorCard error={myProfiles.error} />
          )}
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

function ConnectCard({ profileSlug }: { profileSlug: string }) {
  const query = api.profileConnectAccount.useQuery({ profile_slug: profileSlug })

  if (query.data?.payouts_enabled === false) {
    return (
      <Card theme="red">
        <Card.Title>Enable Payouts</Card.Title>
        <Card.Description color="$color11">
          Payouts are not enabled. Please complete your Stripe onboarding to start accepting
          payments.
        </Card.Description>

        <ConnectAccountModal>
          <ConnectAccountModalTrigger>
            <Button inverse als="flex-start">
              <ButtonText>Complete Stripe Onboarding</ButtonText>
            </Button>
          </ConnectAccountModalTrigger>
          <ConnectAccountModalContent profileSlug={profileSlug} />
        </ConnectAccountModal>
      </Card>
    )
  }
}
