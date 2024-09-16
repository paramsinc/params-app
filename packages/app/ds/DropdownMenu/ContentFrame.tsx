/* eslint-disable react-hooks/rules-of-hooks */
import React, { ComponentProps, useRef, useEffect, useLayoutEffect } from 'react'
import { View } from '../View'
import { Platform } from 'react-native'

const useServerLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const ContentFrame = ({
  children,
  minWidth,
  maxHeight = 'min(477px, 60vh)',
  menu,
  subMenu,
  ...rest
}: {
  children: React.ReactNode
  overflow?: 'scroll' | 'visible'
  minWidth?: number | string
  menu: 'dropdown' | 'context'
  subMenu?: boolean
} & ComponentProps<typeof View>) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  if (Platform.OS === 'web') {
    useServerLayoutEffect(() => {
      const dropdownElem = dropdownRef.current

      if (dropdownElem) {
        const scrollDuration = 800 // 1 second
        let start: number | null = null

        function easeOut(t: number): number {
          return 1 - Math.pow(1 - t, 2)
        }

        const scrollStep = (timestamp: number) => {
          if (!start) {
            start = timestamp
          }

          const progress = timestamp - start
          const proportion = easeOut(progress / scrollDuration)

          const distanceToScroll = Math.min(300, dropdownElem.scrollHeight)

          dropdownElem.scrollTop = distanceToScroll - proportion * distanceToScroll

          if (progress < scrollDuration) {
            window.requestAnimationFrame(scrollStep)
          }
        }

        // Start the animation
        window.requestAnimationFrame(scrollStep)
      }
    }, [])
  }
  return (
    <View
      br='$3'
      className={`${menu}-menu-content-frame ${subMenu ? 'sub-menu' : ''}`}
      py={4}
      borderWidth={0.5}
      borderColor='rgba(82, 82, 111, 0.44)'
      bg='rgba(29, 30, 43, 0.498)'
      $theme-light={{
        bg: 'rgba(255, 255, 255, 0.5)',
        borderColor: 'rgb(216, 216, 216)',
      }}
      transitionProperty='height'
      // style={{
      //   transitionProperty: 'height',
      //   backdropFilter: 'blur(10px) saturate(190%) contrast(70%) brightness(80%)',
      //   WebkitBackdropFilter: 'blur(10px) saturate(190%) contrast(70%) brightness(80%)',
      // }}
      minWidth={minWidth}
      {...rest}
      ref={dropdownRef}
    >
      {children}
    </View>
  )
}
