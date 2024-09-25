import { db, schema } from 'app/db/db'
import { inserts } from 'app/db/inserts-and-selects'
import { fakeRepoImages } from 'app/features/home/fakeRepoImages'
import { fakeRepos } from 'app/features/home/fakeRepos'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import {
  createCalcomAccountAndSchedule,
  deleteCalcomAccount,
  getCalcomUsers,
} from 'app/trpc/routes/cal-com'
import { slugify } from 'app/trpc/slugify'

const run = async () => {
  const calcomUsers = await getCalcomUsers()
  console.log('[calcomUsers]', calcomUsers)
  const deletedProfiles = await db.delete(schema.profiles).returning().execute()
  for (const profile of deletedProfiles) {
    profile.cal_com_account_id && (await deleteCalcomAccount(profile.cal_com_account_id))
  }

  const promises = await Promise.all(
    fakeRepos.map(async (repo) => {
      const profileName = repo.user_name
      const { calcomAccount } = await createCalcomAccountAndSchedule({
        email: `seed-data+${profileName.toLowerCase().replaceAll(' ', '_')}@params.com`,
        name: profileName,
      })
      const stripeConnectAccountId = await stripe.accounts
        .create({
          controller: {
            stripe_dashboard: {
              type: 'express',
            },
            fees: {
              payer: 'application',
            },
            losses: {
              payments: 'application',
            },
          },
        })
        .then((res) => res.id)
      return {
        name: profileName,
        slug: slugify(profileName),
        image_vendor: 'raw',
        image_vendor_id: fakeRepoImages[repo.user_name as keyof typeof fakeRepoImages],
        stripe_connect_account_id: stripeConnectAccountId,
        ...(calcomAccount.status === 'success' && {
          calcom_account_id: calcomAccount.data.user.id,
          cal_com_access_token: calcomAccount.data.accessToken,
          cal_com_refresh_token: calcomAccount.data.refreshToken,
        }),
      } satisfies Zod.infer<typeof inserts.profiles>
    })
  )

  await db.insert(schema.profiles).values(promises)
}

run()
