import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'

const CardFrame = styled(View, {
  p: '$3',
  bw: 1,
  boc: '$borderColor',
  // borderRadius: '$3',
  bg: '$color1',
  gap: '$3',
})
const CardTitle = styled(Text, {
  bold: true,
  color: '$color11',
})
const CardDescription = styled(Text, {})
export const FormCard = withStaticProperties(CardFrame, {
  Title: CardTitle,
  Description: CardDescription,
})
