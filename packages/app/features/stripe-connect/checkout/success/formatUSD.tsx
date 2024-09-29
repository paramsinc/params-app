import { Currency } from 'app/db/enums'

export const formatUSD = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatCurrencyInteger: { [key in Currency]: Intl.NumberFormat } = {
  usd: formatUSD,
}
