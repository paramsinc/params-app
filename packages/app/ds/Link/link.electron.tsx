import { Link } from '@tanstack/react-router'
import type SolitoLink from './link'
import { parseNextPath } from 'solito/router'
import { DesktopRenderMode } from 'app/navigation/desktop/mode'
import { Link as ReactRouterLink } from 'react-router-dom'

export default function TSL({ children, href, replace }: React.ComponentProps<typeof SolitoLink>) {
  if (DesktopRenderMode === 'tanstack-router') {
    return (
      <Link to={parseNextPath(href)} replace={replace} style={{ textDecoration: 'none' }}>
        {children}
      </Link>
    )
  }

  return (
    <ReactRouterLink to={parseNextPath(href)} replace={replace} style={{ textDecoration: 'none' }}>
      {children}
    </ReactRouterLink>
  )
}
