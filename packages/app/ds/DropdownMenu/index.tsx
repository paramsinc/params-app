'use client'

import * as Menu from 'zeego/dropdown-menu'
import React, { useContext, useState, createElement, ComponentProps } from 'react'
import { View } from '../View'
import { Text } from '../Text'
import { styled, ThemeName, withStaticProperties } from 'tamagui'
import './css'
import './dropdown-menu.css'
import * as Lucide from '@tamagui/lucide-icons'
import { ContentFrame } from './ContentFrame'
import { ItemFrame } from './ItemFrame'
import { focusedItemContext } from './focusedItemContext'

const Root = Menu.Root

const leftWidth = 34

const Content = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.Content> & {
      minWidth?: number | string
      overflow?: 'scroll' | 'visible'
      width?: number | string
      maxHeight?: number | string
    }
  ) => {
    return (
      <Menu.Content avoidCollisions collisionPadding={8} sideOffset={4} {...props}>
        <ContentFrame
          menu="dropdown"
          width={props.width}
          maxHeight={props.maxHeight}
          overflow={props.overflow}
          minWidth={props.minWidth}
        >
          {props.children}
        </ContentFrame>
      </Menu.Content>
    )
  },
  'Content'
)

const Trigger = Menu.Trigger

const Item = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.Item> & {
      theme?: ThemeName
      href?: string
      height?: number | 'auto'
      row?: boolean
    }
  ) => {
    const [focused, setFocused] = useState(false)
    return (
      <Menu.Item onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...props}>
        <ItemFrame
          theme={props.theme}
          focused={focused}
          destructive={props.destructive}
          height={props.height}
          row={props.row}
        >
          {props.children}
        </ItemFrame>
      </Menu.Item>
    )
  },
  'Item'
)

const CheckboxItem = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.CheckboxItem> & {
      theme?: ThemeName
      height?: number | 'auto'
      row?: boolean
    }
  ) => {
    const [focused, setFocused] = useState(false)
    return (
      <Menu.CheckboxItem
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      >
        <ItemFrame
          theme={props.theme}
          focused={focused}
          row={props.row}
          destructive={props.destructive}
          height={props.height}
        >
          <ItemIndicator />
          {props.children}
        </ItemFrame>
      </Menu.CheckboxItem>
    )
  },
  'CheckboxItem'
)

const ItemTitle = Menu.create(
  ({
    children,
    style,
    bold = false,
    brand,
  }: React.ComponentProps<typeof Menu.ItemTitle> & {
    bold?: boolean
    brand?: boolean
  }) => {
    const focused = useContext(focusedItemContext)
    return (
      <View flex={1}>
        <Menu.ItemTitle style={style}>
          <Text
            userSelect="none"
            cursor="pointer"
            bold={bold}
            color={brand ? '$brand' : !focused ? '$color11' : '$color12'}
            mr={8}
          >
            {children}
          </Text>
        </Menu.ItemTitle>
      </View>
    )
  },
  'ItemTitle'
)

const ItemIcon = Menu.create(
  ({
    side = 'left',
    icon: Icon,
    children,
    ...props
  }: React.ComponentProps<typeof Menu.ItemIcon> & {
    icon?: React.ComponentType<{
      size?: number
      color?: string
    }>
    side?: 'left' | 'right'
  }) => {
    const focused = useContext(focusedItemContext)
    return (
      <Menu.ItemIcon {...props}>
        <View width={leftWidth} ai={side == 'left' ? 'flex-start' : 'flex-end'}>
          {Icon && <Icon size={18} color={focused ? '$color12' : '$color10'} />}
          {children}
        </View>
      </Menu.ItemIcon>
    )
  },
  'ItemIcon'
)

const ItemSubtitle = Menu.create(
  ({
    children,
    ...props
  }: Omit<React.ComponentProps<typeof Menu.ItemSubtitle>, 'children'> & {
    children: string
  }) => {
    return (
      // @ts-expect-error
      <Menu.ItemSubtitle {...props}>
        <Text color="$color11">{children}</Text>
      </Menu.ItemSubtitle>
    )
  },
  'ItemSubtitle'
)

const Separator = Menu.create(
  styled(
    Menu.Separator,
    {
      my: '$1',
      height: 1,
      bg: '$color6',
    },
    {}
  ),
  'Separator'
)

const Sub = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.Sub> & {
      children: React.ReactNode
    }
  ) => {
    // TODO tix-web fix sub
    return createElement(Menu.Sub, props as any)
  },
  'Sub'
)

const SubTrigger = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.SubTrigger> & {
      children: React.ReactNode
      destructive?: boolean
      height?: number | 'auto'
      theme?: ThemeName
    }
  ) => {
    const [focused, setFocused] = useState(false)
    return (
      <Menu.SubTrigger
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // it's ok, this is here for types
        {...props}
      >
        <ItemFrame
          theme={props.theme}
          focused={focused}
          height={props.height}
          destructive={props.destructive}
        >
          {props.children}
          <View mr={-12}>
            <ItemIcon icon={Lucide.ChevronRight} side="right" />
          </View>
        </ItemFrame>
      </Menu.SubTrigger>
    )
  },
  'SubTrigger'
)

const SubContent = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.SubContent> & {
      overflow?: 'scroll' | 'visible'
    } & { frame?: Partial<ComponentProps<typeof ContentFrame>> }
  ) => {
    return (
      <Menu.SubContent sideOffset={4} alignOffset={-4} {...props}>
        <ContentFrame subMenu menu="dropdown" overflow={props.overflow} {...props.frame}>
          {props.children}
        </ContentFrame>
      </Menu.SubContent>
    )
  },
  'SubContent'
)

const ItemImage = Menu.create(
  (
    props: React.ComponentProps<typeof Menu.ItemImage> & {
      source: string
    }
  ) => {
    return (
      <Menu.ItemImage
        style={{ width: 26, height: 26, objectFit: 'cover', ...props.style }}
        {...props}
      ></Menu.ItemImage>
    )
  },
  'ItemImage'
)

const ItemIndicator = Menu.create((props: React.ComponentProps<typeof Menu.ItemIndicator>) => {
  return (
    <View width={leftWidth} jc="center">
      <Menu.ItemIndicator {...props} asChild>
        <Lucide.Check size={18} />
      </Menu.ItemIndicator>
    </View>
  )
}, 'ItemIndicator')

const Label = Menu.create((props: React.ComponentProps<typeof Menu.Label>) => {
  return (
    <Menu.Label {...props}>
      <Text
        px="$3"
        fontSize={14}

        // lineHeight={height}
      >
        {props.children}
      </Text>
    </Menu.Label>
  )
}, 'Label')

export const DropdownMenu = withStaticProperties(Menu.create(Menu.Root, 'Root'), {
  Root,
  Content,
  Trigger,
  Item,
  ItemTitle,
  ItemIcon,
  ItemSubtitle,
  Separator,
  Sub,
  SubTrigger,
  SubContent,
  ItemImage,
  Label,
  CheckboxItem,
  Group: Menu.Group,
  create: Menu.create,
})
