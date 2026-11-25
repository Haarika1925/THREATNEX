import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Radar, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import RiskBadge from '../components/RiskBadge'
import StatCard from '../components/StatCard'
import type { AnalysisResult } from '../types'

const modules = [
  { path: '/email', name: 'Email analysis', detail: 'Inspect suspicious email content', icon: '✉', tint: 'blue', tag: 'READY' },
  { path: '/sms', name: 'SMS & messages', detail: 'Check messages for scam patterns', icon: '▤', tint: 'cyan', tag: 'READY' },
  { path: '/url', name: 'URL scanner', detail: 'Evaluate a link without opening it', icon: '↗', tint: 'purple', tag: 'READY' },
  { path: '/voice', name: 'Voice analysis', detail: 'Review a call or voice transcript', icon: '≋', tint: 'green', tag: 'BETA' },
]

export default function Dashboard({ history }: { history: AnalysisResult[] }) {
  const threats = history.filter((scan) => scan.level !== 'LOW').length
  const high = history.filter((scan) => scan.level === 'HIGH').length
  const safe = history.filter((scan) => scan.level === 'LOW').length
  const highPercent = history.length ? Math.round((high / history.length) * 100) : 0
  const distribution = (level: string) => history.length ? Math.round((history.filter((scan) => scan.level === level).length / history.length) * 100) : 0
  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> UNMASKING THE INVISIBLE THREAT</div><h1>Intelligence Against Digital Deception.</h1><p className="page-subtitle">Detect suspicious signals, decode risk, and defend with confidence.</p></div>
        <div className="welcome-meta"><span className="live-indicator" /> SYSTEM OPERATIONAL <span className="meta-divider" /> LOCAL ANALYSIS</div>
      </section>
      <section className="hero-banner">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-copy"><div className="hero-kicker"><Sparkles size={14} /> UNMASKING THE INVISIBLE THREAT</div><h2>Detect. Decode.<br /><span>Defend.</span></h2><p>Analyze suspicious content with transparent, privacy-first threat detection.</p><Link to="/email" className="button button-primary">Start an analysis <ArrowRight size={16} /></Link></div>
        <div className="hero-visual"><div className="radar-ring ring-a" /><div className="radar-ring ring-b" /><div className="radar-ring ring-c" /><div className="radar-center"><Radar size={41} /></div><div className="radar-sweep" /><span className="radar-node node-a" /><span className="radar-node node-b" /><span className="radar-node node-c" /><div className="radar-label"><span /> THREAT MONITORING ACTIVE</div></div>
      </section>
      <section className="stats-grid">
        <StatCard title="Total analyses" value={history.length} note="Scans in your history" icon={Radar} tone="tone-blue" />
        <StatCard title="Threats identified" value={threats} note="Medium & high risk" icon={ShieldAlert} tone="tone-red" />
        <StatCard title="Safe analyses" value={safe} note="No strong signals found" icon={ShieldCheck} tone="tone-green" />
        <StatCard title="High risk" value={high} note={history.length ? `${highPercent}% of all analyses` : 'No high-risk results yet'} icon={ArrowUpRight} tone="tone-amber" />
      </section>
      <section className="dashboard-grid">
        <div className="panel distribution-panel">
          <div className="panel-heading"><div><h3>Risk distribution</h3><p>Breakdown across completed analyses</p></div><span className="panel-menu">•••</span></div>
          {history.length ? <div className="distribution-content"><div className="donut-wrap"><div className="donut-chart" style={{ background: `conic-gradient(#fa6575 0 ${distribution('HIGH')}%, #f7b955 ${distribution('HIGH')}% ${distribution('HIGH') + distribution('MEDIUM')}%, #43d5a1 ${distribution('HIGH') + distribution('MEDIUM')}% 100%)` }}><div className="donut-hole"><strong>{history.length}</strong><span>ANALYSES</span></div></div></div><div className="legend-list"><div><i className="legend-dot high" /><span>High risk</span><b>{distribution('HIGH')}%</b></div><div><i className="legend-dot medium" /><span>Medium risk</span><b>{distribution('MEDIUM')}%</b></div><div><i className="legend-dot low" /><span>Low risk</span><b>{distribution('LOW')}%</b></div></div></div> : <EmptyState icon={Radar} title="No risk data yet" description="Your risk distribution will appear here after your first analysis." />}
        </div>
        <div className="panel activity-panel">
          <div className="panel-heading"><div><h3>Recent analyses</h3><p>Your latest threat checks</p></div><Link to="/history" className="text-link">View history <ArrowRight size={14} /></Link></div>
          {history.length ? <div className="activity-list">{history.slice(0, 5).map((scan) => <div className="activity-row" key={scan.id}><div className={`activity-type type-${scan.type}`}>{scan.type === 'email' ? '✉' : scan.type === 'sms' ? '▤' : scan.type === 'url' ? '↗' : '≋'}</div><div className="activity-description"><strong>{scan.type === 'url' ? scan.input : `${scan.type.charAt(0).toUpperCase()}${scan.type.slice(1)} analysis`}</strong><small><Clock3 size={12} />{new Date(scan.createdAt).toLocaleString()}</small></div><RiskBadge level={scan.level} /><span className="activity-score">{scan.score}</span></div>)}</div> : <EmptyState icon={Clock3} title="Nothing to review yet" description="Completed analyses will be listed here, with their risk scores and timestamps." />}
        </div>
      </section>
      <section className="module-section">
        <div className="section-heading"><div><div className="eyebrow">YOUR PROTECTION TOOLKIT</div><h2>Analysis modules</h2><p>Choose what you’d like to check.</p></div><span className="module-count">04 MODULES</span></div>
        <div className="module-grid">{modules.map((module) => <Link className="module-card" to={module.path} key={module.name}><div className={`module-icon ${module.tint}`}>{module.icon}</div><span className={`module-tag ${module.tag === 'BETA' ? 'beta' : ''}`}>{module.tag}</span><h3>{module.name}</h3><p>{module.detail}</p><div className="module-action">Open module <ArrowRight size={14} /></div></Link>)}</div>
      </section>
      <section className="notice-strip"><div className="notice-icon"><CheckCircle2 size={17} /></div><p><strong>Transparent by design.</strong> Results are generated by on-device style heuristics and are not a guarantee of safety. Never share passwords, OTPs, or sensitive account details.</p><div className="notice-arrows"><ArrowDownRight size={14} /></div></section>
    </div>
  )
}
