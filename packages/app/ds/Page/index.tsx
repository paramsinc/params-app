import { platform } from 'app/ds/platform'
import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { View } from 'app/ds/View'

export const Page = {
  Root: styled(View, {
    grow: platform.OS !== 'web',
  }),
  Scroll: platform.select({ web: View as any as typeof Scroll, default: Scroll }),
  Content: styled(View, {
    p: '$3',
    $gtSm: {
      p: '$4',
    },
    width: '100%',
    als: 'center',
    maw: '$marketingPageWidth',
  }),
}
