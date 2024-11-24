import { Button, ButtonText } from 'app/ds/Button'
import { Card } from 'app/ds/Form/layout'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import api from 'app/trpc/client/client'

export function ProfileMembers({ profileSlug }: { profileSlug: string }) {
  const { toast } = useToast()
  const members = api.profileMembersBySlug.useQuery({ profile_slug: profileSlug })
  const me = api.me.useQuery()
  const deleteProfileMember = api.deleteProfileMember.useMutation({
    onSuccess: () => {
      toast({ preset: 'done', title: 'Member removed' })
    },
  })
  return (
    <>
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
                  deleteProfileMember.isPending && deleteProfileMember.variables.id === member.id
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
    </>
  )
}
