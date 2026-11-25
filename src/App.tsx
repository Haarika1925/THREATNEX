import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Analyzer from './pages/Analyzer'
import History from './pages/History'
import Voice from './pages/Voice'
import Calls from './pages/Calls'
import { getHistory } from './lib/history'
import { supabase } from './lib/supabase'
import type { AnalysisResult } from './types'

export default function App() {
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [historyError, setHistoryError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('threatnex.theme') === 'light' ? 'light' : 'dark',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('threatnex.theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080d17' : '#f2f6fb')
  }, [theme])
  useEffect(() => {
    let active = true
    getHistory().then((items) => { if (active) { setHistory(items); setHistoryError('') } })
      .catch((error: Error) => { if (active) setHistoryError(error.message) })
    return () => { active = false }
  }, [refresh])
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => setRefresh((value) => value + 1))
    return () => subscription.unsubscribe()
  }, [])
  const reload = () => setRefresh((value) => value + 1)
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
        <main className="page-content">
          {historyError && <div className="inline-error" role="alert">{historyError}</div>}
          <Routes>
            <Route path="/" element={<Dashboard history={history} />} />
            <Route path="/email" element={<Analyzer type="email" onSaved={reload} />} />
            <Route path="/sms" element={<Analyzer type="sms" onSaved={reload} />} />
            <Route path="/url" element={<Analyzer type="url" onSaved={reload} />} />
            <Route path="/voice" element={<Voice onSaved={reload} />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/history" element={<History history={history} onChanged={reload} />} />
            <Route path="*" element={<Dashboard history={history} />} />
          </Routes>
        </main>
        <footer className="app-footer"><span>THREATNEX <i>•</i> Unmasking the Invisible Threat <i>·</i> Detect. Decode. Defend.</span><span>HEURISTIC ANALYSIS · NOT A GUARANTEE</span></footer>
      </div>
    </div>
  )
}
