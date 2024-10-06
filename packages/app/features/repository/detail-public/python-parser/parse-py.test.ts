import { describe, expect, test } from 'bun:test'
import { parsePy } from './parse-py'

describe('parsePy', () => {
  test('should parse markdown block', async () => {
    console.log('test')
    const py = await Bun.file(new URL('./test-file.py', import.meta!.url)).text()
    console.log(py)
    const blocks = parsePy(py)
    // await Bun.write('./test-file.tsx', JSON.stringify(blocks, null, 2))
    console.log(blocks.slice(0, 15))
    // expect(blocks).toEqual([{ language: 'markdown', content: 'Hello, world!' }])
  })
})
