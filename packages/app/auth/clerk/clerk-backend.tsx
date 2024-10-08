import { makeBackendAuth } from 'app/auth/make-auth'
import { getAuth, createClerkClient } from '@clerk/nextjs/server'
import { serverEnv } from 'app/env/env.server'

export default makeBackendAuth({
  async authenticateNextApiRequest(req) {
    const { userId } = getAuth(req, {
      secretKey: serverEnv.CLERK_SECRET_KEY,
    })
    const clerk = createClerkClient({
      secretKey: serverEnv.CLERK_SECRET_KEY,
    })

    const user = userId ? await clerk.users.getUser(userId) : null

    return {
      userId,
      userFirstName: user?.firstName ?? undefined,
      userLastName: user?.lastName ?? undefined,
      userEmail: user?.emailAddresses?.[0]?.emailAddress ?? undefined,
    }
  },
})
