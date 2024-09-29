import { Currency } from 'app/db/enums'

export const formatUSD = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const formatCurrency: { [key in Currency]: Intl.NumberFormat } = {
  usd: formatUSD,
}
