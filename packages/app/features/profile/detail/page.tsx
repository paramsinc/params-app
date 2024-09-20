import { CalcomProvider } from 'app/features/cal-com/provider'
import { createParam } from 'app/navigation/use-params'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPage() {
  const { params } = useParams()

  return <Content profileSlug={params.profileSlug} />
}

function Content({ profileSlug }: { profileSlug: string }) {
  return <CalcomProvider profileSlug={profileSlug}>{profileSlug}</CalcomProvider>
}
