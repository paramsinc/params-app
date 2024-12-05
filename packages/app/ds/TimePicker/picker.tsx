import { DateTime } from 'app/dates/date-time'
import { Input } from 'app/ds/Input'
import { useThemeName } from 'app/ds/useThemeName'
import { View } from 'app/ds/View'
import { useRef } from 'app/react'

type Props = {
  time: { hour: number; minute: number } | undefined
  onChangeTime: (time: { hour: number; minute: number }) => void
  children?: React.ReactElement
}

export default function Web(props: Props) {
  const { time, onChangeTime: onChange, children } = props

  const inputRef = useRef<HTMLInputElement>(null)

  const childProps: React.ComponentProps<typeof Input> = {
    placeholder: 'Select time',
    value: time
      ? DateTime.fromObject({ hour: time?.hour, minute: time?.minute }).toLocaleString({
          timeStyle: 'short',
        })
      : '',
    onFocus: () => {
      inputRef.current?.click()
    },
  }

  const dt =
    time?.hour != null && time?.minute != null
      ? DateTime.fromObject({ hour: time?.hour, minute: time?.minute })
      : null

  return (
    <View bg="$color3" px="$1" py="$1">
      <input
        type="time"
        ref={inputRef}
        style={{
          width: 120,
          color: 'var(--color)',
          colorScheme: useThemeName(),
          borderRadius: '6px',
        }}
        defaultValue={
          dt
            ? `${dt.hour.toString().padStart(2, '0')}:${dt.minute.toString().padStart(2, '0')}`
            : ''
        }
        onChange={(e) => {
          const [hour, minute] = e.target.value.split(':').map(Number)

          if (minute == null || hour == null) {
            return
          }

          if (!DateTime.fromObject({ hour, minute }).isValid) {
            return
          }

          onChange({ hour, minute })
        }}
      />
    </View>
  )
}
