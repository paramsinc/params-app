import { Highlight, themes } from 'prism-react-renderer'

export const languageByExtension: Record<string, string> = {
  // Existing
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  md: 'markdown',
  json: 'json',
  plaintext: 'plaintext',
  js: 'javascript',

  // Added mappings
  jsx: 'javascript',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  html: 'html',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  php: 'php',
  cs: 'csharp',
  cpp: 'cpp',
  c: 'c',
  swift: 'swift',
  kt: 'kotlin',
  r: 'r',
  sql: 'sql',
  graphql: 'graphql',
  dockerfile: 'dockerfile',
  sol: 'solidity',
}

export function Codeblock({
  content,
  language,
  lineNumbers = false,
}: {
  content: string
  language: string
  lineNumbers?: boolean
}) {
  return (
    <Highlight theme={themes.vsDark} code={content} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          style={{
            ...style,
            padding: '16px',
            borderRadius: 12,
            marginBottom: 16,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre',
            lineBreak: 'anywhere',
            overflowX: 'auto',
          }}
          className={className}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {lineNumbers && (
                <span
                  style={{
                    width: 50,
                    display: 'inline-block',
                    userSelect: 'none',
                  }}
                >
                  {i + 1}
                </span>
              )}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
