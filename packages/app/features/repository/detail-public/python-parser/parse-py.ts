type Blocks = Array<{
  language: 'python' | 'markdown' | (string & {})
  content: string
}>

export const parsePy = (py: string): Blocks => {
  const lines = py.split('\n')

  const blocks: Blocks = []

  let currentBlock: (typeof blocks)[number] | null = null

  for (let line of lines) {
    if (!line.trim()) {
      continue
    }

    const commentDelimiter = `"""`
    if (line.trim().startsWith(commentDelimiter)) {
      if (currentBlock?.language === 'python') {
        if (currentBlock.content) {
          blocks.push(currentBlock)
        }
        currentBlock = null
      }
      if (!currentBlock?.content) {
        const [, language] = line.trim().split('"""')
        if (language) {
          currentBlock = {
            language: language,
            content: '',
          }
        } else {
          currentBlock = {
            language: 'markdown',
            content: '',
          }
        }
      } else {
        blocks.push(currentBlock)
        currentBlock = {
          language: 'python',
          content: '',
        }
      }
      continue
      if (currentBlock) {
        if (currentBlock.content) {
          blocks.push(currentBlock)
        }
        currentBlock = null
      } else {
        const language = line.trim().slice(commentDelimiter.length)
        if (language) {
          currentBlock = {
            language: language,
            content: '',
          }
        } else {
          currentBlock = {
            language: 'markdown',
            content: '',
          }
        }
      }
    } else if (currentBlock) {
      if (currentBlock?.content) {
        currentBlock.content += '\n'
      }
      currentBlock.content += line
    } else {
      currentBlock = {
        language: 'python',
        content: line,
      }
    }
  }

  if (currentBlock?.content) {
    blocks.push(currentBlock)
  }

  return blocks
}
