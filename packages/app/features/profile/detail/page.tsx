import { Button, ButtonText } from 'app/ds/Button'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { Calcom } from 'app/features/cal-com/cal-com'
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
  const reposQuery = api.reposByProfileSlug.useQuery({ profile_slug: profileSlug })
  const profileQuery = api.profileBySlug.useQuery({ slug: profileSlug })
  const members = api.profileMembersBySlug.useQuery({ profile_slug: profileSlug })
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
    return null
  }
  const profile = profileQuery.data
  return (
    <Calcom.Provider profileSlug={profileSlug}>
      <View gap="$4">
        <View>
          <Text bold>{profile.name}</Text>
          <Text>@{profile.slug}</Text>
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

          {reposQuery.data?.length === 0 && <Text>No repositories found</Text>}
          {!!reposQuery.data?.length && (
            <View gap="$1">
              {reposQuery.data?.map((repo) => (
                <View key={repo.id} p="$3" bg="$color1">
                  <Text>{repo.slug}</Text>
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

          {members.data?.length === 0 && <Text>No members found</Text>}
          {!!members.data?.length && (
            <View gap="$1">
              {members.data?.map((member) => (
                <View row key={member.id} p="$3" bg="$color1" ai="center">
                  <View grow>
                    <Text>
                      {member.first_name} {member.last_name}
                    </Text>
                  </View>
                  <Button
                    theme="red"
                    loading={deleteProfileMember.isPending}
                    onPress={() => {
                      deleteProfileMember.mutate({ id: member.id })
                    }}
                  >
                    <ButtonText>Remove</ButtonText>
                  </Button>
                </View>
              ))}
            </View>
          )}
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
