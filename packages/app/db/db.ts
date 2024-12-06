import { neonConfig } from '@neondatabase/serverless'
import * as schema from './schema'
import { serverEnv } from 'app/env/env.server'

import ws from 'ws'
neonConfig.webSocketConstructor = ws

export * as d from 'drizzle-orm'
export * as pg from 'drizzle-orm/pg-core'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

const pool = new Pool({ connectionString: serverEnv.DATABASE_URL })
export const db = drizzle(pool, { schema, logger: true })

// import * as schema from './schema'
// import { serverEnv } from 'app/env/env.server'
// import { drizzle } from 'drizzle-orm/neon-http'

// export * as d from 'drizzle-orm'
// export * as pg from 'drizzle-orm/pg-core'

// import { neon } from '@neondatabase/serverless'

// const sql = neon(serverEnv.DATABASE_URL)
// export const db = drizzle(sql, { schema })

// export { schema }
