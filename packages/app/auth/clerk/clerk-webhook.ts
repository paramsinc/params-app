import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { serverEnv } from 'app/env/env.server'
import { d, db, schema } from 'app/db/db'
import { createUser } from 'app/trpc/routes/user'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = serverEnv.CLERK_WEBHOOK_SECRET

  // Get the Svix headers for verification
  const svix_id = req.headers.get('svix-id') as string
  const svix_timestamp = req.headers.get('svix-timestamp') as string
  const svix_signature = req.headers.get('svix-signature') as string

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 })
  }

  // Get the body
  const body = await req.text()

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
    return new Response('Error verifying webhook', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { email_addresses, first_name, last_name, id } = evt.data

    const email = email_addresses[0]?.email_address
    if (!email) {
      return
    }

    // disable webhook user creation
    // await createUser({
    //   id,
    //   email,
    //   first_name: first_name ?? 'New User',
    //   last_name: last_name ?? '',
    // })
  } else if (evt.type === 'user.updated') {
    const user = evt.data
    const { email_addresses, first_name, last_name, id } = user
    const email = email_addresses[0]?.email_address

    await db
      .update(schema.users)
      .set({
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        email: email || undefined,
      })
      .where(d.eq(schema.users.id, id))
  } else if (evt.type === 'user.deleted') {
    const { id } = evt.data

    if (id) await db.delete(schema.users).where(d.eq(schema.users.id, id))
  }

  return new Response('Success', { status: 200 })
}
