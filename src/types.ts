export type ScanType = 'email' | 'sms' | 'url' | 'voice'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Indicator {
  label: string
  detail: string
  severity: RiskLevel
}

export interface AnalysisResult {
  id: string
  type: ScanType
  input: string
  score: number
  level: RiskLevel
  indicators: Indicator[]
  explanation: string
  recommendation: string
  method: string
  createdAt: string
  transcript?: string
}
