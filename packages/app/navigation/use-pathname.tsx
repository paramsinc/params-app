import { useRouter } from 'next/router'

export function useCurrentPath() {
  return useRouter().asPath
}
