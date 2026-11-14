import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { FamilyVideos } from '../components/diary/FamilyVideos'
import { readDiary, writeDiary } from './diary'

describe('private diary safeguards', () => {
  it('reports unavailable local storage instead of silently claiming persistence', async () => {
    vi.stubGlobal('indexedDB', undefined)
    try {
      await expect(readDiary('entries')).rejects.toThrow('unavailable')
      await expect(writeDiary('entries', { id: 'example' })).rejects.toThrow('unavailable')
    } finally { vi.unstubAllGlobals() }
  })
  it('does not request camera access when the video section is rendered', () => {
    const getUserMedia = vi.fn()
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    try {
      const html = renderToStaticMarkup(createElement(FamilyVideos))
      expect(getUserMedia).not.toHaveBeenCalled()
      expect(html).toContain('Record a message')
      expect(html).toContain('Add family video')
      expect(html).not.toContain('autoPlay')
    } finally { vi.unstubAllGlobals() }
  })
})
