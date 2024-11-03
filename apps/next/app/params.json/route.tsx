import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const fileTree = z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())]))

export const paramsJson = z
  .object({
    docs: z.object({
      main: z.string(),
      sidebar: z.record(z.string(), z.union([z.string(), fileTree])),
    }),
    notebook: z
      .object({
        steps: z.array(z.object({ file: z.string() })),
      })
      .partial(),
  })
  .describe('Describe your Params repository.')

const jsonSchema = zodToJsonSchema(paramsJson, 'paramsJson')

export function GET() {
  return Response.json(jsonSchema)
}
