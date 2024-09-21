import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { View } from 'app/ds/View'

export const Page = {
  Root: styled(View, {
    grow: true,
  }),
  Scroll,
  Content: styled(View, {
    p: '$3',
    $gtSm: {
      p: '$4',
    },
  }),
}
