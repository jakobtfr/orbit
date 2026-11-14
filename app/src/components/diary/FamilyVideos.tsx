import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { readDiary, writeDiary, type DiaryVideo } from '../../lib/diary'

function VideoPlayer({ clip }: { clip: DiaryVideo }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    const next = URL.createObjectURL(clip.blob)
    setUrl(next); setError(false)
    return () => URL.revokeObjectURL(next)
  }, [clip.blob])
  const ext = clip.blob.type.includes('mp4') ? 'mp4' : clip.blob.type.includes('quicktime') ? 'mov' : 'webm'
  return <div className="diary-player">
    <video key={url} src={url || undefined} controls playsInline preload="metadata" aria-label={clip.title} onError={() => setError(true)} />
    {error && <p className="diary-status">This browser cannot play this file. Try an MP4 or WebM video.</p>}
    <div className="diary-player-caption"><strong>{clip.title}</strong><a href={url || undefined} download={`orbit-${clip.kind}-${clip.id}.${ext}`}>Download ↓</a></div>
  </div>
}

export function FamilyVideos() {
  const [clips, setClips] = useState<DiaryVideo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [camera, setCamera] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const upload = useRef<HTMLInputElement>(null)
  const preview = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const alive = useRef(true)
  const stopTracks = () => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null }
  useEffect(() => {
    alive.current = true
    readDiary<DiaryVideo>('videos').then((videos) => {
      if (!alive.current) return
      const sorted = videos.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setClips(sorted); setSelected(sorted[0]?.id ?? null)
    }).catch(() => { if (alive.current) setStatus('Local storage unavailable. You can still record and download a message.') }).finally(() => { if (alive.current) setLoading(false) })
    return () => {
      alive.current = false
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stopTracks()
    }
  }, [])
  useEffect(() => { if (camera && preview.current) preview.current.srcObject = stream.current }, [camera])
  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [recording])
  useEffect(() => { if (elapsed >= 180 && recorder.current?.state === 'recording') recorder.current.stop() }, [elapsed])
  const storeClip = async (clip: DiaryVideo) => {
    let persisted = true
    try { await writeDiary('videos', clip) } catch { persisted = false }
    if (!alive.current) return
    setClips((previous) => [clip, ...previous]); setSelected(clip.id)
    setStatus(persisted ? 'Saved on this device.' : 'Available for this visit only. Download it to keep a copy; local storage could not save it.')
  }
  const importVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!file.type.startsWith('video/')) { setError('Please select a video file.'); return }
    if (file.size > 100 * 1024 * 1024) { setError('Choose a video smaller than 100 MB.'); return }
    setBusy(true)
    try { await storeClip({ id: crypto.randomUUID(), kind: 'family', title: file.name.replace(/\.[^.]+$/, ''), createdAt: new Date().toISOString(), blob: file }) }
    finally { if (alive.current) setBusy(false) }
  }
  const enableCamera = async () => {
    setError(''); setStatus('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('Camera recording is unavailable in this browser. You can still add a family video.'); return }
    setBusy(true)
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: true })
      if (!alive.current) { media.getTracks().forEach((track) => track.stop()); return }
      stream.current = media; setCamera(true)
    } catch { if (alive.current) setError('Camera or microphone unavailable. Allow access in your browser, or check whether another app is using them.') }
    finally { if (alive.current) setBusy(false) }
  }
  const startRecording = () => {
    if (!stream.current) return
    setError(''); setStatus(''); setElapsed(0)
    try {
      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'].find((mime) => MediaRecorder.isTypeSupported(mime))
      const mediaRecorder = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined)
      const chunks: BlobPart[] = []
      let failed = false
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      mediaRecorder.onerror = () => {
        failed = true; stopTracks()
        if (alive.current) { setRecording(false); setCamera(false); setError('Recording failed. Please try again.'); setBusy(false) }
      }
      mediaRecorder.onstop = async () => {
        stopTracks()
        if (!alive.current || failed) return
        setRecording(false); setCamera(false); setBusy(true)
        try {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' })
          if (!blob.size) { setError('The recording was empty. Please try again.'); return }
          await storeClip({ id: crypto.randomUUID(), kind: 'recorded', title: 'A message for home', createdAt: new Date().toISOString(), blob })
        } finally { if (alive.current) setBusy(false) }
      }
      recorder.current = mediaRecorder
      mediaRecorder.start(1000); setRecording(true)
    } catch { stopTracks(); setCamera(false); setError('This browser could not start recording. Please try another browser.') }
  }
  const selectedClip = clips.find((clip) => clip.id === selected)
  return <section className="planet-panel family-video-panel" aria-label="Family videos">
    <header><div><p className="eyebrow">A LITTLE CLOSER TO HOME</p><h2>Messages from home</h2></div><span className="diary-local-label">On this device</span></header>
    {camera ? <div className="camera-preview"><video ref={preview} autoPlay playsInline muted aria-label="Your camera preview" /><span className={recording ? 'recording-indicator' : 'camera-indicator'}>{recording ? `Recording · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}` : 'Camera preview · not recording'}</span></div> : selectedClip ? <VideoPlayer clip={selectedClip} /> : <div className="family-video-empty"><svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="5" y="12" width="25" height="24" rx="6" /><path d="m30 20 12-6v20l-12-6" /></svg><h3>A familiar face, whenever you need it.</h3><p>Add a video from family or friends, or record a message of your own.</p></div>}
    <div className="diary-video-actions">
      <input ref={upload} type="file" accept="video/*" hidden onChange={importVideo} aria-label="Choose a family video" />
      {!camera && <><button className="btn btn-secondary" disabled={busy || loading} onClick={() => upload.current?.click()}>Add family video</button><button className="btn btn-primary" disabled={busy || loading} onClick={enableCamera}>Record a message</button></>}
      {camera && !recording && <><button className="btn btn-primary" onClick={startRecording}>Start recording</button><button className="btn btn-secondary" onClick={() => { stopTracks(); setCamera(false) }}>Cancel</button></>}
      {recording && <button className="btn recording-stop" onClick={() => { if (recorder.current?.state === 'recording') recorder.current.stop() }}>■ Stop & save</button>}
    </div>
    <p className="diary-video-note">Private, device-local videos. Record up to 3 minutes; download a message to share it yourself.</p>
    {busy && <p className="diary-status" role="status">Please wait…</p>}{status && <p className="diary-status" role="status">{status}</p>}{error && <p className="diary-error" role="alert">{error}</p>}
    {!!clips.length && <div className="diary-video-library" aria-label="Saved videos">{clips.map((clip) => <button key={clip.id} aria-pressed={clip.id === selected} disabled={camera} onClick={() => { setSelected(clip.id); setError('') }}><span className="video-list-icon" aria-hidden="true">▷</span><span><strong>{clip.title}</strong><small>{clip.kind === 'family' ? 'From home' : 'Your recording'} · {new Date(clip.createdAt).toLocaleDateString()}</small></span><span aria-hidden="true">↗</span></button>)}</div>}
  </section>
}
