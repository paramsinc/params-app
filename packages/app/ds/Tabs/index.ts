import { styled } from 'app/ds/styled'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { Tabs as TamaguiTabs } from 'tamagui'

export const Tabs = withStaticProperties(TamaguiTabs, {
  Tab: TamaguiTabs.Tab,
})
