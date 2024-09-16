export function select<T extends string, const Results extends Record<T, any>>(
  string: T,
  options: Results
): Results[T] {
  return options[string]
}

export function selectPartial<UsedKeys extends string, Options extends { [key in UsedKeys]?: any }>(
  string: UsedKeys,
  options: Options
): UsedKeys extends keyof Options ? Options[UsedKeys] : undefined {
  return options[string]
}
