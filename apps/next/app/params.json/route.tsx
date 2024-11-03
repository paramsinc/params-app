import { z } from 'zod'

export function GET() {
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