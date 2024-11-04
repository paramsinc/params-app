import { z } from 'zod'

const fileTree = z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())]))

export const paramsJsonShape = z
  .object({
    docs: z.object({
      main: z.string(),
      sidebar: z.record(z.string(), z.union([z.string(), fileTree])),
      youtube_url: z.string().optional(),
    }),
    notebook: z
      .object({
        steps: z.array(z.object({ file: z.string() })),
      })
      .optional(),
  })
  .describe('Describe your Params repository and auto-generate docs.')
