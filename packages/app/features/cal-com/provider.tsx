import { CalProvider } from '@calcom/atoms'
import { env } from 'app/env'
import { api } from 'app/trpc/client'
import '@calcom/atoms/globals.min.css'

const sharedProps: React.ComponentProps<typeof CalProvider> = {
  clientId: env.CAL_COM_CLIENT_ID,
  options: {
    apiUrl: env.CAL_COM_API_URL,
    refreshUrl: env.CAL_COM_REFRESH_URL,
  },
  labels: {
    availability: 'Avails',
  },
}

export const CalcomProvider = ({
  children,
  profileSlug,
}: {
  children: React.ReactNode
  profileSlug: string
}) => {
  const profile = api.calcomAccessTokenByProfileSlug.useQuery(
    { profileSlug },
    {
      enabled: !!profileSlug,
    }
  )
  return (
    <CalProvider accessToken={profile.data ?? undefined} {...sharedProps}>
      {children}
    </CalProvider>
  )
}

export const CalcomProviderPublic = ({ children }: { children: React.ReactNode }) => {
  return <CalProvider {...sharedProps}>{children}</CalProvider>
}
