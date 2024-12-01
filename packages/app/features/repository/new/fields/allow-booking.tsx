import { Card } from 'app/ds/Form/layout'
import { Switch } from 'app/ds/Switch'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { api } from 'app/trpc/client'
import { useId } from 'react'

export function RepoAllowBookingForMainProfileField({
  profileSlug,
  value,
  onChange,
}: {
  profileSlug: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <Card row gap="$3">
      <View flex={1} gap="$3">
        <Card.Title htmlFor={id} tag="label">
          Enable bookings for main profile (recommended)
        </Card.Title>
        <Card.Description>
          When enabled, a button will appear on your repository that lets people book a call with{' '}
          <Card.Description bold textDecorationLine="underline" textDecorationColor="$color12">
            @{profileSlug}
          </Card.Description>
          .
        </Card.Description>
      </View>
      <Switch checked={value} onCheckedChange={onChange} id={id} />
    </Card>
  )
}

export function RepoAllowBookingForMemberPersonalProfilesField({
  profileSlug,
  value,
  onChange,
}: {
  profileSlug: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  const membersQuery = api.profileMembersBySlug.useQuery({ profile_slug: profileSlug })
  const members = membersQuery.data
  const id = useId()

  return (
    <Card row gap="$3">
      <View flex={1} gap="$3">
        <Card.Title htmlFor={id} tag="label">
          Allow bookings for individual team members
        </Card.Title>
        <Card.Description>
          When enabled, a button will appear on your repository that lets people book a call with
          any of the individual team members of{' '}
          <Card.Description bold textDecorationLine="underline" textDecorationColor="$color12">
            @{profileSlug}
          </Card.Description>
          . This is recommended for team profiles with multiple members.
        </Card.Description>

        {value === true && members && (
          <>
            <View h={2} bg="$borderColor" />
            <Text color="$color11">
              The following individual team {members.length === 1 ? 'member' : 'members'} can get
              booked for a call from this repository, as long as they create a personal profile on{' '}
              {env.APP_NAME}:
            </Text>
            <View>
              {members.map((member) => (
                <View key={member.id} gap="$2">
                  <Text>
                    → {member.first_name} {member.last_name}
                    {!member.user_id && (
                      <Text color="$red11">(Needs to sign up for {env.APP_NAME})</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
      <Switch checked={value} onCheckedChange={onChange} id={id} />
    </Card>
  )
}
