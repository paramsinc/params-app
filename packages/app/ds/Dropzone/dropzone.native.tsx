import type { DropzoneProps } from './dropzone.types'

export function Dropzone({ children, onPickImage }: DropzoneProps) {
  const child = typeof children == 'function' ? children() : children
  return <>{child}</>
}
