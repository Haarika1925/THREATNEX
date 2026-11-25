import type { RiskLevel } from '../types'

export default function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`risk-badge risk-${level.toLowerCase()}`}><i />{level}</span>
}
