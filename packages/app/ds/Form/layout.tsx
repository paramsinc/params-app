import { Lucide } from 'app/ds/Lucide'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'

const CardFrame = styled(View, {
  p: '$3',
  bw: 1,
  boc: '$borderColor',
  // borderRadius: '$3',
  bg: '$color2',
  gap: '$3',
  br: '$3',
})
const Label = styled(Text, {
  bold: true,
  color: '$color11',
})
const CardDescription = styled(Text, {})

const IconRow = styled(View, {
  row: true,
  gap: '$2',
})

const Icon = (props: { icon: (typeof Lucide)[keyof typeof Lucide] }) => {
  return <props.icon size={18} color="$color11" />
}

const IconRowContent = styled(View, {
  grow: true,
})

export const Card = withStaticProperties(CardFrame, {
  Title: styled(Text, {
    bold: true,
  }),
  Label: Label,
  Description: CardDescription,
  IconRow: withStaticProperties(IconRow, {
    Icon: Icon,
    Content: IconRowContent,
  }),
})
