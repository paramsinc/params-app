import { CalProvider } from '@calcom/atoms'
import { env } from 'app/env'
import { api } from 'app/trpc/client'
// import '@calcom/atoms/globals.min.css'

export const CalcomProvider = ({
  children,
  profileSlug,
}: {
  children: React.ReactNode
  profileSlug: string
}) => {
  const profile = api.profileBySlug.useQuery(
    { slug: profileSlug },
    {
      enabled: !!profileSlug,
    }
  )
  return (
    <CalProvider
      clientId={env.CAL_COM_CLIENT_ID}
      accessToken={profile.data?.cal_com_access_token ?? undefined}
      options={{
        apiUrl: env.CAL_COM_API_URL,
        refreshUrl: env.CAL_COM_REFRESH_URL,
      }}
    >
      {children}
    </CalProvider>
  )
}
