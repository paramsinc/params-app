import { TextLink } from 'solito/link'

export default function L(
  props: Pick<
    React.ComponentProps<typeof TextLink>,
    'href' | 'replace' | 'children' | 'target'
  >
) {
  return <TextLink {...props} />
}
