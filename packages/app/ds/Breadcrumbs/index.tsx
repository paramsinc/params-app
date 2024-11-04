import * as React from 'react'
import { View } from 'app/ds/View'
import { Text } from 'app/ds/Text'
import { styled } from 'app/ds/styled'
import * as Lucide from '@tamagui/lucide-icons'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import Link from 'app/ds/Link/link'

const Breadcrumb = styled(View, {
  tag: 'nav',
  fd: 'row',
  ai: 'center',
  gap: '$2',
})

const List = styled(View, {
  tag: 'ol',
  fd: 'row',
  flexWrap: 'wrap',
  ai: 'center',
  gap: '$2',
  flex: 1,
})

const Item = styled(View, {
  tag: 'li',
  fd: 'row',
  ai: 'center',
  gap: '$2',
  minWidth: 0,
  cursor: 'pointer',
})

const Title = styled(Text, {
  tag: 'span',
  color: '$color11',
  ellipse: true,
  hoverStyle: {
    color: '$color12',
  },
})

const LinkFrame = styled(View, {
  tag: 'a',
  cursor: 'pointer',
  fd: 'row',
  ai: 'center',
  minWidth: 0,
  pressStyle: {
    opacity: 0.7,
  },
}).styleable<{
  href: string
  target?: string
}>((props) => {
  const { children, href, target, ...rest } = props
  return (
    <Link href={href} target={target}>
      <View {...rest}>{children}</View>
    </Link>
  )
})

const PageFrame = styled(View, {
  tag: 'span',
  fd: 'row',
  ai: 'center',
  minWidth: 0,
  role: 'link',
  'aria-disabled': true,
}).styleable<{ current?: boolean }>((props) => (
  <View {...props} aria-current={props.current ? 'page' : undefined} />
))

const Separator = styled(View, {
  tag: 'li',
  fd: 'row',
  ai: 'center',
  role: 'presentation',
  'aria-hidden': true,
}).styleable((props) => (
  <View {...props}>{props.children ?? <Lucide.ChevronRight size={14} color="$color11" />}</View>
))

const Ellipsis = styled(View, {
  tag: 'span',
  width: 36,
  height: 36,
  ai: 'center',
  jc: 'center',
  role: 'presentation',
  'aria-hidden': true,
  opacity: 0.5,
}).styleable((props) => (
  <View {...props}>
    <Lucide.MoreHorizontal size={16} color="$color11" />
    <Text tag="span" display="none">
      More
    </Text>
  </View>
))

export const Breadcrumbs = withStaticProperties(Breadcrumb, {
  List,
  Item,
  Link: LinkFrame,
  Page: PageFrame,
  Separator,
  Ellipsis,
  Title,
})
