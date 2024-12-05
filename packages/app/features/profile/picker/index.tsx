import { DropdownMenu } from 'app/ds/DropdownMenu'
import { Lucide } from 'app/ds/Lucide'
import { NewProfileModal, NewProfileModalContent } from 'app/features/profile/new/modal'
import { imageLoader } from 'app/image/loader'
import { api } from 'app/trpc/client'
import { useState } from 'app/react'

export function ProfilePicker({
  profileId,
  onChangeProfileId,
  children,
}: {
  profileId: string | null | undefined
  onChangeProfileId: (profileId: string) => void
  children: React.ReactElement
}) {
  const myProfiles = api.myProfiles.useQuery()
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)

  return (
    <>
      <NewProfileModal open={isCreatingProfile} onOpenChange={setIsCreatingProfile}>
        <NewProfileModalContent
          onDidCreateProfile={({ profile }) => {
            onChangeProfileId(profile.id)
            setIsCreatingProfile(false)
          }}
        />
      </NewProfileModal>
      <DropdownMenu>
        <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Label>Select a profile</DropdownMenu.Label>
          {(myProfiles.data?.length ?? 0) > 0 && (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Group>
                {myProfiles.data?.map((profile) => {
                  const loader = profile.image_vendor
                    ? imageLoader[profile.image_vendor]
                    : undefined
                  return (
                    <DropdownMenu.CheckboxItem
                      key={profile.id}
                      value={profile.id === profileId}
                      onValueChange={(value) => onChangeProfileId(profile.id)}
                    >
                      <DropdownMenu.ItemTitle>{`@${profile.slug}`}</DropdownMenu.ItemTitle>
                    </DropdownMenu.CheckboxItem>
                  )
                })}
              </DropdownMenu.Group>
            </>
          )}
          <DropdownMenu.Separator />
          <DropdownMenu.Item key="create-new-profile" onSelect={() => setIsCreatingProfile(true)}>
            <DropdownMenu.ItemIcon icon={Lucide.Plus} />
            <DropdownMenu.ItemTitle>Create new profile</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </>
  )
}
