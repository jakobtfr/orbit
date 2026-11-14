/**
 * A language model running on this machine through Ollama (https://ollama.com).
 * Nothing leaves the device. When Ollama is not running, the doctor falls back to its built-in answers.
 */

const HOST = 'http://localhost:11434'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Still pictures as base64, for models that can see. */
  images?: string[]
}

/** The model to use, or null when Ollama is not reachable. A Llama model is preferred when several are installed. */
export async function findModel(): Promise<string | null> {
  try {
    const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return null
    const data = (await res.json()) as { models?: { name: string }[] }
    const names = (data.models ?? []).map((m) => m.name).filter((n) => !/embed/i.test(n))
    return names.find((n) => /^llama/i.test(n)) ?? names[0] ?? null
  } catch {
    return null
  }
}

/** True when the model can look at pictures. */
export async function canSee(model: string): Promise<boolean> {
  try {
    const res = await fetch(`${HOST}/api/show`, { method: 'POST', body: JSON.stringify({ model }), signal: AbortSignal.timeout(3000) })
    const data = (await res.json()) as { capabilities?: string[] }
    return !!data.capabilities?.includes('vision')
  } catch {
    return false
  }
}

/** Loads the model into memory so the first answer does not wait for it. */
export function warm(model: string): void {
  fetch(`${HOST}/api/generate`, { method: 'POST', body: JSON.stringify({ model, keep_alive: '30m' }) }).catch(() => {})
}

/** Streams one answer, calling onToken for each piece of text as it arrives. */
export async function chat(model: string, messages: ChatMessage[], onToken: (text: string) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST',
    signal,
    body: JSON.stringify({ model, messages, stream: true, keep_alive: '30m', options: { temperature: 0.3, num_predict: 110 } }),
  })
  if (!res.ok || !res.body) throw new Error(`Local model answered ${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const take = (line: string) => {
    if (!line.trim()) return
    const d = JSON.parse(line) as { message?: { content?: string }; error?: string }
    if (d.error) throw new Error(d.error)
    if (d.message?.content) onToken(d.message.content)
  }
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    lines.forEach(take)
  }
  take(buffer)
}
