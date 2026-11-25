import type { AnalysisResult } from '../types'
import { supabase } from './supabase'

const STORAGE_KEY = 'threatnex.scan-history.v1'

export async function getHistory(): Promise<AnalysisResult[]> {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, scan_type, input_excerpt, score, level, indicators, explanation, recommendation, method, created_at, transcript')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw new Error(`Could not load cloud history: ${error.message}`)
      return (data ?? []).map((row) => ({
        id: row.id,
        type: row.scan_type,
        input: row.input_excerpt,
        score: row.score,
        level: row.level,
        indicators: row.indicators,
        explanation: row.explanation,
        recommendation: row.recommendation,
        method: row.method,
        createdAt: row.created_at,
        transcript: row.transcript ?? undefined,
      }))
    }
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AnalysisResult[]
  } catch {
    throw new Error('Local scan history could not be read.')
  }
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('scan_history').insert({
        id: result.id,
        user_id: user.id,
        scan_type: result.type,
        input_excerpt: result.input.slice(0, 400),
        score: result.score,
        level: result.level,
        indicators: result.indicators,
        explanation: result.explanation,
        recommendation: result.recommendation,
        method: result.method,
        transcript: result.transcript ?? null,
        created_at: result.createdAt,
      })
      if (error) throw new Error(`Analysis completed, but cloud history could not be saved: ${error.message}`)
      return
    }
  }
  const history = await getHistory()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([result, ...history].slice(0, 100)))
}

export async function deleteAnalysis(id: string): Promise<void> {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('scan_history').delete().eq('id', id)
      if (error) throw new Error(`Could not delete scan: ${error.message}`)
      return
    }
  }
  const history = await getHistory()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.filter((scan) => scan.id !== id)))
}
