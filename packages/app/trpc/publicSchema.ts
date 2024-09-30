import type { selects } from 'app/db/inserts-and-selects'

export const publicSchema = {
  users: {
    UserPublic: {
      id: true,
      slug: true,
      first_name: true,
      last_name: true,
      created_at: true,
      last_updated_at: true,
    },
  },
  profiles: {
    ProfileInternal: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      github_username: true,
      image_vendor: true,
      image_vendor_id: true,
      created_at: true,
      last_updated_at: true,
      availability_ranges: true,
    },
    ProfilePublic: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      github_username: true,
      image_vendor: true,
      image_vendor_id: true,
      created_at: true,
      last_updated_at: true,
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
      created_at: true,
      last_updated_at: true,
      github_url: true,
      index: true,
    },
  },
  offers: {
    OfferPublic: {
      id: true,
      profile_id: true,
      created_at: true,
      last_updated_at: true,
    },
  },
} satisfies Partial<{
  [table in keyof typeof selects]: {
    [t: string]: Partial<Record<keyof Zod.infer<(typeof selects)[table]>, true>>
  }
}>
