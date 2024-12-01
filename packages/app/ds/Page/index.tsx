import { platform } from 'app/ds/platform'
import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { View } from 'app/ds/View'

const ContentWidth = styled(View, {
  px: '$3',
  '$group-gtSm': {
    px: '$4',
  },
  width: '100%',
  als: 'center',
  maw: '$marketingPageWidth',
})

export const Page = {
  Root: styled(View, {
    grow: platform.OS !== 'web',
    group: true,
    tag: 'main',
    testID: 'page-root',
  }),
  Scroll: platform.select({ web: View as any as typeof Scroll, default: Scroll }),
  Content: styled(ContentWidth, {
    p: '$3',
    '$group-gtSm': {
      p: '$4',
    },
  }),
  ContentWidthComponent: ContentWidth,
}
