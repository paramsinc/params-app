'use client'

import { forwardRef } from 'react'
import { TamaguiElement } from 'tamagui'
import { Linking, Platform } from 'react-native'
import { Button } from 'app/ds/Button'
import { platform } from 'app/ds/platform'
import { useLink } from 'solito/link'

export const LinkButton = forwardRef(function LinkButton(
  {
    replace,
    ...props
  }: Omit<React.ComponentProps<typeof Button>, 'href' | 'target'> &
    Parameters<typeof useLink>[0] & {
      target?: '_blank'
    },
  ref: React.Ref<TamaguiElement>
) {
  const link = useLink({ replace, ...props })
  return (
    <Button
      ref={ref}
      {...props}
      {...link}
      onPress={(e) => {
        if (props.onPress) {
          props.onPress(e)
        }
        const isExternalLink = typeof props.href == 'string' && props.href.startsWith('http')
        if (
          // let external links act accordingly
          !isExternalLink
        ) {
          if (props.target === '_blank' && platform.OS === 'web' && !e.defaultPrevented) {
            e.preventDefault()
            window.open(link.href, '_blank')
          } else {
            link.onPress(e)
          }
        } else if (platform.OS !== 'web') {
          // for native apps, open the external link in a browser
          Linking.openURL(link.href)
        }
      }}
      {...(props.disabled && Platform.OS === 'web' && { href: undefined })}
      tag="a"
      hrefAttrs={{
        target: props.target,
        rel: 'noreferrer',
      }}
      href={link.href}
      target={props.target}
    />
  )
})
