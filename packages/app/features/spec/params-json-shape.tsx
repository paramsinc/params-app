import { z } from 'zod'

const fileTree = z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())]))

export const paramsJsonShape = z
  .object({
    $schema: z.string().optional(),
    docs: z.object({
      main: z.string(),
      sidebar: z.record(z.string(), z.union([z.string(), fileTree])),
      youtube: z
        .object({
          video_id: z.string(),
          start_time: z.number().optional(),
          thumbnail_url: z.string().optional(),
        })
        .optional(),
    }),
    notebook: z
      .object({
        steps: z.array(z.object({ file: z.string() })),
      })
      .optional(),
  })
  .describe('Describe your Params repository and auto-generate docs.')
