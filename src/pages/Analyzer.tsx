import { useState } from 'react'
import { ArrowLeft, ArrowRight, AudioLines, Check, CircleAlert, ClipboardPaste, Link2, LoaderCircle, Mail, MessageSquareText, RotateCcw, Shield, ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskBadge from '../components/RiskBadge'
import { analyze } from '../lib/api'
import { saveAnalysis } from '../lib/history'
import type { AnalysisResult, ScanType } from '../types'

const configs: Record<ScanType, { title: string; subtitle: string; placeholder: string; label: string; icon: LucideIcon; samples: string[] }> = {
  email: { title: 'Email threat analysis', subtitle: 'Paste the contents of a suspicious email to inspect it for phishing and impersonation signals.', placeholder: 'Paste the email subject and message body here…', label: 'EMAIL CONTENT', icon: Mail, samples: ['Your account will be suspended today. Verify your password and OTP at secure-bank-login.example.com', 'Hi, here are the notes from our meeting. Let me know if you have any questions.'] },
  sms: { title: 'SMS & message analysis', subtitle: 'Check a text message for common scam patterns, suspicious requests, and pressure tactics.', placeholder: 'Paste a suspicious text message here…', label: 'MESSAGE CONTENT', icon: MessageSquareText, samples: ['URGENT: Your bank account is blocked. Send your OTP immediately to restore access: bit.ly/account-help', 'Your delivery is scheduled for tomorrow between 10am and 12pm.'] },
  url: { title: 'Suspicious URL scanner', subtitle: 'Inspect a link’s structure without visiting it. THREATNEX never opens submitted URLs.', placeholder: 'https://example.com/suspicious-link', label: 'URL TO INSPECT', icon: Link2, samples: ['http://192.168.1.1/verify-account', 'https://www.example.com/about'] },
  voice: { title: 'Voice transcript analysis', subtitle: 'Review a voice-message transcript for social-engineering and impersonation signals.', placeholder: 'Paste a transcript from a recording you have permission to analyze…', label: 'VOICE TRANSCRIPT', icon: AudioLines, samples: ['Hello, I am calling from your bank. Tell me the one-time password to stop an unauthorized transfer.', 'Hi, this is a reminder about the appointment we scheduled for Thursday.'] },
}

export default function Analyzer({ type, onSaved, initialValue = '' }: { type: ScanType; onSaved: () => void; initialValue?: string }) {
  const config = configs[type]
  const Icon = config.icon
  const [input, setInput] = useState(initialValue)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!input.trim()) { setError('Enter content to analyze.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const analysis = await analyze(type, input.trim())
      await saveAnalysis(analysis)
      setResult(analysis)
      onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Analysis could not be completed.')
    } finally { setLoading(false) }
  }
  return <div className="page-stack">
    <section className="welcome-row"><div><Link to="/" className="back-link"><ArrowLeft size={14} /> OVERVIEW</Link><div className="eyebrow"><span className="eyebrow-line" /> ANALYSIS MODULE</div><h1>{config.title}</h1><p className="page-subtitle">{config.subtitle}</p></div><div className="module-title-icon"><Icon size={22} /></div></section>
    <div className="analysis-layout">
      <form className="panel analyzer-panel" onSubmit={submit}>
        <div className="panel-heading"><div><h3>{config.label}</h3><p>Content is processed for analysis and not sent to an external reputation service.</p></div><span className="secure-label"><Shield size={13} /> PRIVATE</span></div>
        <label className="input-label" htmlFor="analysis-input">{type === 'url' ? 'Paste the full URL below' : type === 'voice' ? 'Paste the voice transcript below' : 'Paste message text below'}</label>
        <textarea id="analysis-input" className="analysis-textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder={config.placeholder} maxLength={type === 'url' ? 2048 : 10000} rows={type === 'url' ? 3 : 10} />
        <div className="input-foot"><span>{input.length.toLocaleString()} / {type === 'url' ? '2,048' : '10,000'} characters</span><span><ClipboardPaste size={13} /> Input is analyzed locally by your THREATNEX API</span></div>
        {type === 'url' && <div className="url-safety-note"><ShieldCheck size={15} /><span><strong>Safe scanning:</strong> We inspect URL structure only. This link will not be opened or fetched.</span></div>}
        {error && <div className="form-error" role="alert"><CircleAlert size={16} />{error}</div>}
        <div className="analyzer-actions"><button className="button button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={16} /> Analyzing…</> : <>Analyze content <ArrowRight size={16} /></>}</button><button type="button" className="button button-quiet" onClick={() => { setInput(''); setResult(null); setError('') }}><RotateCcw size={14} /> Clear</button></div>
        <div className="sample-area"><span>TRY A SAMPLE</span>{config.samples.map((sample, index) => <button key={sample} type="button" className="sample-button" onClick={() => { setInput(sample); setError(''); setResult(null) }}>{index === 0 ? 'Suspicious example' : 'Benign example'} <ArrowRight size={12} /></button>)}</div>
      </form>
      <aside className="panel guidance-panel"><div className="guidance-icon"><ShieldCheck size={20} /></div><h3>How this analysis works</h3><p>Transparent heuristic checks look for common patterns—not a verdict. Always verify suspicious messages directly with the organization through a trusted channel.</p><div className="guidance-rule" /><div className="guidance-point"><span>01</span><p><strong>Pattern recognition</strong><br />Urgency, credential requests, payment pressure, and suspicious links.</p></div><div className="guidance-point"><span>02</span><p><strong>Clear findings</strong><br />See the specific signals and how each one contributes to the score.</p></div><div className="guidance-point"><span>03</span><p><strong>Privacy first</strong><br />No external AI or reputation API is contacted by default.</p></div><div className="guidance-disclaimer">No automated check can guarantee a message or website is safe.</div></aside>
    </div>
    {result && <section className="panel result-panel" aria-live="polite">
      <div className="result-header"><div><div className="eyebrow"><span className="eyebrow-line" /> ANALYSIS COMPLETE</div><h2>Threat assessment</h2></div><RiskBadge level={result.level} /></div>
      <div className="result-main"><div className={`score-ring score-${result.level.toLowerCase()}`}><strong>{result.score}</strong><span>RISK SCORE</span></div><div className="result-summary"><h3>{result.level === 'HIGH' ? 'Elevated risk detected' : result.level === 'MEDIUM' ? 'Some caution advised' : 'No strong threat signals found'}</h3><p>{result.explanation}</p><div className="result-recommendation"><div>{result.level === 'LOW' ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}</div><p><strong>Recommended action</strong><br />{result.recommendation}</p></div></div></div>
      <div className="result-details"><div className="result-section-title">DETECTED INDICATORS <span>{result.indicators.length}</span></div>{result.indicators.length ? <div className="indicator-list">{result.indicators.map((indicator) => <div className="indicator-row" key={indicator.label}><span className={`indicator-mark mark-${indicator.severity.toLowerCase()}`}><Check size={13} /></span><div><strong>{indicator.label}</strong><p>{indicator.detail}</p></div><RiskBadge level={indicator.severity} /></div>)}</div> : <div className="no-indicators"><ShieldCheck size={15} /> No specific indicators matched in this scan.</div>}<div className="result-meta">METHOD: {result.method} <span>·</span> {new Date(result.createdAt).toLocaleString()}</div></div>
    </section>}
  </div>
}
