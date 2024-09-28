import type { DropzoneState, DropzoneProps as Props } from 'react-dropzone'

export type DropzoneProps = {
  children: React.ReactNode | ((state?: DropzoneState) => React.ReactNode)
  onPickImage: (base64: string) => void
  noClick?: boolean
  disabled?: boolean
} & Pick<Props, 'noClick' | 'onDrop'>
