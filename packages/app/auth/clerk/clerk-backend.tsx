import { makeBackendAuth } from 'app/auth/make-auth'
import { getAuth } from '@clerk/nextjs/server'

export default makeBackendAuth({
  async authenticateNextApiRequest(req) {
    const res = getAuth(req)

    return {
      userId: res.userId,
    }
  },
})
