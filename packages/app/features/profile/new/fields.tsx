import { Input } from 'app/ds/Input'
import { TextArea } from 'app/ds/TextArea'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { FormCard } from 'app/features/profile/new/layout'
import useDebounce from 'app/helpers/use-debounce'
import { api } from 'app/trpc/client'
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
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Title>Profile Name</FormCard.Title>
      <Input onChangeText={onChange} value={name} placeholder="Developer Name" ref={inputRef} />

      <FormCard.Description>
        This is the name that will be displayed on your profile. Either your personal name or
        company name, depending on what users should see.
      </FormCard.Description>
    </FormCard>
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
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Title>Bio (Markdown)</FormCard.Title>
      <TextArea
        onChangeText={onChange}
        value={bio ?? ''}
        placeholder="Enter a bio..."
        styled
        ref={inputRef}
      />
    </FormCard>
  )
}
export const ProfileSlugField = ({
  slug,
  onChange,
  error,
  inputRef,
  reservedSlug,
}: {
  slug: string
  onChange: (slug: string) => void
  error?: { message?: string }
  inputRef: any
  reservedSlug?: string
}) => {
  const isAvailableQuery = api.isProfileSlugAvailable.useQuery(
    { slug: useDebounce(slug) },
    {
      placeholderData: (previous) => previous,
      enabled: !!slug && slug !== reservedSlug,
    }
  )

  return (
    <FormCard
      theme={
        error
          ? 'red'
          : isAvailableQuery.isFetching
          ? undefined
          : isAvailableQuery.data === true
          ? 'green'
          : isAvailableQuery.data === false
          ? 'red'
          : undefined
      }
    >
      <FormCard.Title>Slug</FormCard.Title>
      <View row gap="$1" ai="center">
        <FormCard.Description>{env.APP_URL}/@</FormCard.Description>
        <Input
          onChangeText={(next) => onChange(slugify(next))}
          onChange={(e) => e.preventDefault()}
          value={slug}
          placeholder="slug"
          ref={inputRef}
        />
      </View>
      {isAvailableQuery.data != null && (
        <View o={isAvailableQuery.isFetching ? 0 : 1}>
          {isAvailableQuery.data === true ? (
            <FormCard.Description color="$color11">
              Congrats, that slug is available!
            </FormCard.Description>
          ) : (
            <FormCard.Description color="$color11">
              This slug is already taken...
            </FormCard.Description>
          )}
        </View>
      )}
    </FormCard>
  )
}
