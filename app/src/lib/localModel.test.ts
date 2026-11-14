import { afterEach, describe, expect, it, vi } from 'vitest'
import { chat, findModel } from './localModel'

afterEach(() => vi.unstubAllGlobals())

function streamOf(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) { for (const chunk of chunks) c.enqueue(new TextEncoder().encode(chunk)); c.close() },
  })
  return new Response(body)
}

describe('local model', () => {
  it('reads streamed text even when a line is split across chunks', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => streamOf(['{"message":{"content":"Your "}}\n{"mess', 'age":{"content":"heart is fine."}}\n{"done":true}\n'])))
    let text = ''
    await chat('m', [{ role: 'user', content: 'hi' }], (t) => { text += t })
    expect(text).toBe('Your heart is fine.')
  })

  it('prefers a Llama model and reports none when Ollama is not running', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ models: [{ name: 'nomic-embed-text' }, { name: 'gemma3:4b' }, { name: 'llama3.2:3b' }] })))
    expect(await findModel()).toBe('llama3.2:3b')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('refused') }))
    expect(await findModel()).toBeNull()
  })
})
