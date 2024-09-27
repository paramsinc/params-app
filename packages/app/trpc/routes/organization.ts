import { d, db, schema } from 'app/db/db'
import { inserts } from 'app/db/inserts-and-selects'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import { TRPCError } from '@trpc/server'

export function createOrganization({
  insert,
  memberInserts,
}: {
  insert: Zod.infer<typeof inserts.organizations>
  memberInserts: Omit<Zod.infer<typeof inserts.organizationMembers>, 'organization_id'>[]
}) {
  return db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(schema.organizations)
      .values(insert)
      .returning()
      .execute()
    if (!organization) {
      throw new Error('Failed to create organization')
    }
    const members = await tx
      .insert(schema.organizationMembers)
      .values(
        memberInserts.map((member) => ({
          ...member,
          organization_id: organization.id,
        }))
      )
      .execute()

    return { organization, members }
  })
}

export async function getOnlyOrg_OrCreateOrg_OrThrowIfUserHasMultipleOrgs({
  userId,
  transaction: tx,
}: {
  userId: string
  transaction: typeof db
}): Promise<string> {
  const myOrganizations = await tx
    .select()
    .from(schema.organizations)
    .innerJoin(
      schema.organizationMembers,
      d.eq(schema.organizationMembers.organization_id, schema.organizations.id)
    )
    .where(d.eq(schema.organizationMembers.user_id, userId))
    .execute()

  console.log('[myOrganizations]', myOrganizations)

  if (myOrganizations.length === 0) {
    const me = await tx.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })
    if (!me) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found. Please sign in.',
      })
    }
    const { organization, members } = await createOrganization({
      insert: {
        name: `${me.first_name} ${me.last_name}'s Personal Org`,
        stripe_customer_id: await stripe.customers.create().then((customer) => customer.id),
        created_by_user_id: userId,
      },
      memberInserts: [
        {
          email: me.email,
          first_name: me.first_name,
          last_name: me.last_name,
          user_id: userId,
        },
      ],
    })
    return organization.id
  } else if (myOrganizations.length === 1) {
    return myOrganizations[0]!.organizations.id
  } else {
    throw new TRPCError({
      message: 'Please select an organization to use for this offer.',
      code: 'BAD_REQUEST',
    })
  }
}
