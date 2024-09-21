import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextApiRequest, NextApiResponse } from 'next'
import { buffer } from 'micro'
import { serverEnv } from 'app/env/env.server'
import { db, schema } from 'app/db/db'
import { slugify } from 'app/trpc/slugify'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405)
  }
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = serverEnv.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the Svix headers for verification
  const svix_id = req.headers['svix-id'] as string
  const svix_timestamp = req.headers['svix-timestamp'] as string
  const svix_signature = req.headers['svix-signature'] as string

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' })
  }

  console.log('headers', req.headers, svix_id, svix_signature, svix_timestamp)
  // Get the body
  const body = (await buffer(req)).toString()

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If the verification fails, error out and  return error code
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return res.status(400).json({ Error: err })
  }

  // Do something with the payload
  // For this guide, you simply log the payload to the console
  const { id } = evt.data
  const eventType = evt.type
  console.log(`Webhook with and ID of ${id} and type of ${eventType}`)
  console.log('Webhook body:', body)

  if (eventType === 'user.created') {
    const { email_addresses, first_name, last_name, id } = evt.data

    const email = email_addresses[0]?.email_address
    if (!email) {
      return
    }

    let slugSearchCount = 0
    const baseSlug = slugify(
      [first_name, last_name].filter(Boolean).join(' ') ?? Math.round(Math.random() * 1000000)
    )
    let slug = baseSlug
    while (await db.query.users.findFirst({ where: (users, { eq }) => eq(users.slug, slug) })) {
      slugSearchCount++
      slug = `${baseSlug}-${slugSearchCount}`
    }

    await db.insert(schema.users).values({
      first_name: first_name ?? 'New User',
      last_name: last_name ?? '',
      id,
      email,
      slug,
    })
  } else if (eventType === 'user.updated') {
    const user = evt.data
    const { email_addresses, first_name, last_name, id } = user
    const email = email_addresses[0]?.email_address

    await db.update(schema.users).set({
      first_name: first_name ?? undefined,
      last_name: last_name ?? undefined,
      email: email ?? undefined,
    })
  } else if (eventType === 'user.deleted') {
  }

  return res.status(200).json({ response: 'Success' })
}
