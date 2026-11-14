/**
 * Chooses a speech voice for the doctor. Browsers list every voice on the system, including
 * novelty ones, and the first in the list is rarely the most natural.
 */

export interface VoiceLike {
  name: string
  lang: string
  localService?: boolean
}

/** macOS novelty and character voices that should never be the doctor. */
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|wobble|fred|good news|jester|junior|kathy|organ|superstar|ralph|trinoids|whisper|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i
/** Voices known to sound calm and clear, best first. */
const GOOD = ['ava', 'zoe', 'samantha', 'serena', 'karen', 'daniel', 'moira', 'tessa', 'allison', 'evan', 'nathan', 'jamie', 'aria', 'jenny', 'sonia', 'libby']

function score(v: VoiceLike): number {
  const n = v.name.toLowerCase()
  let s = 0
  if (/premium/.test(n)) s += 100
  else if (/enhanced/.test(n)) s += 80
  else if (/natural/.test(n)) s += 90
  else if (/^google (uk|us) english/.test(n)) s += 60
  const i = GOOD.findIndex((g) => n.startsWith(g) || n.includes(` ${g} `))
  if (i >= 0) s += 40 - i
  if (/^en-(us|gb)/i.test(v.lang.replace('_', '-'))) s += 5
  return s
}

/** English voices fit for the doctor, most natural first. */
export function rankVoices<T extends VoiceLike>(voices: T[]): T[] {
  return voices
    .filter((v) => /^en/i.test(v.lang) && !NOVELTY.test(v.name))
    .map((v, i) => ({ v, i, s: score(v) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v)
}

/** The doctor's voice: Google UK English Male where the browser has it (Chrome), otherwise the most natural English voice. */
export function doctorVoice<T extends VoiceLike>(voices: T[]): T | undefined {
  return voices.find((v) => v.name === 'Google UK English Male') ?? rankVoices(voices)[0]
}
