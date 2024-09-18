import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import { env } from 'app/env'

export * as d from 'drizzle-orm'

const sql = neon(env.SERVER_NEON_DATABASE_URL!)

export const db = drizzle(sql, { schema })

export { schema }
