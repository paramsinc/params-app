import { Link } from 'app/ds/Link'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { useRouter } from 'next/router'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouter().pathname
  const links = [
    {
      label: 'Profiles',
      href: '/dashboard/profiles',
      isActive: pathname.startsWith('/dashboard/profiles'),
    },
  ]
  return (
    <View grow bg="$backgroundStrong">
      <View bbw={1} boc="$borderColor">
        {links.map((link) => (
          <Link href={link.href} key={link.href}>
            <View py="$2" px="$3">
              <Text
                bold
                textDecorationLine="underline"
                textDecorationColor={link.isActive ? '$color12' : 'transparent'}
              >
                {link.label}
              </Text>
            </View>
          </Link>
        ))}
      </View>
      <View grow>{children}</View>
    </View>
  )
}
