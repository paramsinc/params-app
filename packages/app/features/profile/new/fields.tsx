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
import { Card } from 'app/ds/Form/layout'
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
  return (
    <Dropzone
      disabled={uploadMutation.isPending}
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
          <Card {...(props?.isDragAccept && { theme: 'green' })}>
            <Card.Label>Cover Image</Card.Label>

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

            <Card.Description>
              The main image for your developer profile. Choose a high-res image in 16x9 aspect
              ratio that highlights you personally.
            </Card.Description>

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
          </Card>
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
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>Profile Name</Card.Label>
      <Input onChangeText={onChange} value={name} placeholder="Developer Name" ref={inputRef} />

      <Card.Description>
        This is the name that will be displayed on your profile. Either your personal name or
        company name, depending on what users should see.
      </Card.Description>
    </Card>
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
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>Bio</Card.Label>
      <TextArea
        onChangeText={onChange}
        value={bio ?? ''}
        placeholder="Enter a bio..."
        styled
        ref={inputRef}
      />
    </Card>
  )
}

export const ProfileShortBioField = ({
  shortBio,
  onChange,
  error,
  inputRef,
}: {
  shortBio: string | undefined
  onChange: (shortBio: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  const length = shortBio?.trim().length ?? 0
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>Job Title / Mini Bio</Card.Label>
      <Input
        onChangeText={onChange}
        value={shortBio ?? ''}
        placeholder="ex: Software Engineer @ Params"
        ref={inputRef}
        numberOfLines={2}
      />
      <Card.Description>
        {length}/{ProfileShortBioField.maxLength} characters
      </Card.Description>
      {error && <Card.Description color="$color11">{error.message}</Card.Description>}
    </Card>
  )
}

ProfileShortBioField.maxLength = 100

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
    { slug: useDebounce(slug, 500) },
    {
      enabled: !!slug && slug !== reservedSlug,
      staleTime: 0,
      gcTime: 0,
    }
  )

  return (
    <Card>
      <Card.Label>Slug</Card.Label>
      <View row gap="$1" ai="center">
        <Card.Description>{env.APP_URL}/@</Card.Description>
        <Input
          onChangeText={(next) => onChange(slugify(next))}
          onChange={(e) => e.preventDefault()}
          value={slug}
          placeholder="slug"
          ref={inputRef}
        />
      </View>
      {slug !== reservedSlug && (
        <View
          o={isAvailableQuery.isPending || isAvailableQuery.data == null ? 0 : 1}
          theme={
            error
              ? 'red'
              : isAvailableQuery.isFetching
              ? undefined
              : isAvailableQuery.data?.isAvailable === true
              ? 'green'
              : isAvailableQuery.data?.isAvailable === false
              ? 'red'
              : undefined
          }
        >
          {isAvailableQuery.data?.isAvailable === true ? (
            <Card.Description color="$color11">Congrats, that slug is available!</Card.Description>
          ) : (
            <Card.Description color="$color11">This slug is already taken...</Card.Description>
          )}
        </View>
      )}
    </Card>
  )
}

export const ProfileSocialMediaFields = ({}) => {
  return <View></View>
}

export const ProfilePricePerHourField = ({
  pricePerHourCents,
  onChange,
  error,
}: {
  pricePerHourCents: number | null
  onChange: (pricePerHourCents: number | null) => void
  error: boolean
}) => {
  let num = pricePerHourCents != null ? Number(pricePerHourCents) : null
  let str = num != null && !isNaN(num) ? Math.round(num).toString() : ''
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>Price Per Hour (USD)</Card.Label>
      <View row gap="$1" ai="center">
        <Card.Description>$</Card.Description>
        <Input
          onChange={(e) => e.preventDefault()}
          onChangeText={(next) => (next === '' ? onChange(null) : onChange(parseFloat(next)))}
          value={str}
          placeholder="200"
          keyboardType="numeric"
        />
      </View>
      <Card.Description>How much do you charge per hour to get on a call?</Card.Description>
    </Card>
  )
}
