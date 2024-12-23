import { LogoProps } from 'app/ds/Logo/LogoProps'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Fragment, useEffect } from 'app/react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

const word = 'params'

export function FramerLogo({
  height = 16,
  duration = 80,
  blinkDuration = duration * 2.25,
  startDelay = duration * 10,
}: LogoProps) {
  const index = useMotionValue(0)
  const chars = word.split('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        const current = index.get()
        if (current < word.length) {
          index.set(current + 1)
        } else {
          clearInterval(interval)
        }
      }, duration)

      return () => clearInterval(interval)
    }, startDelay)

    return () => clearTimeout(timeout)
  }, [])

  const text = (content: React.ReactNode) => (
    <Text lineHeight={height} fontSize={height} bold fontFamily="$mono">
      {content}
    </Text>
  )

  return (
    <View row ai="center" height={height}>
      {text('(')}
      {chars.map((char, i) => {
        const opacity = useTransform(index, (latest) => (latest > i ? 1 : 0))
        const display = useTransform(index, (latest) => (latest > i ? 'flex' : 'none'))

        return (
          <motion.div
            key={i}
            style={{
              opacity,
              display,
            }}
          >
            {text(char)}
          </motion.div>
        )
      })}
      <motion.div
        style={{
          display: useTransform(index, (v) => (v >= word.length ? 'none' : 'flex')),
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: blinkDuration / 1000,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          <View
            height={height * 0.86}
            mt={height * 0.02}
            width={height * 0.6}
            bg="$color12"
            br={0}
          />
        </motion.div>
      </motion.div>
      {text(')')}
    </View>
  )
}
