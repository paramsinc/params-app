import { useRegisterTarget, useScrollTo } from '@nandorojo/anchor'
import { NetworkError } from 'app/ds/Error/error'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { ComponentProps, useEffect, useId } from 'react'

export const ErrorCard = function ErrorCard({
  error,
  disableScrollToOnError,
  children,
  ...props
}: Omit<ComponentProps<typeof View>, 'children'> & {
  error: null | Error | undefined | { message?: string }
  disableScrollToOnError?: boolean
  children?: React.ReactNode | ((message: string) => React.ReactNode)
}) {
  const name = useId()
  const { register } = useRegisterTarget()
  const shouldScroll = !disableScrollToOnError && !!error
  const { scrollTo } = useScrollTo()
  useEffect(
    function scroll() {
      if (shouldScroll) {
        scrollTo(name, {
          offset: -100,
        })
      }
    },
    [scrollTo, shouldScroll, name]
  )
  return (
    <NetworkError
      error={error}
      render={(_, message) => {
        return (
          <View
            br="$3"
            bw={0.7}
            p="$2"
            ref={register(name)}
            theme="red"
            boc="$color5"
            {...props}
            bg="$color3"
            gap="$2"
          >
            <Text color="$color11">{message}</Text>
            {typeof children == 'function' ? children(message) : children}
          </View>
        )
      }}
    />
  )
}
