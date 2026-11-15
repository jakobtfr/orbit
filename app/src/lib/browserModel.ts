import type { ChatMessage } from './localModel'

/**
 * A small open language model that runs inside the browser, for the demo on the live site, where nothing
 * can be installed. It is downloaded only after the person presses a button that states the size, and it
 * runs on their own laptop through WebGPU: nothing they type leaves it. Library: WebLLM (@mlc-ai/web-llm,
 * Apache-2.0). It only ever writes the "talk freely" preview's replies, behind the same two checks as the
 * model on the device (familyChat.ts: aboutHealth before it, checkModelReply after it).
 */

export const BROWSER_MODEL = {
  /** The model's id in WebLLM's own list. */
  id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  name: 'Qwen2.5 1.5B',
  licence: 'Apache-2.0',
  /** Size of the files that are downloaded once, as listed on the model's page. */
  downloadGB: 0.9,
} as const

/** The model option, as its button says it. With a model already on the device nothing is downloaded. */
export function modelChoice(onDevice: string | null): string {
  return onDevice
    ? `Use the on-device model (${onDevice}, already installed, nothing is sent anywhere)`
    : `Load the on-device model (about ${Math.round(BROWSER_MODEL.downloadGB * 1000)} MB, runs in this browser, nothing is sent anywhere)`
}

export const GUIDED_CHOICE = 'Use the guided conversation (scripted, instant)'
export const CHOICE_NOTE = `Both are for this demo, and you can change it at any time. The model is the open ${BROWSER_MODEL.name} (${BROWSER_MODEL.licence}); it needs Chrome or Edge on a recent computer.`
/** Said when the model option cannot be used, before the guided conversation takes over. */
export const NO_GPU_LINE = 'This browser cannot run the model: it has no WebGPU. The guided conversation is used instead.'
export const LOAD_FAILED_LINE = 'The model could not be downloaded. The guided conversation is used instead.'

/** True when this browser can run the model: it needs WebGPU. */
export function canRunInBrowser(nav: object | undefined = typeof navigator === 'undefined' ? undefined : navigator): boolean {
  return !!nav && 'gpu' in nav && !!(nav as { gpu?: unknown }).gpu
}

interface Engine {
  chat: { completions: { create(req: { messages: { role: string; content: string }[]; temperature: number; max_tokens: number }): Promise<{ choices: { message: { content?: string | null } }[] }> } }
}

let engine: Engine | undefined

/** Downloads the model, or opens it from the browser's cache, and reports how far it is, 0 to 1. */
export async function loadBrowserModel(onProgress: (share: number, text: string) => void): Promise<void> {
  if (engine) return
  const webllm = await import('@mlc-ai/web-llm')
  engine = (await webllm.CreateMLCEngine(BROWSER_MODEL.id, { initProgressCallback: (p) => onProgress(p.progress, p.text) })) as unknown as Engine
}

/** One whole reply from the model in the browser. */
export async function browserChat(messages: ChatMessage[], temperature = 0.7, maxTokens = 90): Promise<string> {
  if (!engine) throw new Error('The model is not loaded.')
  const res = await engine.chat.completions.create({ messages: messages.map((m) => ({ role: m.role, content: m.content })), temperature, max_tokens: maxTokens })
  return res.choices[0]?.message.content ?? ''
}
