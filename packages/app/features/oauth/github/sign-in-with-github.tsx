import { cloneElement, useEffect } from 'app/react'
import useGithubOauth from './use-github-oauth/use-github-oauth'
import useToast from 'app/ds/Toast'
import { getErrorMessages } from 'app/ds/Error/error'

export function SignInWithGithub({ children }: { children: React.ReactElement }) {
  const { prompt, isLoading, error } = useGithubOauth()

  const { toast } = useToast()

  useEffect(
    function showErrorToast() {
      if (error) {
        toast({
          title: 'Error',
          message: getErrorMessages(error.message, '\n'),
        })
      }
    },
    [error]
  )

  return cloneElement(children, { onPress: prompt, disabled: isLoading, loading: isLoading })
}
