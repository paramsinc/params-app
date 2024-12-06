import { Lucide } from 'app/ds/Lucide'
import { useMe } from 'app/features/user/me/create/use-me'
import { useRouter } from 'next/router'

export function useDashboardLinks() {
  const pathname = useRouter().pathname
  const me = useMe()
  const links: Array<{
    label: string
    href: string
    isActive: boolean
    icon: typeof Lucide.GitBranch
  }> = [
    {
      label: 'My Bookings',
      href: '/dashboard/bookings',
      isActive:
        pathname.startsWith('/dashboard/bookings') ||
        pathname.startsWith('/bookings') ||
        pathname === '/dashboard',
      icon: Lucide.PhoneCall,
    },
  ]

  if (me.data) {
  }

  if (me.data?.can_create_profiles) {
    links.push(
      {
        label: 'My Profiles',
        href: '/dashboard/profiles',
        isActive: pathname.startsWith('/dashboard/profiles'),
        icon: Lucide.User,
      },
      {
        label: 'My Repos',
        href: '/dashboard/repos',
        isActive: pathname.startsWith('/dashboard/repos') || pathname === '/new',
        icon: Lucide.GitBranch,
      }
    )
  } else if (me.data?.can_create_profiles === false) {
    links.push({
      label: 'Apply as an expert',
      href: '/dashboard/apply',
      isActive: pathname.startsWith('/dashboard/apply'),
      icon: Lucide.BadgePlus,
    })
  }

  return Object.assign(links, {
    isPending: !me.data,
  })
}
