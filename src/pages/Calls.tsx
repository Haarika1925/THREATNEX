import { useState } from 'react'
import { AlertTriangle, Headphones, Info, PhoneCall, ShieldCheck, Video } from 'lucide-react'

export default function Calls() {
  const [consent, setConsent] = useState(false)
  return <div className="page-stack">
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> CALL SAFETY</div><h1>Live call protection</h1><p className="page-subtitle">Understand what a browser-based protection demo can—and cannot—do.</p></div><div className="module-title-icon"><PhoneCall size={22} /></div></section>
    <div className="call-hero panel"><div className="call-illustration"><div><Headphones size={38} /></div><span className="call-wave wave-one" /><span className="call-wave wave-two" /></div><span className="feature-label">IN-APP WEBRTC · NOT ENABLED</span><h2>In-platform calling is planned</h2><p>This prototype does not connect calls or monitor live audio. WebRTC calling requires a signaling service, user consent, and a speech-to-text provider before real-time warnings can be shown responsibly.</p><button className="button button-disabled" disabled><Video size={16} /> Calling unavailable in prototype</button></div>
    <div className="call-warning"><div><AlertTriangle size={17} /></div><p><strong>Important limitation</strong><br />A website cannot access ordinary cellular SIM call audio. THREATNEX does not monitor, record, or transmit your phone calls. Native Android cellular-call integration is future scope.</p></div>
    <section className="panel consent-panel"><div className="consent-head"><div className="consent-icon"><ShieldCheck size={18} /></div><div><h3>Consent-first by design</h3><p>Any future call analysis must be transparent and opt-in for every participant.</p></div></div><label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I understand that no calls are currently being placed or analyzed.</span></label>{consent && <div className="consent-confirmation"><Info size={14} /> Acknowledged. Call functionality remains unavailable in this prototype.</div>}</section>
  </div>
}
