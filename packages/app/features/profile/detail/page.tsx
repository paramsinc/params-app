import { Auth } from 'app/auth'
import { Button, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { ErrorCard } from 'app/ds/Error/card'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { Calcom } from 'app/features/cal-com/cal-com'
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
import { api } from 'app/trpc/client'
import { getConfig } from 'tamagui'

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
        <View row jbtwn ai="center" flexWrap="wrap">
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
              <UpdateProfileModal.Content profileSlug={profileSlug} />
            </UpdateProfileModal>
            <LinkButton href={`/@${profile.slug}`}>
              <ButtonText>View Public Profile</ButtonText>
            </LinkButton>
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
                <View key={repo.id} p="$3" bg="$color1" row jbtwn ai="center">
                  <Text>{repo.slug}</Text>

                  {!!repo.github_url && (
                    <LinkButton href={repo.github_url} target="_blank">
                      <ButtonText>View on GitHub</ButtonText>
                    </LinkButton>
                  )}
                </View>
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
                <View row key={member.id} p="$3" bg="$color1" ai="center">
                  <View grow>
                    <Text>
                      {member.first_name} {member.last_name}
                    </Text>
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
                </View>
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
        {null && (
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
      </View>
      {null && <Calcom.CalendarSettings />}
    </Calcom.Provider>
  )
}
