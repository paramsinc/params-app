'use client'

import { ScrollView } from 'tamagui'
import { AnchorProvider, useAnchors, AnchorsConsumer } from '@nandorojo/anchor'

export const Scroll = ScrollView.styleable((props) => {
  return (
    <AnchorProvider horizontal={props.horizontal ?? false}>
      <AnchorsConsumer>
        {(anchors) => <ScrollView {...props} ref={anchors.registerScrollRef} />}
      </AnchorsConsumer>
    </AnchorProvider>
  )
})
