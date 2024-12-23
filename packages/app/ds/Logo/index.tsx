import { FramerLogo } from 'app/ds/Logo/FramerLogo'
import { LogoProps } from 'app/ds/Logo/LogoProps'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Fragment, useEffect, useMemo, useState } from 'app/react'
import { MotiView } from 'moti'

const height = 16

const word = 'params'
function CustomLogo({
  height = 16,
  duration = 80,
  blinkDuration = duration * 2.25,
  startDelay = duration * 10,
}: LogoProps) {
  const [i, setI] = useState(0)
  const [hovered, setHovered] = useState(false)
  const max = word.length
  const [ready, setReady] = useState(false)
  useEffect(function setReadyAfterDelay() {
    const timeout = setTimeout(() => setReady(true), startDelay)

    return () => clearTimeout(timeout)
  }, [])
  useEffect(
    function increment() {
      if (!ready) return
      const interval = setInterval(() => {
        setI((i) => {
          if (i === max) {
            clearInterval(interval)
            return i
          }
          return i + 1
        })
      }, duration)
      return () => {
        clearInterval(interval)
      }
    },
    [max, ready, duration]
  )

  const Blinker = useMemo(
    () => (
      <MotiView
        from={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ type: 'timing', duration: blinkDuration, loop: true } as any}
      >
        <View height={height * 0.86} mt={height * 0.02} width={height * 0.6} bg="$color12" br={0} />
      </MotiView>
    ),
    []
  )

  const text = (content: React.ReactNode) => {
    return (
      <Text lineHeight={height} fontSize={height} bold fontFamily="$mono">
        {content}
      </Text>
    )
  }

  return (
    <View
      row
      ai="center"
      height={height}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {text('(')}
      {text(
        word
          .slice(0, i)
          .split('')
          .map((char, index) => <Fragment key={index}>{text(char)}</Fragment>)
      )}
      {i < max && Blinker}
      {text(')')}
    </View>
  )
}

export const Logo = FramerLogo
