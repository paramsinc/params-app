import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'

export const Empty = ({ children }: { children: React.ReactNode }) => {
  return (
    <View grow>
      <Scroll centerContent>{children}</Scroll>
    </View>
  )
}

export const EmptyCard = styled(View, {
  w: '100%',
  maw: 500,
  p: '$3',
  br: '$4',
  bg: '$color2',
  gap: '$3',
  als: 'center',
  bw: 2,
  borderStyle: 'dashed',
  borderColor: '$borderColor',
})

export const EmptyCardTitle = styled(Text, {
  bold: true,
})

export const EmptyCardDescription = styled(Text, {
  color: '$color11',
})
