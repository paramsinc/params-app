import { describe, expect, test } from 'bun:test'
import { parsePy } from './parse-py'

describe('parsePy', () => {
  test('should parse markdown block', async () => {
    console.log('test')
    const py = await Bun.file(new URL('./test-file.py', import.meta!.url)).text()
    console.log(py)
    const blocks = parsePy(py)
    console.log(blocks.slice(0, 15))
    // expect(blocks).toEqual([{ language: 'markdown', content: 'Hello, world!' }])
  })
})
