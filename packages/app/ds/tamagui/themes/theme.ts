import { createThemeBuilder } from '@tamagui/theme-builder'

import { palettes } from './palettes'
import { shadows } from './shadows'
import { lightTemplates, templates } from './templates'
import { darkColors, lightColors } from './token-colors'

const nonInherited = {
  light: {
    ...lightColors,
    ...shadows.light,
  },
  dark: {
    ...darkColors,
    ...shadows.dark,
  },
}

const overlayThemeDefinitions = [
  {
    parent: 'light',
    theme: {
      background: 'rgba(0,0,0,0.5)',
    },
  },
  {
    parent: 'dark',
    theme: {
      background: 'rgba(0,0,0,0.8)',
    },
  },
]

const inverseSurface1 = [
  {
    parent: 'active',
    template: 'inverseActive',
  },
  {
    parent: '',
    template: 'inverseSurface1',
  },
]

const surface1 = [
  {
    parent: 'active',
    template: 'surfaceActive',
  },
  {
    parent: '',
    template: 'surface1',
  },
]

const surface2 = [
  {
    parent: 'active',
    template: 'surfaceActive',
  },
  {
    parent: '',
    template: 'surface2',
  },
]

const surface3 = [
  {
    parent: 'active',
    template: 'surfaceActive',
  },
  {
    parent: '',
    template: 'surface3',
  },
]

const themeBuilder = createThemeBuilder()
  .addPalettes(palettes)
  .addTemplates(templates)
  .addThemes({
    light: {
      template: 'base',
      palette: 'light',
      nonInheritedValues: nonInherited.light,
    },
    dark: {
      template: 'base',
      palette: 'dark',
      nonInheritedValues: nonInherited.dark,
    },
  })
  .addChildThemes({
    orange: {
      palette: 'orange',
      template: 'base',
    },
    yellow: {
      palette: 'yellow',
      template: 'base',
    },
    green: {
      palette: 'green',
      template: 'base',
    },
    blue: {
      palette: 'blue',
      template: 'base',
    },
    purple: {
      palette: 'purple',
      template: 'base',
    },
    pink: {
      palette: 'pink',
      template: 'base',
    },
    red: {
      palette: 'red',
      template: 'base',
    },
    gray: {
      palette: 'gray',
      template: 'base',
    },
  })
  .addChildThemes({
    alt1: {
      template: 'alt1',
    },
    alt2: {
      template: 'alt2',
    },
    active: {
      template: 'surface3',
    },
    surface1: {
      template: 'surface1',
    },
    surface2: {
      template: 'surface2',
    },
    surface3: {
      template: 'surface3',
    },
    surface4: {
      template: 'surfaceActive',
    },
  })
  .addComponentThemes(
    {
      ListItem: {
        template: 'surface1',
      },
      SelectTrigger: surface1,
      Card: surface1,
      Button: surface3,
      Checkbox: surface2,
      Switch: surface2,
      SwitchThumb: inverseSurface1,
      TooltipContent: surface2,
      Progress: {
        template: 'surface1',
      },
      RadioGroupItem: surface2,
      TooltipArrow: {
        template: 'surface1',
      },
      SliderTrackActive: {
        template: 'surface3',
      },
      SliderTrack: {
        template: 'surface1',
      },
      SliderThumb: inverseSurface1,
      Tooltip: inverseSurface1,
      ProgressIndicator: inverseSurface1,
      SheetOverlay: overlayThemeDefinitions,
      DialogOverlay: overlayThemeDefinitions,
      ModalOverlay: overlayThemeDefinitions,
      Input: surface1,
      TextArea: surface1,
    },
    {
      avoidNestingWithin: ['alt1', 'alt2', 'surface1', 'surface2', 'surface3', 'surface4'],
    }
  )

const themesIn = themeBuilder.build()

export type Theme = Record<keyof typeof lightTemplates.base, string> & typeof nonInherited.light

export type ThemesOut = Record<keyof typeof themesIn, Theme>

export const themes = themesIn as unknown as ThemesOut
