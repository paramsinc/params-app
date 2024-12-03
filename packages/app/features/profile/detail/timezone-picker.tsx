import { DateTime } from 'app/dates/date-time'
import { DropdownMenu } from 'app/ds/DropdownMenu'
import { View } from 'app/ds/View'
import timezones from 'app/features/profile/detail/timezones'

const currentOffset = DateTime.local().offset

const zones = [
  'New York',
  'Chicago',
  'Denver',
  'Phoenix',
  'Los Angeles',
  'Anchorage',
  'Honolulu',
  'Vancouver',
  'Tijuana',
  'Mazatlan',
  'Hermosillo',
  'Mexico City',
  'Winnipeg',
  'Costa Rica',
  'Toronto',
  'Jamaica',
  'Nova Scotia',
  'Puerto Rico',
  'Sao Paulo',
  'London',
  'Paris',
  'Berlin',
  'Amsterdam',
  'Jerusalem',
  'Athens',
  'Johannesburg',
  'Moscow',
  'Kampala',
  'Riyadh',
  'Dubai',
  'Baku',
  'Karachi',
  'Mumbai',
  'Dhaka',
  'Bangkok',
  'Hong Kong',
  'Shanghai',
  'Perth',
  'Tokyo',
  'Seoul',
  'Darwin',
  'Adelaide',
  'Sydney',
  'Auckland',
]
  .map((city) => {
    const zone = timezones.find((zone) => zone.name.replaceAll('_', ' ').includes(city))

    return zone
  })
  .filter(Boolean)
  .sort((a, b) => {
    const aDistanceToCurrentOffset = Math.abs(a.currentTimeOffsetInMinutes - currentOffset)
    const bDistanceToCurrentOffset = Math.abs(b.currentTimeOffsetInMinutes - currentOffset)

    return aDistanceToCurrentOffset - bDistanceToCurrentOffset
  })

function offsetToGMTString(offsetInMinutes: number): string {
  const hours = Math.floor(Math.abs(offsetInMinutes) / 60)
  const minutes = Math.abs(offsetInMinutes) % 60

  // Decide on the sign based on offset value
  const sign = offsetInMinutes < 0 ? '-' : '+'

  // If minutes are zero, return just the hour component
  if (minutes === 0) {
    return `GMT${sign}${hours}`
  } else {
    // Otherwise, return both hours and minutes
    return `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`
  }
}

export function TimezonePicker({
  timezone,
  onChange,
  children,
  ...rest
}: {
  timezone: string | undefined
  onChange: (timezone: string) => void
  children: React.ReactElement
} & React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Content {...rest}>
        {zones.map((zone) => {
          const text = zone.name.split('/').pop()?.replace(/_/g, ' ')
          return (
            <DropdownMenu.CheckboxItem
              key={zone.name}
              value={zone.name === timezone}
              textValue={text}
              onValueChange={() => onChange(zone.name)}
            >
              <DropdownMenu.ItemTitle>{text}</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemSubtitle>
                {offsetToGMTString(zone.currentTimeOffsetInMinutes)}
              </DropdownMenu.ItemSubtitle>
            </DropdownMenu.CheckboxItem>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
