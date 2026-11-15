import type { FamilyMember, Turn } from './family'
import type { AppState } from './types'

/**
 * The private side of a family call. What the astronaut and their people say to each other is kept
 * apart from the health record: in its own store on the device, encrypted with a key the browser
 * will not hand out. Readings and urgent words are not kept here; they belong to the health record.
 */

export interface PrivateLine {
  day: number
  /** The family member the call was with, by id. */
  with: string
  from: 'you' | 'recorded' | 'ai'
  text: string
}

/** What one turn of a call adds to the private log. */
export function privateLines(state: AppState, member: FamilyMember, said: string, turn: Turn): PrivateLine[] {
  if (turn.kind === 'reading' || turn.kind === 'escalate' || turn.kind === 'symptom') return []
  const base = { day: state.day, with: member.id }
  const out: PrivateLine[] = [{ ...base, from: 'you', text: said }]
  for (const seg of turn.segments) {
    if (seg.kind === 'recorded') out.push({ ...base, from: 'recorded', text: seg.text })
    else if (seg.kind === 'link' || seg.kind === 'preview') out.push({ ...base, from: 'ai', text: seg.text })
  }
  return out
}

/* ---------- encryption (AES-GCM, 256 bit, Web Crypto) ---------- */

export function makeKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

export async function seal(key: CryptoKey, value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(value))
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  const out = new Uint8Array(iv.length + sealed.length)
  out.set(iv)
  out.set(sealed, iv.length)
  return toBase64(out)
}

export async function unseal<T>(key: CryptoKey, stored: string): Promise<T> {
  const bytes = fromBase64(stored)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12))
  return JSON.parse(new TextDecoder().decode(plain)) as T
}

/* ---------- the store on the device ---------- */

const DATABASE = 'orbit-family-private'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Private storage is unavailable.')); return }
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => { request.result.createObjectStore('kv') }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function get<T>(id: string): Promise<T | undefined> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readonly')
    const request = tx.objectStore('kv').get(id)
    tx.oncomplete = () => { db.close(); resolve(request.result as T | undefined) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

async function put(id: string, value: unknown): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(value, id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

let keyOnce: Promise<CryptoKey> | undefined

/** The device's key. It is looked up or made once, so two writes at the same moment can never make two keys. */
function deviceKey(): Promise<CryptoKey> {
  keyOnce ??= (async () => {
    const have = await get<CryptoKey>('key')
    if (have) return have
    const made = await makeKey()
    await put('key', made)
    return made
  })()
  keyOnce.catch(() => { keyOnce = undefined })
  return keyOnce
}

/** Reads one private value, or the fallback when nothing is stored or storage is unavailable. */
export async function readPrivate<T>(id: string, fallback: T): Promise<T> {
  const stored = await get<string>(id)
  return stored ? unseal<T>(await deviceKey(), stored) : fallback
}

export async function writePrivate(id: string, value: unknown): Promise<void> {
  await put(id, await seal(await deviceKey(), value))
}
