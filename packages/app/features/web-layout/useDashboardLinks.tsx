import { Lucide } from 'app/ds/Lucide'
import { useRouter } from 'next/router'

export function useDashboardLinks() {
  const pathname = useRouter().pathname
  const links = [
    {
      label: 'Repos',
      href: '/dashboard/repos',
      isActive:
        pathname.startsWith('/dashboard/repos') || pathname === '/dashboard' || pathname === '/new',
      icon: Lucide.GitBranch,
    },
    {
      label: 'Profiles',
      href: '/dashboard/profiles',
      isActive: pathname.startsWith('/dashboard/profiles'),
      icon: Lucide.User,
    },
    {
      label: 'Bookings',
      href: '/dashboard/bookings',
      isActive: pathname.startsWith('/dashboard/bookings') || pathname.startsWith('/bookings'),
      icon: Lucide.PhoneCall,
    },
  ]

  return links
}
