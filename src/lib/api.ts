import type { AnalysisResult, ScanType } from '../types'

export async function analyze(type: ScanType, input: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, input }),
  })
  const payload = await response.json() as { result?: AnalysisResult; error?: string }
  if (!response.ok || !payload.result) throw new Error(payload.error ?? 'Analysis service is unavailable.')
  return payload.result
}
