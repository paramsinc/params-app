import { zodToJsonSchema } from 'zod-to-json-schema'
import { paramsJsonShape } from 'app/features/spec/params-json-shape'

const jsonSchema = zodToJsonSchema(paramsJsonShape, 'paramsJson')

export function GET() {
  return Response.json(jsonSchema)
}
