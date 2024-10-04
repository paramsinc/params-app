import { cloneElement } from 'app/react'
import { useGoogleOauth } from './use-google-oauth'

export function SignInWithGoogle({
  children,
  profileSlug,
}: {
  children: React.ReactElement
  profileSlug: string
}) {
  const { prompt, isLoading } = useGoogleOauth({ profileSlug })

  return cloneElement(children, { onPress: prompt, disabled: isLoading, loading: isLoading })
}
