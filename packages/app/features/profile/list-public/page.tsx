import { Card } from 'app/ds/Form/layout'
import { Image } from 'app/ds/Image'
import { Link } from 'app/ds/Link'
import { Page } from 'app/ds/Page'
import { View } from 'app/ds/View'
import { imageLoader } from 'app/image/loader'
import { Fragment } from 'app/react'
import { api } from 'app/trpc/client'

export function ProfilesListPagePublic() {
  const profilesQuery = api.allProfiles_public.useQuery({
    limit: 100,
    offset: 0,
  })

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content gap="$1">
          {profilesQuery.data?.map((profile) => {
            return (
              <Fragment key={profile.id}>
                <Link href={`/@${profile.slug}`}>
                  <Card row gap="$3">
                    <View w={100} h={60} ov="hidden" br="$2">
                      {!!(profile.image_vendor_id && profile.image_vendor) && (
                        <Image
                          src={profile.image_vendor_id}
                          loader={profile.image_vendor}
                          alt={profile.name}
                          fill
                          contentFit="cover"
                          sizes="200px"
                        />
                      )}
                    </View>
                    <View flex={1}>
                      <Card.Label>@{profile.slug}</Card.Label>
                      <Card.Title>{profile.name}</Card.Title>
                      <Card.Description>{profile.short_bio}</Card.Description>
                    </View>
                  </Card>
                </Link>
              </Fragment>
            )
          })}
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
