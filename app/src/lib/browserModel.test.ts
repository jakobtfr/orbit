import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import screen from '../screens/FamilyCall.tsx?raw'
import { BROWSER_MODEL, CHOICE_NOTE, GUIDED_CHOICE, LOAD_FAILED_LINE, NO_GPU_LINE, browserChat, canRunInBrowser, modelChoice } from './browserModel'

describe('model in the browser, for the demo on the live site', () => {
  it('uses an open model with a licence that allows government and commercial use', () => {
    expect(['Apache-2.0', 'MIT']).toContain(BROWSER_MODEL.licence)
    expect(BROWSER_MODEL.id).toBe('Qwen2.5-1.5B-Instruct-q4f16_1-MLC')
  })

  it('states the real download size on the model button, and that nothing is sent anywhere', () => {
    expect(modelChoice(null)).toBe('Load the on-device model (about 900 MB, runs in this browser, nothing is sent anywhere)')
    expect(modelChoice('qwen3:8b')).toMatch(/qwen3:8b, already installed, nothing is sent anywhere/)
    expect(GUIDED_CHOICE).toBe('Use the guided conversation (scripted, instant)')
    expect(CHOICE_NOTE).toMatch(/for this demo/)
    expect(CHOICE_NOTE).toMatch(/change it at any time/)
    expect(CHOICE_NOTE).toContain(BROWSER_MODEL.licence)
  })

  it('makes the person choose before talk freely starts: no default path around the choice', () => {
    expect(screen).toMatch(/useState<Mode>\('off'\)/)
    // The switch only ever opens the choice or turns talk freely off.
    expect(screen).toMatch(/setMode\(\(m\) => \(m === 'off' \? 'choosing' : 'off'\)\)/)
    // Talk freely is on only in one of the two chosen modes.
    expect(screen).toMatch(/const talkFreely = mode === 'guided' \|\| mode === 'model'/)
    expect(screen).toMatch(/onClick=\{chooseModel\}/)
    expect(screen).toMatch(/onClick=\{chooseGuided\}/)
    expect(screen).toMatch(/setMode\('choosing'\)/)
  })

  it('falls back to the guided conversation with one honest line when the model cannot run or load', () => {
    expect(NO_GPU_LINE).toMatch(/no WebGPU/)
    expect(NO_GPU_LINE).toMatch(/guided conversation is used instead/)
    expect(LOAD_FAILED_LINE).toMatch(/could not be downloaded/)
    expect(screen).toMatch(/setFellBack\(NO_GPU_LINE\); setMode\('guided'\)/)
    expect(screen).toMatch(/setFellBack\(LOAD_FAILED_LINE\); setMode\('guided'\)/)
  })

  it('uses the model only when the model was chosen, never in the guided conversation', () => {
    expect(screen).toMatch(/const model = mode === 'model' \?/)
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
