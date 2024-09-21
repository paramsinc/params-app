import { selects } from 'app/db/inserts-and-selects'

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
      cal_com_access_token: true,
      cal_com_account_id: true,
      created_at: true,
      last_updated_at: true,
      // cal_com_refresh_token: true,
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
      name: true,
      created_at: true,
      last_updated_at: true,
      github_url: true,
    },
  },
} satisfies Partial<{
  [key in keyof typeof selects]: {
    [type: string]: Partial<Record<keyof Zod.infer<(typeof selects)[key]>, true>>
  }
}>
