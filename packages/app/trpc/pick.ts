import { schema } from 'app/db/db'
import { keys } from 'app/helpers/object'

export const pick = <
  Table extends keyof typeof schema,
  Columns extends Partial<{
    [key in keyof (typeof schema)[Table]]: true
  }>
>(
  table: Table,
  customSchema: Columns
): {
  [Column in Extract<
    // loop over each column in the schema[Table]
    Exclude<keyof (typeof schema)[Table], '$inferInsert' | '$inferSelect' | '_'>,
    // but only include the ones in the sharedSchemaByTable[Table][Columns]
    // if we just looped over this one, it didn't work for some reason
    // so we use extract instead
    keyof Columns
  >]: (typeof schema)[Table][Column]
} => {
  return Object.fromEntries(
    keys(customSchema).map((column) => [
      column,
      // @ts-ignore
      schema[table][column],
    ])
  ) as any
}
