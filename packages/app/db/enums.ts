import type { schema } from 'app/db/db'

export type Currency = (typeof schema.profileOnetimePlans.currency)['enumValues'][number]
