import './github-markdown.css'
import Markdown from 'react-markdown'
import Link from 'next/link'

export function MarkdownRenderer({
  children,
  linkPrefix,
}: {
  children: string
  linkPrefix: string
}) {
  return (
    <Markdown
      className="markdown-body"
      components={{
        a(props) {
          const isAbsolute = props.href?.startsWith('http')
          let url = props.href
          if (!isAbsolute) {
            let href = props.href
            if (href?.startsWith('/')) {
              href = href.slice(1)
            }
            url = linkPrefix + '/' + href
          }
          return (
            <Link
              {...(props as any)}
              href={url ?? '#'}
              target={isAbsolute ? '_blank' : undefined}
            />
          )
        },
        img(props) {
          console.log('[markdown][img]', props)
          return <img {...props} />
        },
      }}
    >
      {children}
    </Markdown>
  )
}
