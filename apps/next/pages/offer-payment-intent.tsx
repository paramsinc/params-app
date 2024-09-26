import { Text } from 'app/ds/Text'
import { useRouter } from 'next/router'

export default function BookingPaymentIntentPage() {
  const router = useRouter()
  const { redirect_status, payment_intent_id, client_secret } = router.query
  return (
    <Text>{JSON.stringify({ redirect_status, payment_intent_id, client_secret }, null, 2)}</Text>
  )
}
