import { useEffect, useRef, useState } from 'react'
import { AlertCircle, AudioLines, CircleStop, FileAudio, Mic, MicOff, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import Analyzer from './Analyzer'

interface RecognitionResult extends ArrayLike<{ transcript: string }> {}
interface RecognitionEvent extends Event {
  results: ArrayLike<RecognitionResult>
}
interface BrowserRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => BrowserRecognition
  webkitSpeechRecognition?: new () => BrowserRecognition
}

const MAX_RECORDING_SECONDS = 120

export default function Voice({ onSaved }: { onSaved: () => void }) {
  const [recording, setRecording] = useState(false)
  const [recordingConsent, setRecordingConsent] = useState(false)
  const [transcriptionConsent, setTranscriptionConsent] = useState(false)
  const [transcriptionAvailable, setTranscriptionAvailable] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [analyzerOpen, setAnalyzerOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recognitionRef = useRef<BrowserRecognition | null>(null)
  const limitReachedRef = useRef(false)

  useEffect(() => {
    const speech = window as SpeechWindow
    setTranscriptionAvailable(Boolean(speech.SpeechRecognition ?? speech.webkitSpeechRecognition))
    return () => {
      try {
        recognitionRef.current?.abort?.()
      } catch {
        recognitionRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!audioUrl) return
    return () => URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => Math.min(seconds + 1, MAX_RECORDING_SECONDS)), 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    if (recording && elapsedSeconds >= MAX_RECORDING_SECONDS) {
      limitReachedRef.current = true
      recorderRef.current?.stop()
    }
  }, [elapsedSeconds, recording])

  async function startRecording() {
    setError('')
    setNotice('')
    if (!recordingConsent) {
      setError('Please confirm that you have permission to record this voice before starting.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser does not support microphone recording. Try an up-to-date browser on localhost or HTTPS.')
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      setElapsedSeconds(0)
      limitReachedRef.current = false
      setAudioUrl('')
      setTranscript('')
      setAnalyzerOpen(false)
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((candidate) => MediaRecorder.isTypeSupported(candidate))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        setError('The browser could not continue recording. Please try again.')
        setRecording(false)
        stream.getTracks().forEach((track) => track.stop())
      }
      recorder.onstop = () => {
        if (chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          setAudioUrl(URL.createObjectURL(blob))
          setNotice(limitReachedRef.current
            ? 'Recording reached the 2-minute limit. It is ready for playback and stays in this browser session.'
            : 'Recording is ready. It stays in this browser session and is not uploaded or saved to history.')
        }
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
        try {
          recognitionRef.current?.stop()
        } catch {
          recognitionRef.current = null
          setTranscribing(false)
        }
      }
      recorder.start(250)
      setRecording(true)

      if (transcriptionConsent) {
        const speechWindow = window as SpeechWindow
        const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
        if (Recognition) {
          const recognition = new Recognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = navigator.language || 'en-US'
          recognition.onresult = (event) => {
            const text = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join('')
            setTranscript(text)
          }
          recognition.onerror = (event) => {
            setTranscribing(false)
            setNotice(`Browser transcription stopped${event.error ? ` (${event.error})` : ''}. You can still enter the transcript manually.`)
          }
          recognition.onend = () => setTranscribing(false)
          recognitionRef.current = recognition
          try {
            recognition.start()
            setTranscribing(true)
          } catch {
            setNotice('Browser transcription could not start. You can still enter the transcript manually.')
          }
        }
      }
    } catch (reason) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setError(reason instanceof Error && reason.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow microphone access in your browser settings, then try again.'
        : reason instanceof Error && reason.name === 'NotFoundError'
          ? 'No microphone was found. Connect a microphone and try again.'
          : 'Could not start recording. Check microphone permissions and try again.')
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  function clearRecording() {
    if (recording) stopRecording()
    setAudioUrl('')
    setTranscript('')
    setElapsedSeconds(0)
    limitReachedRef.current = false
    setAnalyzerOpen(false)
    setError('')
    setNotice('')
  }

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

  return <div className="page-stack">
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> VOICE ANALYSIS</div><h1>Voice message analysis</h1><p className="page-subtitle">Record a voice message with permission, then review its transcript for scam indicators.</p></div><div className="module-title-icon"><AudioLines size={22} /></div></section>

    <section className="panel voice-recorder">
      <div className="voice-recorder-heading">
        <div className="voice-mic-icon"><Mic size={19} /></div>
        <div><h2>Record a voice message</h2><p>Audio is captured by your browser and stays in this page session.</p></div>
        <span className="feature-label">MAX 02:00</span>
      </div>
      <div className={`recording-display ${recording ? 'is-recording' : ''}`}>
        <div className="recording-indicator"><span />{recording ? 'RECORDING' : audioUrl ? 'RECORDING READY' : 'READY TO RECORD'}</div>
        <strong>{formatTime(elapsedSeconds)}</strong>
        <span className="recording-limit">/ 02:00</span>
        {recording && <div className="recording-bars" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 45}ms` }} />)}</div>}
      </div>
      <div className="voice-consents">
        <label className="consent-check"><input type="checkbox" checked={recordingConsent} disabled={recording} onChange={(event) => setRecordingConsent(event.target.checked)} /><span>I have permission to record this voice message.</span></label>
        <label className="consent-check"><input type="checkbox" checked={transcriptionConsent} disabled={recording} onChange={(event) => setTranscriptionConsent(event.target.checked)} /><span>Also use browser speech-to-text while recording. The browser may send audio to its own recognition provider.</span></label>
      </div>
      <div className="voice-recording-actions">
        {!recording ? <button className="button button-primary" onClick={() => void startRecording()}><Mic size={15} /> Start recording</button>
          : <button className="button button-record-stop" onClick={stopRecording}><CircleStop size={16} /> Stop recording</button>}
        {(audioUrl || transcript || error) && <button className="button button-quiet" onClick={clearRecording} disabled={recording}><RotateCcw size={14} /> Clear</button>}
        {transcribing && <span className="transcribing-status"><span /> Transcribing in browser…</span>}
      </div>
      {error && <div className="form-error" role="alert"><AlertCircle size={15} />{error}</div>}
      {notice && <div className="voice-notice" role="status"><ShieldCheck size={15} />{notice}</div>}
      {audioUrl && <div className="audio-playback"><div><FileAudio size={16} /><span>Your recording</span></div><audio controls src={audioUrl}>Audio playback is not supported by this browser.</audio></div>}
      <div className="voice-transcript">
        <div className="transcript-heading"><label htmlFor="voice-transcript">TRANSCRIPT</label><span>{transcriptionAvailable ? 'Browser transcription available' : 'Manual transcript'}</span></div>
        <textarea id="voice-transcript" className="analysis-textarea" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder={transcriptionAvailable ? 'Enable browser speech-to-text above, or type the voice transcript here…' : 'Speech-to-text is not supported in this browser. Type the voice transcript here…'} maxLength={10000} rows={5} />
        <div className="transcript-actions"><span>{transcript.length.toLocaleString()} / 10,000 characters</span><button className="button button-primary" disabled={!transcript.trim()} onClick={() => setAnalyzerOpen(true)}><Sparkles size={14} /> Analyze transcript</button></div>
      </div>
      {!transcriptionAvailable && <div className="voice-notice"><MicOff size={15} />Automatic transcription is not supported by this browser. Recording and manual transcript analysis are still available.</div>}
    </section>

    {analyzerOpen && transcript.trim() && <Analyzer key={transcript} type="voice" initialValue={transcript} onSaved={onSaved} />}
    <div className="privacy-note"><ShieldCheck size={15} /><span>Recording requires your permission. Audio is not uploaded or stored by THREATNEX; it is cleared when you leave this page. Browser speech-to-text may use an external service only when you opt in.</span></div>
  </div>
}
