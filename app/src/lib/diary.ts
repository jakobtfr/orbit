/** Private, device-local storage. Nothing is uploaded or sent to another person. */
const DATABASE = 'orbit-personal-diary'
export type DiaryStore = 'entries' | 'videos'

export interface DiaryVideo {
  id: string
  kind: 'family' | 'recorded'
  title: string
  createdAt: string
  blob: Blob
}

function openDiary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Local diary storage is unavailable.')); return }
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      for (const store of ['entries', 'videos']) if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Close other diary tabs and try again.'))
  })
}

export async function readDiary<T>(store: DiaryStore): Promise<T[]> {
  const db = await openDiary()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const request = tx.objectStore(store).getAll()
    tx.oncomplete = () => { db.close(); resolve(request.result as T[]) }
    tx.onabort = () => { db.close(); reject(tx.error) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function writeDiary<T extends { id: string }>(store: DiaryStore, record: T): Promise<void> {
  const db = await openDiary()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(record)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onabort = () => { db.close(); reject(tx.error) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export const CONNECTION_QUESTIONS = [
  { key: 'separation', label: 'How does being away from family and friends feel today?', placeholder: 'What do you miss? What feels easier or harder today?' },
  { key: 'connection', label: 'When did you last feel connected to someone back home?', placeholder: 'A message, a memory, a conversation…' },
  { key: 'support', label: 'What would help you feel closer to them?', placeholder: 'Something you would like to share, ask for, or plan.' },
] as const
export type ConnectionAnswers = Partial<Record<typeof CONNECTION_QUESTIONS[number]['key'], string>>
