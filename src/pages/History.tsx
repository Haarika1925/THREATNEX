import { useState } from 'react'
import { AlertCircle, Clock3, Filter, Search, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import RiskBadge from '../components/RiskBadge'
import { deleteAnalysis } from '../lib/history'
import type { AnalysisResult } from '../types'

export default function History({ history, onChanged }: { history: AnalysisResult[]; onChanged: () => void }) {
  const [type, setType] = useState('all')
  const [level, setLevel] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const filtered = history.filter((scan) => (type === 'all' || scan.type === type) && (level === 'all' || scan.level === level) && `${scan.input} ${scan.explanation}`.toLowerCase().includes(query.toLowerCase()))
  async function remove(id: string) {
    if (!window.confirm('Delete this analysis from your history?')) return
    try { await deleteAnalysis(id); onChanged(); setSelected(null); setError('') } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete this analysis.') }
  }
  return <div className="page-stack">
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> AUDIT TRAIL</div><h1>Analysis history</h1><p className="page-subtitle">Review your completed scans and findings.</p></div><div className="history-count">{history.length}<span> TOTAL SCANS</span></div></section>
    <div className="panel history-panel">
      <div className="filter-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search analyses…" aria-label="Search analyses" /></div><div className="filter-controls"><Filter size={15} /><select aria-label="Filter by scan type" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All scan types</option><option value="email">Email</option><option value="sms">SMS</option><option value="url">URL</option><option value="voice">Voice</option></select><select aria-label="Filter by risk level" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">All risk levels</option><option value="HIGH">High risk</option><option value="MEDIUM">Medium risk</option><option value="LOW">Low risk</option></select></div></div>
      {error && <div className="form-error" role="alert"><AlertCircle size={15} />{error}</div>}
      {filtered.length ? <div className="history-table-wrap"><table className="history-table"><thead><tr><th>SCAN TYPE</th><th>CONTENT / SUBJECT</th><th>DATE & TIME</th><th>RISK LEVEL</th><th>SCORE</th><th></th></tr></thead><tbody>{filtered.map((scan) => <tr key={scan.id} onClick={() => setSelected(scan)}><td><span className={`table-type type-${scan.type}`}>{scan.type.toUpperCase()}</span></td><td className="history-input">{scan.type === 'url' ? scan.input : scan.input.slice(0, 90) || `${scan.type} analysis`}</td><td className="history-date"><Clock3 size={13} />{new Date(scan.createdAt).toLocaleString()}</td><td><RiskBadge level={scan.level} /></td><td><span className={`table-score ${scan.level.toLowerCase()}`}>{scan.score}<span>/100</span></span></td><td><button className="icon-button delete-button" aria-label="Delete analysis" onClick={(event) => { event.stopPropagation(); void remove(scan.id) }}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={Clock3} title={history.length ? 'No matching analyses' : 'Your history is clear'} description={history.length ? 'Try changing your filters or search terms.' : 'Analyses you complete will appear here. History is stored in this browser unless Supabase is configured and you are signed in.'} />}
      <div className="history-footer"><span>SHOWING {filtered.length} OF {history.length} ANALYSES</span><span><span className="history-local-dot" /> {import.meta.env.VITE_SUPABASE_URL ? 'SUPABASE CONFIGURED · Sign in to use cloud history' : 'LOCAL BROWSER STORAGE'}</span></div>
    </div>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="result-modal panel" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="eyebrow">SAVED ANALYSIS · {selected.type.toUpperCase()}</div><h2>Scan details</h2><div className="modal-risk"><RiskBadge level={selected.level} /><strong>{selected.score}<small>/100</small></strong></div><p className="modal-copy">{selected.explanation}</p><div className="result-recommendation"><div><AlertCircle size={17} /></div><p><strong>Recommended action</strong><br />{selected.recommendation}</p></div><div className="modal-meta">{new Date(selected.createdAt).toLocaleString()} · {selected.method}</div></section></div>}
  </div>
}
