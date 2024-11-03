import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const fileTree = z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())]))

const mySchema = z
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

const jsonSchema = zodToJsonSchema(mySchema, 'mySchema')

export function GET() {
  return Response.json(jsonSchema)
  return Response.json({
    docs: {
      main: 'readme.md',
      sidebar: {
        Introduction: 'introduction.md',
        Installation: 'installation.md',
        Serving: {
          Introduction: 'serving/introduction.md',
          Deployment: 'serving/deployment.md',
          Configuration: 'serving/configuration.md',
        },
        Usage: 'usage.md',
        FAQ: 'faq.md',
      },
    },
    notebook: {
      mode: 'generate',
      steps: [{ file: 'notebooks/01-introduction.ipynb' }],
    },
  })
}
