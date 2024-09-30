import { DateTime } from 'luxon'

// hack to support drizzle date types being sent from postgres over json.stringify
DateTime.fromISO = function (...args) {
  const date = args[0] as any
  if (date instanceof Date) {
    return DateTime.fromJSDate(date)
  }
  return DateTime.fromISO(...args)
}

export { DateTime }
