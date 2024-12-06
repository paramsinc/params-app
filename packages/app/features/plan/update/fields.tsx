import { Currency } from 'app/db/enums'
import { Card } from 'app/ds/Form/layout'
import { Input } from 'app/ds/Input'
import { Text } from 'app/ds/Text'
import { formatMinutes } from 'app/features/profile/detail/book/page'
import { formatCurrencyInteger } from 'app/features/stripe-connect/checkout/success/formatUSD'

export const PlanDurationField = ({
  minutes,
  onChange,
  error,
  inputRef,
}: {
  minutes: number | null
  onChange: (minutes: number | null) => void
  error?: { message?: string }
  inputRef?: React.Ref<Input>
}) => {
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Title>Call Duration (Minutes)</Card.Title>
      <Input
        placeholder={'30'}
        value={minutes?.toString() ?? ''}
        keyboardType="numeric"
        onChange={(e) => {
          e.preventDefault()
          const value = e.nativeEvent.text
          if (value === '') {
            return onChange(null)
          }
          const minutes = Number(value)
          if (isNaN(minutes)) {
            return
          }
          onChange(minutes)
        }}
        ref={inputRef}
      />
      {error && <Text color="$red11">{error.message}</Text>}
    </Card>
  )
}

export const PlanPriceField = ({
  price,
  onChange,
  error,
  inputRef,
}: {
  price: number | null
  onChange: (price: number | null) => void
  error?: { message?: string }
  inputRef?: React.Ref<Input>
}) => {
  const currency = 'usd' satisfies Currency
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Title>Price ({currency})</Card.Title>
      <Input
        placeholder={'100'}
        value={typeof price === 'number' ? (price / 100).toString() : ''}
        keyboardType="numeric"
        onChange={(e) => {
          e.preventDefault()
          const value = e.nativeEvent.text
          if (value === '') {
            return onChange(null)
          }
          const price = Number(value)
          if (isNaN(price)) {
            return
          }
          onChange(price * 100)
        }}
        ref={inputRef}
      />
      {<Text color="$green11">{formatCurrencyInteger[currency]?.format((price ?? 0) / 100)}</Text>}
    </Card>
  )
}
