import localFont from 'next/font/local'

import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const headingFont = localFont({
  variable: '--font-round',
  src: [
    {
      path: './fonts/CircularStd-Book.ttf',
      weight: '400',
      style: 'normal',
    },
    // italic
    {
      path: './fonts/CircularStd-BookItalic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/CircularStd-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    // italic
    {
      path: './fonts/CircularStd-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },

    {
      path: './fonts/CircularStd-Bold.ttf',
      weight: '600',
      style: 'normal',
    },
    // italic
    {
      path: './fonts/CircularStd-BoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: './fonts/CircularStd-BlackItalic.ttf',
      weight: '700',
      style: 'italic',
    },
    {
      path: './fonts/CircularStd-Black.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
})

export default {
  heading: headingFont.style.fontFamily,
  mono: GeistMono.style.fontFamily,
  sans: GeistSans.style.fontFamily,
}
