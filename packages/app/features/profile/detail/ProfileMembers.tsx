import useAreYouSure from 'app/ds/AreYouSure/use-are-you-sure'
import { Button, ButtonText } from 'app/ds/Button'
import { Card } from 'app/ds/Form/layout'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { useRouter } from 'app/navigation/use-router'
import api from 'app/trpc/client/client'

export function ProfileMembers({ profileSlug }: { profileSlug: string }) {
  const { toast } = useToast()
  const members = api.profileMembersBySlug.useQuery({ profile_slug: profileSlug })
  const me = api.me.useQuery()
  const deleteProfileMember = api.deleteProfileMember.useMutation()
  const areYouSure = useAreYouSure()
  const router = useRouter()
  return (
    <>
      {members.data?.length === 0 && <Text color="$color11">Add your first member</Text>}
      {!!members.data?.length && (
        <View gap="$1">
          {members.data?.map((member) => {
            const isMe = member.user_id === me.data?.id
            return (
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
                    deleteProfileMember.isPending && deleteProfileMember.variables.id === member.id
                  }
                  onPress={() => {
                    areYouSure(
                      () =>
                        deleteProfileMember.mutate(
                          { id: member.id },
                          {
                            onSuccess(data, variables, context) {
                              if (isMe) {
                                router.replace('/dashboard/profiles')
                                toast({ preset: 'done', title: 'You have left this profile.' })
                              } else {
                                toast({ preset: 'done', title: 'Member removed' })
                              }
                            },
                          }
                        ),
                      isMe
                        ? {
                            title: `Are you sure you want to leave this profile? This cannot be undone.`,
                            message: `This is permanent! You will lose all access to your repositories and bookings.`,
                            dangerousText: `Yes, I'm sure. Leave profile forever.`,
                          }
                        : {
                            title: `Are you sure you want to remove ${member.first_name} from this profile?`,
                          }
                    )
                  }}
                >
                  <ButtonText>{isMe ? 'Leave' : 'Remove'}</ButtonText>
                </Button>
              </Card>
            )
          })}
        </View>
      )}
    </>
  )
}
