import { d, db, schema } from 'app/db/db'
import { env } from 'app/env'
import { serverEnv } from 'app/env/env.server'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'
import type { NextApiRequest, NextApiResponse } from 'next'

export async function createCalcomAccount({
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
      //   name,
      //   timeFormat,
      //   weekStart,
      //   timeZone,
    }),
  }).then((res) => res.json())
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
