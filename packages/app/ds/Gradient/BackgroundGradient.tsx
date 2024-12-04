'use client'
import { View } from 'app/ds/View'

export const BackgroundGradient = () => (
  <View
    zi={-1}
    stretch
    ov="hidden"
    o={0.15}
    style={{
      backgroundImage: `
    radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
    radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
    radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
    radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
    radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
    radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
    radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
  `,
      filter: 'blur(100px) saturate(150%)',
    }}
  />
)
