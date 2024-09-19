import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import { serverEnv } from 'app/env/env.server'

export * as d from 'drizzle-orm'

const sql = neon(serverEnv.NEON_DATABASE_URL)

export const db = drizzle(sql, { schema })

export { schema }
