import { SolitoImage } from 'solito/image'

import { memo } from 'react'
import { imageLoader } from 'app/image/loader'

export default memo(function Img({
  ...props
}: Omit<React.ComponentProps<typeof SolitoImage>, 'loader' | 'alt' | 'unoptimized'> & {
  alt: string
  recyclingKey?: string
} & (
    | {
        loader:
          | React.ComponentProps<typeof SolitoImage>['loader']
          | keyof typeof imageLoader
          | 'local'
        unoptimized?: false
      }
    | {
        unoptimized: true
      }
  )) {
  return (
    <SolitoImage
      {...(props as React.ComponentProps<typeof SolitoImage>)}
      quality={props.quality || 75}
      loader={
        props.unoptimized || props.loader == 'local'
          ? undefined
          : typeof props.loader === 'function'
          ? props.loader
          : props.loader && imageLoader[props.loader]
      }
    />
  )
})
