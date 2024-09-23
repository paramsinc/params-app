import { Input } from 'app/ds/Input'
import { TextArea } from 'app/ds/TextArea'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { ProfileFormCard } from 'app/features/profile/new/layout'
import { slugify } from 'app/trpc/slugify'

export const ProfileNameField = ({
  name,
  onChange,
  error,
  inputRef,
}: {
  name: string
  onChange: (name: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <ProfileFormCard theme={error ? 'red' : undefined}>
      <ProfileFormCard.Title>Profile Name</ProfileFormCard.Title>
      <Input onChangeText={onChange} value={name} placeholder="Developer Name" ref={inputRef} />

      <ProfileFormCard.Description>
        This is the name that will be displayed on your profile. Either your personal name or
        company name, depending on what users should see.
      </ProfileFormCard.Description>
    </ProfileFormCard>
  )
}
export const ProfileBioField = ({
  bio,
  onChange,
  error,
  inputRef,
}: {
  bio: string | undefined
  onChange: (bio: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <ProfileFormCard theme={error ? 'red' : undefined}>
      <ProfileFormCard.Title>Bio (Markdown)</ProfileFormCard.Title>
      <TextArea
        onChangeText={onChange}
        value={bio ?? ''}
        placeholder="Enter a bio..."
        styled
        ref={inputRef}
      />
    </ProfileFormCard>
  )
}
export const ProfileSlugField = ({
  slug,
  onChange,
  error,
  inputRef,
}: {
  slug: string
  onChange: (slug: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <ProfileFormCard theme={error ? 'red' : undefined}>
      <ProfileFormCard.Title>Slug</ProfileFormCard.Title>
      <View row gap="$1" ai="center">
        <ProfileFormCard.Description>{env.APP_URL}/@</ProfileFormCard.Description>
        <Input
          onChangeText={(next) => onChange(slugify(next))}
          onChange={(e) => e.preventDefault()}
          value={slug}
          placeholder="slug"
          ref={inputRef}
        />
      </View>
    </ProfileFormCard>
  )
}
