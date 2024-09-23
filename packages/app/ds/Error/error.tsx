import type { useQuery } from '@tanstack/react-query'
type Props = {
  error?: null | NetworkError | Error | { message?: string }
  render: (error: string[], singleMessage: string) => React.ReactNode
  hideFieldAccessErrors?: boolean
}

export type NetworkError = NonNullable<ReturnType<typeof useQuery>['error']>

type ErrorType = NetworkError | null | Error | { message?: string } | undefined

export function getErrorMessages(error?: ErrorType): string[]
export function getErrorMessages(error: ErrorType, join: string): string
export function getErrorMessages(
  error: ErrorType,
  join: undefined,
  hideFieldAccessErrors: boolean
): string[]
export function getErrorMessages(
  error?: ErrorType,
  join?: string,
  hideFieldAccessErrors = false
): string | string[] {
  const messages: Array<string> = []

  if (error instanceof Error) {
    messages.push(error.message)
  } else if (error && typeof error === 'object') {
    if (
      'body' in error &&
      typeof error.body === 'object' &&
      error.body &&
      'detail' in error.body &&
      typeof error.body.detail === 'string'
    ) {
      messages.push(error.body.detail)
    } else if (
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      !messages.length
    ) {
      messages.push(error.message)
    }
  }

  if (join) {
    return messages.join(join)
  }

  return messages
}

export function NetworkError({ error, render, hideFieldAccessErrors = false }: Props) {
  const messages = getErrorMessages(error, undefined, hideFieldAccessErrors)

  if (messages.length) {
    const array = Array.from(new Set(messages))
    return <>{render(array, array.join('\n'))}</>
  }

  return null
}
