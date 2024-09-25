import { CalProvider } from '@calcom/atoms'
import { env } from 'app/env'
import { api } from 'app/trpc/client'
import '@calcom/atoms/globals.min.css'

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
    <div style={{ display: 'contents', fontFamily: 'var(--f-family)' }}>
      <CalProvider
        clientId={env.CAL_COM_CLIENT_ID}
        accessToken={profile.data ?? undefined}
        options={{
          apiUrl: env.CAL_COM_API_URL,
          refreshUrl: env.CAL_COM_REFRESH_URL,
        }}
        labels={{
          availability: 'Avails',
        }}
      >
        {profile.data && children}
      </CalProvider>
    </div>
  )
}
