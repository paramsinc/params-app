import { Auth } from 'app/auth'
import { Button, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { ErrorCard } from 'app/ds/Error/card'
import { Image } from 'app/ds/Image'
import { Modal } from 'app/ds/Modal'
import { Open, OpenContent, OpenTrigger } from 'app/ds/Open'
import { Page } from 'app/ds/Page'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { Calcom } from 'app/features/cal-com/cal-com'
import { Card } from 'app/ds/Form/layout'
import {
  ConnectAccountModal,
  ConnectAccountModalContent,
  ConnectAccountModalTrigger,
} from 'app/features/profile/stripe/modal'
import { UpdateProfileModal } from 'app/features/profile/update/modal'
import {
  NewRepositoryModal,
  NewRepositoryModalContent,
  NewRepositoryModalTrigger,
} from 'app/features/repository/new/modal'
import { createParam } from 'app/navigation/use-params'
import { useRouter } from 'app/navigation/use-router'
import { api } from 'app/trpc/client'
import { Fragment } from 'react'
import { formatMinutes } from 'app/features/profile/detail/book/page'
import {
  formatCurrencyInteger,
  formatUSD,
} from 'app/features/stripe-connect/checkout/success/formatUSD'
import { UpdateOnetimePlanModal } from 'app/features/plan/update/modal'
import { CreateOnetimePlanForm } from 'app/features/plan/new/form'
import {
  CreateOnetimePlanModal,
  CreateOnetimePlanModalContent,
  CreateOnetimePlanModalTrigger,
} from 'app/features/plan/new/modal'
import {
  UpdateRepositoryModal,
  UpdateRepositoryModalContent,
  UpdateRepositoryModalTrigger,
} from 'app/features/repository/update/modal'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPage() {
  const { params } = useParams()

  if (!params.profileSlug) {
    return null
  }

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
  const me = api.me.useQuery()
  const reposQuery = api.reposByProfileSlug.useQuery({ profile_slug: profileSlug })
  const profileQuery = api.profileBySlug.useQuery({ slug: profileSlug })
  const members = api.profileMembersBySlug.useQuery({ profile_slug: profileSlug })
  const router = useRouter()
  const connectAccountQuery = api.profileConnectAccount.useQuery(
    { profile_slug: profileSlug },
    {
      trpc: {
        context: {
          batch: false,
        },
      },
    }
  )
  const { toast } = useToast()
  const deleteProfileMember = api.deleteProfileMember.useMutation({
    onSuccess: () => {
      toast({ preset: 'done', title: 'Member removed' })
    },
    onError: (e) => {
      toast({ preset: 'error', title: 'Failed to remove member', message: e.message })
    },
  })
  if (!profileQuery.data) {
    return <ErrorCard error={profileQuery.error} />
  }
  const profile = profileQuery.data
  return (
    <Calcom.Provider profileSlug={profileSlug}>
      <View gap="$4">
        <View gap="$3" $gtMd={{ row: true }}>
          <View $gtMd={{ grow: true }}>
            <View aspectRatio={16 / 9} bg="$color3">
              {profile.image_vendor_id && profile.image_vendor ? (
                <Image
                  src={profile.image_vendor_id}
                  loader={profile.image_vendor}
                  contentFit="cover"
                  fill
                  sizes="(min-width: 1200px) 80vw, 100vw"
                />
              ) : null}
            </View>
          </View>
          <View $md={{ row: true, jbtwn: true }} $gtMd={{ w: 400 }} gap="$3">
            <View>
              <Text bold>{profile.name}</Text>
              <Text>@{profile.slug}</Text>
            </View>

            <View row gap="$1">
              <UpdateProfileModal>
                <UpdateProfileModal.Trigger>
                  <Button>
                    <ButtonText>Edit</ButtonText>
                  </Button>
                </UpdateProfileModal.Trigger>
                <UpdateProfileModal.Content
                  profileSlug={profileSlug}
                  onDidUpdateProfile={(patch) => {
                    if (patch.slug !== profile.slug) {
                      router.replace(`/dashboard/profiles/${patch.slug}`)
                    }
                  }}
                />
              </UpdateProfileModal>
              <LinkButton href={`/@${profile.slug}`}>
                <ButtonText>View Public Profile</ButtonText>
              </LinkButton>
            </View>
          </View>
        </View>

        <View h={2} bg="$borderColor" />
        <View gap="$3">
          <View row ai="center" jbtwn>
            <Text bold>Repositories</Text>

            <NewRepositoryModal>
              <NewRepositoryModalTrigger>
                <Button>
                  <ButtonText>Add Repository</ButtonText>
                </Button>
              </NewRepositoryModalTrigger>

              <NewRepositoryModalContent profileId={profile.id} />
            </NewRepositoryModal>
          </View>

          {reposQuery.data?.length === 0 && <Text color="$color11">Add your first repository</Text>}
          {!!reposQuery.data?.length && (
            <View gap="$1">
              {reposQuery.data?.map((repo) => (
                <Card key={repo.id} row ai="center">
                  <View grow>
                    <Card.Title>{repo.slug}</Card.Title>
                  </View>

                  {!!repo.github_url && (
                    <LinkButton href={repo.github_url} target="_blank">
                      <ButtonText>GitHub</ButtonText>
                    </LinkButton>
                  )}
                  <UpdateRepositoryModal>
                    <UpdateRepositoryModalTrigger>
                      <Button>
                        <ButtonText>Edit</ButtonText>
                      </Button>
                    </UpdateRepositoryModalTrigger>
                    <UpdateRepositoryModalContent repoId={repo.id} />
                  </UpdateRepositoryModal>
                </Card>
              ))}
            </View>
          )}
        </View>

        <View h={2} bg="$borderColor" />
        <View gap="$3">
          <View row ai="center" jbtwn>
            <Text bold>Members</Text>
          </View>

          {members.data?.length === 0 && <Text color="$color11">Add your first member</Text>}
          {!!members.data?.length && (
            <View gap="$1">
              {members.data?.map((member) => (
                <Card key={member.id} row jbtwn ai="center">
                  <View grow>
                    <Card.Title>
                      {member.first_name} {member.last_name}
                    </Card.Title>
                    <Text color="$color11">{member.email}</Text>
                  </View>

                  <Button
                    theme="red"
                    loading={
                      deleteProfileMember.isPending &&
                      deleteProfileMember.variables.id === member.id
                    }
                    onPress={() => {
                      deleteProfileMember.mutate({ id: member.id })
                    }}
                  >
                    <ButtonText>{member.user_id === me.data?.id ? 'Leave' : 'Remove'}</ButtonText>
                  </Button>
                </Card>
              ))}
            </View>
          )}
        </View>

        <View h={2} bg="$borderColor" />
        <View
          gap="$3"
          theme={
            connectAccountQuery.data?.payouts_enabled === false
              ? 'red'
              : connectAccountQuery.data?.payouts_enabled === true
              ? 'green'
              : undefined
          }
        >
          <View row ai="center" jbtwn>
            <Text bold>Payouts</Text>

            <ConnectAccountModal>
              <ConnectAccountModalTrigger>
                <Button
                  themeInverse={connectAccountQuery.data?.payouts_enabled === false}
                  loading={connectAccountQuery.isLoading}
                >
                  <ButtonText>Configure</ButtonText>
                </Button>
              </ConnectAccountModalTrigger>
              <ConnectAccountModalContent profileSlug={profileSlug} />
            </ConnectAccountModal>
          </View>

          {connectAccountQuery.data?.payouts_enabled === false ? (
            <Text color="$color11">
              You cannot receive payouts. Please complete your payment onboarding.
            </Text>
          ) : connectAccountQuery.data?.payouts_enabled === true ? (
            <Text color="$color11">Payouts configured successfully.</Text>
          ) : null}
        </View>
        <View h={2} bg="$borderColor" />
        <View row ai="center" jbtwn>
          <Text bold>Plans</Text>

          <CreateOnetimePlanModal>
            <CreateOnetimePlanModalTrigger>
              <Button>
                <ButtonText>Add Plan</ButtonText>
              </Button>
            </CreateOnetimePlanModalTrigger>
            <CreateOnetimePlanModalContent profileId={profile.id} />
          </CreateOnetimePlanModal>
        </View>
        <PlansInternal profileSlug={profileSlug} />
        <View h={2} bg="$borderColor" />
        <Open>
          <View row ai="center" jbtwn>
            <View grow>
              <Text>Calendar Settings</Text>
              <Text color="$color11">
                Sync Google Calendar, block off dates, and set your availability.
              </Text>
            </View>
            <OpenTrigger>
              <Button>
                <ButtonText>Settings</ButtonText>
              </Button>
            </OpenTrigger>
          </View>
          <OpenContent>
            {true && <Calcom.CalendarSettings />}
            <Calcom.Connect.Google />
            {true && (
              <Calcom.AvailabilitySettings
                enableOverrides={true}
                customClassNames={{
                  subtitlesClassName: 'text-red-500',
                  ctaClassName: 'border p-4 rounded-md',
                  editableHeadingClassName: 'underline font-semibold',
                }}
                onUpdateSuccess={() => {
                  console.log('Updated successfully')
                }}
                onUpdateError={() => {
                  console.log('update error')
                }}
                onDeleteError={() => {
                  console.log('delete error')
                }}
                onDeleteSuccess={() => {
                  console.log('Deleted successfully')
                }}
              />
            )}
          </OpenContent>
        </Open>
      </View>
    </Calcom.Provider>
  )
}

function PlansInternal({ profileSlug }: { profileSlug: string }) {
  const plansQuery = api.onetimePlansByProfileSlug_public.useQuery({ profile_slug: profileSlug })

  const plans = plansQuery.data
  if (!plans) {
    return <ErrorCard error={plansQuery.error} />
  }
  return (
    <View gap="$1">
      {plans.length === 0 ? (
        <Text>Time to create your first plan</Text>
      ) : (
        <>
          {plans.map((plan) => {
            return (
              <Fragment key={plan.id}>
                <Card row>
                  <View grow gap="$3">
                    <Card.Title>{plan.duration_mins} Minute Call</Card.Title>
                    <Card.Description>
                      {formatCurrencyInteger[plan.currency]?.format(plan.price / 100)}
                    </Card.Description>
                  </View>

                  <UpdateOnetimePlanModal>
                    <UpdateOnetimePlanModal.Trigger>
                      <Button>
                        <ButtonText>Edit</ButtonText>
                      </Button>
                    </UpdateOnetimePlanModal.Trigger>

                    <UpdateOnetimePlanModal.Content planId={plan.id} />
                  </UpdateOnetimePlanModal>
                </Card>
              </Fragment>
            )
          })}
        </>
      )}
    </View>
  )
}
