import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import screen from '../screens/FamilyCall.tsx?raw'
import { BROWSER_MODEL, LOAD_LABEL, LOAD_NOTE, browserChat, canRunInBrowser } from './browserModel'

describe('model in the browser, for the demo on the live site', () => {
  it('uses an open model with a licence that allows government and commercial use', () => {
    expect(['Apache-2.0', 'MIT']).toContain(BROWSER_MODEL.licence)
    expect(BROWSER_MODEL.id).toBe('Qwen2.5-1.5B-Instruct-q4f16_1-MLC')
  })

  it('states the download size on the button before anything is downloaded', () => {
    expect(LOAD_LABEL).toContain(`${BROWSER_MODEL.downloadGB} GB`)
    expect(LOAD_NOTE).toMatch(/demo only/i)
    expect(LOAD_NOTE).toMatch(/Nothing you type leaves/)
    expect(LOAD_NOTE).toContain(BROWSER_MODEL.licence)
  })

  it('is offered only where the browser can run it', () => {
    expect(canRunInBrowser({ gpu: {} })).toBe(true)
    expect(canRunInBrowser({})).toBe(false)
    expect(canRunInBrowser(undefined)).toBe(false)
  })

  it('does not answer before it was loaded', async () => {
    await expect(browserChat([{ role: 'user', content: 'hi' }])).rejects.toThrow('not loaded')
  })

  it('loads the library only when the button is pressed, never when the page opens', () => {
    expect(screen).not.toMatch(/from '@mlc-ai\/web-llm'/)
    expect(screen).toMatch(/onClick=\{loadInBrowser\}/)
    expect(screen.match(/loadBrowserModel\(/g) ?? []).toHaveLength(1)
  })

  it('pins the library to one exact version', () => {
    expect((pkg.dependencies as Record<string, string>)['@mlc-ai/web-llm']).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('puts the browser model behind the same reply check as the model on the device', () => {
    const at = screen.indexOf('browserChat(')
    expect(at).toBeGreaterThan(-1)
    expect(screen.slice(at, at + 1400)).toContain('checkModelReply(full)')
    expect(screen.lastIndexOf("turn.kind === 'preview' && turn.forModel && model", at)).toBeGreaterThan(-1)
  })
})
