export type MutationParams<
  T extends {
    useMutation: (...args: any) => { mutate: (...args: any) => any }
  }
> = Parameters<ReturnType<T['useMutation']>['mutate']>[0]
