import { InferQueryLikeData, QueryLike } from '@trpc/react-query/shared'
import { getQueryKey } from '@trpc/react-query'
import { api } from 'app/trpc/client'
import { queryClient } from 'app/trpc/client/query-client'

type ExtractProcedure<P extends any> = P extends QueryLike<any, infer TProcedure>
  ? TProcedure
  : never

export function setQueryData<Procedure>(
  data: GetQueryData<Procedure>,
  args: Parameters<typeof getQueryKey<any>>
) {
  return queryClient.setQueryData(getQueryKey(...(args as any)), data)
}

export type GetQueryData<Procedure> = InferQueryLikeData<Procedure>

export { getQueryKey }
