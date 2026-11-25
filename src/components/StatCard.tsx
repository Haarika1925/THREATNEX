import type { LucideIcon } from 'lucide-react'

export default function StatCard({ title, value, note, icon: Icon, tone }: {
  title: string; value: number; note: string; icon: LucideIcon; tone: string
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <div className="stat-heading"><span>{title}</span><span className="stat-window">ALL TIME</span></div>
      <div className="stat-value">{value.toLocaleString()}</div>
      <div className="stat-note"><span className="note-dot" />{note}</div>
    </article>
  )
}
