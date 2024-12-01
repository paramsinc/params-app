import type { selects } from 'app/db/inserts-and-selects'

export const publicSchema = {
  bookings: {
    BookingPublic: {
      id: true,
      start_datetime: true,
      duration_minutes: true,
      timezone: true,
      canceled_at: true,
      google_calendar_event_id: true,
      offer_id: true,
      organization_id: true,
      profile_id: true,
    },
  },
  users: {
    UserPublic: {
      id: true,
      slug: true,
      first_name: true,
      last_name: true,
      // created_at: true,
      // last_updated_at: true,
    },
  },
  profiles: {
    ProfileInternal: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      short_bio: true,
      github_username: true,
      image_vendor: true,
      image_vendor_id: true,
      availability_ranges: true,
      timezone: true,
      personal_profile_user_id: true,
    },
    ProfilePublic: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      short_bio: true,
      github_username: true,
      image_vendor: true,
      image_vendor_id: true,
      timezone: true,
    },
  },
  profileMembers: {
    ProfileMemberInternal: {
      id: true,
      profile_id: true,
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
    ProfileMemberPublic: {
      id: true,
      profile_id: true,
      user_id: true,
      first_name: true,
      last_name: true,
    },
  },
  repositories: {
    RepositoryPublic: {
      id: true,
      profile_id: true,
      slug: true,
      // created_at: true,
      // last_updated_at: true,
      github_url: true,
      index: true,
    },
  },
  offers: {
    OfferPublic: {
      id: true,
      profile_id: true,
      // created_at: true,
      // last_updated_at: true,
    },
  },
} satisfies Partial<{
  [table in keyof typeof selects]: {
    [t: string]: Partial<Record<keyof Zod.infer<(typeof selects)[table]>, true>>
  }
}>

type Intersection<T> = {
  [K in AllKeys<T>]: T[K]
}

type AllKeys<T> = T extends any ? keyof T : never

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

type Pretty<T> = {
  [K in keyof T]: T[K]
}
export type shape = Pretty<
  UnionToIntersection<
    {
      [table in keyof typeof publicSchema]: {
        [schema in keyof (typeof publicSchema)[table]]: (typeof publicSchema)[table][schema]
      }
    }[keyof typeof publicSchema]
  >
>
