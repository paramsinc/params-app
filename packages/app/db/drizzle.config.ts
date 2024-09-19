import { env } from 'app/env'
import { defineConfig } from 'drizzle-kit'
import * as path from 'path'

const dirname = __dirname

const dbUrl = env.SERVER_DATABASE_URL!

const password = dbUrl.split('@')[1]!
const database = dbUrl.split('/')[1]!
const user = dbUrl.split(':')[0]!
const host = dbUrl.split(':')[1]!.split('/')[0]!

export default defineConfig({
  schema: path.resolve(dirname, 'schema.ts'),
  out: path.resolve(dirname, 'drizzle'),
  dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
  dbCredentials: {
    host,
    user,
    password,
    database,
  },
})
