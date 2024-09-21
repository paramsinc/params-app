import { d, db, schema } from 'app/db/db'
import { env } from 'app/env'
import { serverEnv } from 'app/env/env.server'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'
import type { NextApiRequest, NextApiResponse } from 'next'

async function createCalcomAccount({
  email,
  name,
  timeFormat = '12',
  weekStart = 'Monday',
  timeZone = 'Europe/London',
}: {
  email: string
  name: string | undefined
  timeFormat?: '12' | '24'
  weekStart?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  timeZone?: string
}): Promise<
  | {
      status: 'success'
      data: {
        user: {
          id: number
          email: string
          username: string
        }
        accessToken: string
        refreshToken: string
      }
    }
  | { status: 'error' }
> {
  console.log('[calcom][env]', serverEnv)

  return fetch(`https://api.cal.com/v2/oauth-clients/${env.CAL_COM_CLIENT_ID}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cal-secret-key': serverEnv.CAL_COM_CLIENT_SECRET,
    },
    body: JSON.stringify({
      email,
      name,
      //   timeFormat,
      //   weekStart,
      //   timeZone,
    }),
  }).then((res) => res.json())
}

/**
 * From the OpenAPI spec (but not the docs lol):
 * 
 * The point of creating schedules is for event types to be available at specific times.

  First goal of schedules is to have a default schedule. If you are platform customer and created managed users, then it is important to note that each managed user should have a default schedule.
  1. If you passed `timeZone` when creating managed user, then the default schedule from Monday to Friday from 9AM to 5PM will be created with that timezone. Managed user can then change the default schedule via `AvailabilitySettings` atom.
  2. If you did not, then we assume you want that user has specific schedule right away. You should create default schedule by specifying
  `"isDefault": true` in the request body. Until the user has a default schedule that user can't be booked or manage his / her schedule via the AvailabilitySettings atom.

  Second goal is to create other schedules that event types can point to, so that when that event is booked availability is not checked against the default schedule but against that specific schedule.
  After creating a non default schedule you can update event type to point to that schedule via the PATCH `event-types/{eventTypeId}` endpoint.

  When specifying start time and end time for each day use 24 hour format e.g. 08:00, 15:00 etc.
 */
async function createCalcomScheduleForAccount({ accessToken }: { accessToken: string }): Promise<{
  name: string
  timeZone: string
  isDefault: boolean
}> {
  return fetch(`${env.CAL_COM_API_URL}/schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cal-api-version': '2024-06-11',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: 'Default Schedule',
      timeZone: 'America/New_York',
      isDefault: true,
    }),
  }).then((res) => res.json())
}

/**
 * This should get exported.
 */
export async function createCalcomAccountAndSchedule(
  props: Parameters<typeof createCalcomAccount>[0]
) {
  const calcomAccount = await createCalcomAccount(props)

  if (calcomAccount.status !== 'success') {
    throw new Error('Failed to create cal account')
  }

  const calcomSchedule = await createCalcomScheduleForAccount({
    accessToken: calcomAccount.data.accessToken,
  })

  console.log(
    '[calcom][createCalcomAccountAndSchedule][calcomSchedule]',
    JSON.stringify(calcomSchedule, null, 2)
  )

  return { calcomAccount, calcomSchedule }
}

export async function refreshCalcomTokenAndUpdateProfile(
  accessToken: string
): Promise<{ accessToken: string } | null> {
  console.log('[calcom][refreshToken][accessToken]', accessToken)
  console.log('[calcom][refreshToken][env]', env, '\n\n\n')
  const profile = await db.query.profiles.findFirst({
    where(fields, { eq }) {
      return eq(fields.cal_com_access_token, accessToken)
    },
  })

  console.log('[calcom][refreshToken][profile]', profile)

  if (!profile?.cal_com_refresh_token) {
    console.error('User not found or refresh token missing')
    return null
  }

  // Make a request to Cal.com to refresh the token
  let response = await fetch(`${env.CAL_COM_API_URL}/oauth/${env.CAL_COM_CLIENT_ID}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cal-secret-key': serverEnv.CAL_COM_CLIENT_SECRET,
    },
    body: JSON.stringify({
      clientId: env.CAL_COM_CLIENT_ID,
      clientSecret: serverEnv.CAL_COM_CLIENT_SECRET,
      refreshToken: profile.cal_com_refresh_token,
    }),
  })

  if (!response.ok && profile.cal_com_account_id) {
    response = await fetch(
      `${env.CAL_COM_API_URL}/oauth/${env.CAL_COM_CLIENT_ID}/users/${profile.cal_com_account_id}/force-refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cal-secret-key': serverEnv.CAL_COM_CLIENT_SECRET,
        },
      }
    )
  }

  const calResponse: {
    status: 'success'
    data: {
      accessToken: string
      refreshToken: string
    }
  } = await response.json()

  console.log('[calcom][refreshToken][calResponse]', calResponse.data)

  if (calResponse.status !== 'success' || !calResponse.data?.refreshToken) {
    throw new Error('Failed to refresh token')
  }

  // Update the user's tokens in the database
  await db
    .update(schema.profiles)
    .set({
      cal_com_access_token: calResponse.data.accessToken,
      cal_com_refresh_token: calResponse.data.refreshToken,
    })
    .where(d.eq(schema.profiles.id, profile.id))
    .execute()

  return { accessToken: calResponse.data.accessToken }
}

export function deleteCalcomAccount(userId: number) {
  return fetch(`${env.CAL_COM_API_URL}/oauth-clients/${env.CAL_COM_CLIENT_ID}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-cal-secret-key': serverEnv.CAL_COM_CLIENT_SECRET,
    },
  }).then((res) => res.json())
}

export async function getCalcomUsers(): Promise<{
  status: 'success'
  data: {
    users: {
      id: number
      email: string
      username: string
    }[]
  }
}> {
  return fetch(`${env.CAL_COM_API_URL}/oauth-clients/${env.CAL_COM_CLIENT_ID}/users`, {
    headers: {
      'Content-Type': 'application/json',
      'x-cal-secret-key': serverEnv.CAL_COM_CLIENT_SECRET,
    },
  }).then((res) => res.json())
}

export async function getCalcomUser(userId: number): Promise<
  | {
      status: 'success'
      data: {
        id: number
        email: string
        username: string
      }
    }
  | {
      status: 'error'
      error: string
    }
> {
  return fetch(`${env.CAL_COM_API_URL}/oauth-clients/${env.CAL_COM_CLIENT_ID}/users/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-cal-secret-key': serverEnv.CAL_COM_CLIENT_SECRET,
    },
  }).then((res) => res.json())
}

// https://github.com/calcom/atoms-examples/blob/main/cal-sync/src/pages/api/refresh.ts
export async function calcomRefreshToken_NextHandler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization

  const accessToken = authHeader?.split('Bearer ')[1]

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const result = await refreshCalcomTokenAndUpdateProfile(accessToken)

  if (result) {
    return res.status(200).json({ accessToken: result.accessToken })
  } else {
    return res.status(400).json({ error: 'Failed to refresh token', accessToken: '' })
  }
}

export const calCom = {}
