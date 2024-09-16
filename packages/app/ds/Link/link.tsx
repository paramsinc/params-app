import { Link } from 'solito/link'

export default function L(
  props: Pick<
    React.ComponentProps<typeof Link>,
    'href' | 'replace' | 'children' | 'target'
  >
) {
  return <Link {...props} />
}
