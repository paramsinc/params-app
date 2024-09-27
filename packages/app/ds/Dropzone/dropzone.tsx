import Zone from 'react-dropzone'
import { DropzoneProps } from './dropzone.types'

export function Dropzone({ children, onPickImage, noClick }: DropzoneProps) {
  return (
    <Zone
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'] }}
      noClick={noClick}
      maxFiles={1}
      onDrop={([file]) => {
        if (!file) return
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = async () => {
          let uri = reader.result
          if (typeof uri == 'string') {
            onPickImage(uri)
          }
        }
        reader.onerror = function (error) {
          console.log('Error: ', error)
        }
      }}
    >
      {(props) => {
        return (
          <div {...props.getRootProps()}>
            <input {...props.getInputProps()} style={{ display: 'none' }} />
            {typeof children == 'function' ? children(props) : children}
          </div>
        )
      }}
    </Zone>
  )
}
