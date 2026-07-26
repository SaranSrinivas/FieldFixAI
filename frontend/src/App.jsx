import { useEffect } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AppStateProvider, useAppState } from './context/AppStateContext'
import { DocumentIcon, InfoIcon, PulseIcon, SearchIcon } from './components/icons'
import HomePage from './pages/HomePage'
import KnowledgePage from './pages/KnowledgePage'
import InsightsPage from './pages/InsightsPage'
import AboutPage from './pages/AboutPage'

const NAV_ITEMS = [
  { to: '/', label: 'AI Search', icon: SearchIcon, end: true },
  { to: '/knowledge', label: 'Knowledge', icon: DocumentIcon, end: false },
  { to: '/insights', label: 'Insights', icon: PulseIcon, end: false },
  { to: '/about', label: 'About', icon: InfoIcon, end: false },
]

function AppShell() {
  const { status, isReady, setIsReady } = useAppState()

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800)
    return () => clearTimeout(timer)
  }, [setIsReady])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="space-y-8 px-6 text-center">
          <div className="mx-auto h-24 w-24 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
          <div>
            <h1 className="text-4xl font-semibold">FieldFix AI</h1>
            <p className="mt-3 max-w-xl text-slate-400">
              Helping field service teams find manual guidance quickly and get AI-assisted troubleshooting advice.
            </p>
          </div>
          <p className="text-slate-500">Loading the repair intelligence experience…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <img
          src="/FieldFixSplash.png"
          alt="FieldFix Splash"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-12">
          <div className="rounded-[2rem] border border-slate-700/80 bg-slate-950/90 p-7 shadow-2xl shadow-slate-950/40 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <img src="/FieldFixLogo.png" alt="FieldFix Logo" className="h-20 w-20 rounded-3xl bg-slate-900/90 p-3 shadow-lg" />
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Field service intelligence</p>
                  <h1 className="mt-2 text-4xl font-semibold text-white">FieldFix AI</h1>
                  <p className="mt-2 max-w-2xl text-slate-400">
                    Find the right manual content faster and turn symptoms into practical repair guidance.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5 shadow-inner">
                <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Live status</p>
                <p className="mt-2 text-lg font-medium text-slate-100">{status}</p>
              </div>
            </div>

            <nav className="mt-8 flex flex-wrap gap-3">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-sky-500/60 bg-sky-500/10 text-slate-100'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}

export default App
