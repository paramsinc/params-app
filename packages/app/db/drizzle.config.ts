import { env } from 'app/env'
import { serverEnv } from 'app/env/env.server'
import { defineConfig } from 'drizzle-kit'
import * as path from 'path'

const dirname = __dirname

const out = path.resolve(dirname, 'drizzle')

console.log('[db][config]', out)

export default defineConfig({
  // for some reason, drizzle goes back one directory
  schema: 'db/schema.ts',
  out: 'db/drizzle',
  dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
})
