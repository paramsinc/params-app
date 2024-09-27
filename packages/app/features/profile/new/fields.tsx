import { Button, ButtonText } from 'app/ds/Button'
import { Dropzone } from 'app/ds/Dropzone/dropzone'
import { Image } from 'app/ds/Image'
import { Input } from 'app/ds/Input'
import { LoadingSpinner } from 'app/ds/LoadingSpinner'
import { Lucide } from 'app/ds/Lucide'
import { Text } from 'app/ds/Text'
import { TextArea } from 'app/ds/TextArea'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { FormCard } from 'app/features/profile/new/layout'
import useDebounce from 'app/helpers/use-debounce'
import { CDNVendor } from 'app/multi-media/CDNVendor'
import { api } from 'app/trpc/client'
import { slugify } from 'app/trpc/slugify'

type Image = NonNullable<ReturnType<typeof api.uploadImage.useMutation>['data']>

export const ProfileCoverImageField = ({
  image,
  onChange,
  onRemove,
}: {
  image: Image | undefined
  onChange: (image: Image) => void
  onRemove: () => void
}) => {
  const uploadMutation = api.uploadImage.useMutation()
  console.log('')
  return (
    <Dropzone
      onPickImage={(base64) => {
        uploadMutation.mutate(
          { image: base64, vendor: 'cloudinary' },
          {
            onSuccess(data, variables, context) {
              onChange({
                id: data.id,
                vendor: data.vendor,
              })
            },
          }
        )
      }}
      noClick
    >
      {(props) => {
        return (
          <FormCard {...(props?.isDragAccept && { theme: 'green' })}>
            <FormCard.Title>Cover Image</FormCard.Title>

            <View
              aspectRatio={16 / 9}
              bg="$color4"
              borderWidth={3}
              borderColor={props?.isDragActive ? '$color11' : '$color11'}
              borderStyle="dotted"
              onPress={props?.open}
              center
              cursor="press"
            >
              {uploadMutation.variables?.image && uploadMutation.isPending ? (
                <Image
                  fill
                  loader="raw"
                  src={uploadMutation.variables.image}
                  contentFit="cover"
                  alt="profile image"
                />
              ) : image ? (
                <Image
                  fill
                  sizes="1200px"
                  src={image.id}
                  loader={image.vendor}
                  contentFit="cover"
                  alt="profile image"
                />
              ) : (
                <Lucide.Upload />
              )}
            </View>

            <FormCard.Description>
              The main image for your developer profile. Choose a high-res image in 16x9 aspect
              ratio that highlights you personally.
            </FormCard.Description>

            <View row gap="$1" jbtwn ai="center">
              <Button onPress={props?.open}>
                <ButtonText>Select Image</ButtonText>
              </Button>
              {image != null && (
                <Button onPress={onRemove} theme="red">
                  <ButtonText>Remove</ButtonText>
                </Button>
              )}
            </View>
            {uploadMutation.isPending && (
              <View stretch>
                <View o={0.8} bg="$color3" stretch />
                <View grow center>
                  <LoadingSpinner color="$color12" />
                  <Text>Uploading...</Text>
                </View>
              </View>
            )}
          </FormCard>
        )
      }}
    </Dropzone>
  )
}

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
