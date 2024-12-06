import './github-markdown.css'
import Markdown from 'react-markdown'
import Link from 'next/link'

// https://github.com/react18-tools/react-markdown-autolink/blob/main/lib/src/index.ts
export const autoLinkMd = (str: string) =>
  str
    .replace(
      /(?:^|\s)(((ftp|https?):\/\/)|)([\w_-]+(\.[\w_-]+)+)[\w@?^=%&/~+#.:,-]*[\w@?^=%&/~+#-]/g,
      (match, _, __, protocol, domain) => {
        const trimmed = match.trim()
        return ` [${trimmed}](${protocol ? trimmed : `https://${trimmed}`})`
      }
    )
    .replace(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, (match) => `<${match}>`)

export function MarkdownRenderer({
  children,
  linkPrefix,
}: {
  children: string
  linkPrefix: string
}) {
  const md = autoLinkMd(children)
  console.log('[markdown]', md)
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
      {md}
    </Markdown>
  )
}
