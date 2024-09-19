import { neon, neonConfig } from '@neondatabase/serverless'
import * as schema from './schema'
import { serverEnv } from 'app/env/env.server'

import ws from 'ws'
neonConfig.webSocketConstructor = ws

export * as d from 'drizzle-orm'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

const pool = new Pool({ connectionString: serverEnv.DATABASE_URL })
export const db = drizzle(pool, { schema })

export { schema }
