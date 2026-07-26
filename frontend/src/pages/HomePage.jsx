import { useRef, useState } from 'react'
import { API_BASE } from '../api'
import { useAppState } from '../context/AppStateContext'
import { ResultBlock } from '../components/ResultBlock'
import { SymptomTypeahead } from '../components/SymptomTypeahead'
import { TagChips } from '../components/TagChips'
import { MicIcon, SearchIcon, SparklesIcon } from '../components/icons'

function HomePage() {
  const {
    setStatus,
    catalogResults,
    setCatalogResults,
    documentResults,
    setDocumentResults,
    suggestions,
    setSuggestions,
  } = useAppState()

  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('top_k')
  const [issue, setIssue] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)

  const searchRequestIdRef = useRef(0)
  const searchAbortControllerRef = useRef(null)
  const aiRequestIdRef = useRef(0)
  const aiAbortControllerRef = useRef(null)

  const runSearch = async (queryOverride, modeOverride) => {
    const effectiveQuery = queryOverride ?? query
    const effectiveMode = modeOverride ?? searchMode

    if (!effectiveQuery.trim()) {
      setStatus('Enter a search term.')
      return
    }

    const requestId = ++searchRequestIdRef.current
    searchAbortControllerRef.current?.abort()
    const controller = new AbortController()
    searchAbortControllerRef.current = controller

    setStatus('Searching knowledge base...')

    try {
      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: effectiveQuery, mode: effectiveMode, top_k: 5 }),
        signal: controller.signal,
      })

      if (requestId !== searchRequestIdRef.current) return

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const result = await response.json()
      if (requestId !== searchRequestIdRef.current) return

      const catalog = result.catalog || []
      const documents = result.documents || []
      setCatalogResults(catalog)
      setDocumentResults(documents)
      if (catalog.length === 0 && documents.length === 0) {
        setSuggestions(null)
      }
      setStatus(`Found ${catalog.length + documents.length} matches.`)
    } catch (error) {
      if (error.name === 'AbortError' || requestId !== searchRequestIdRef.current) return
      setCatalogResults([])
      setDocumentResults([])
      setSuggestions(null)
      setStatus('Search failed. Is the backend running?')
    }
  }

  const handleTagSelect = (tag) => {
    setQuery(tag)
    setSearchMode('tag')
    runSearch(tag, 'tag')
  }

  const handleAISubmit = async (text = issue) => {
    if (!text.trim()) {
      setStatus('Provide an issue description before requesting AI suggestions.')
      return
    }

    const requestId = ++aiRequestIdRef.current
    aiAbortControllerRef.current?.abort()
    const controller = new AbortController()
    aiAbortControllerRef.current = controller

    setStatus('Requesting AI suggestions...')

    try {
      const response = await fetch(`${API_BASE}/ai_suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue: text, snippets: documentResults.map((item) => item.snippet) }),
        signal: controller.signal,
      })

      if (requestId !== aiRequestIdRef.current) return

      if (!response.ok) {
        setSuggestions(null)
        setStatus('AI suggestion request failed.')
        return
      }

      const result = await response.json()
      if (requestId !== aiRequestIdRef.current) return

      const hasContent = [result.causes, result.temporary_fixes, result.diagnostics, result.safety_notes].some(
        (list) => Array.isArray(list) && list.length > 0
      )

      if (!hasContent) {
        setSuggestions(null)
        setStatus('No AI suggestions found for that description.')
        return
      }

      setSuggestions(result)
      setStatus('AI suggestions received.')
    } catch (error) {
      if (error.name === 'AbortError' || requestId !== aiRequestIdRef.current) return
      setSuggestions(null)
      setStatus('AI suggestion request failed. Is the backend running?')
    }
  }

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Web Speech API not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setVoiceActive(true)
      setStatus('Listening for voice input...')
    }
    recognition.onend = () => setVoiceActive(false)
    recognition.onerror = (event) => {
      setVoiceActive(false)
      const reason = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Microphone access was denied.'
        : `Voice input failed (${event.error}).`
      setStatus(reason)
    }
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setIssue((prev) => (prev ? `${prev} ${text}` : text))
      handleAISubmit(text)
    }

    recognition.start()
  }

  const totalMatches = catalogResults.length + documentResults.length

  return (
    <div className="space-y-8 py-8">
      <section className="rounded-[2rem] border border-sky-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-sky-500/10">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">AI-powered search</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Find answers fast</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Search manuals, equipment catalog data, and tribal knowledge in one place. Start typing a
          symptom to get autofill suggestions.
        </p>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <SymptomTypeahead
              value={query}
              onChange={setQuery}
              onSelect={(text) => runSearch(text, searchMode)}
              placeholder="Describe the symptom or search term (e.g. hydraulic pressure loss)"
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 p-5 text-lg text-slate-100 outline-none transition focus:border-sky-500"
            />
          </div>

          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
            className="rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 outline-none transition focus:border-sky-500 lg:w-72"
          >
            <optgroup label="General">
              <option value="top_k">Top-K Semantic Search</option>
            </optgroup>
            <optgroup label="Components">
              <option value="component">Semantic Search for Components</option>
              <option value="tag">Tag-Based Semantic Search (Hybrid)</option>
              <option value="cross_component">Cross-Machine Component Similarity</option>
              <option value="motion_type">Motion-Type Semantic Search</option>
              <option value="engineering_role">Engineering Role Semantic Search</option>
            </optgroup>
            <optgroup label="Machines">
              <option value="machine">Semantic Search for Machines</option>
              <option value="motion_signature">Motion Signature Search (Semantic)</option>
              <option value="machine_to_machine">Machine-to-Machine Similarity</option>
            </optgroup>
            <optgroup label="Animations">
              <option value="animation">Semantic Search for Animations</option>
            </optgroup>
          </select>

          <button
            onClick={() => runSearch()}
            className="btn-primary inline-flex items-center justify-center rounded-3xl bg-sky-600 px-8 py-4 text-base font-semibold text-white"
          >
            <SearchIcon className="mr-2 h-5 w-5" />
            Search
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-700 bg-slate-900/90 p-8 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Relevant matches</h2>
            <p className="mt-1 text-sm text-slate-400">Results from manuals, tribal knowledge, and the equipment catalog.</p>
          </div>
          <span className="rounded-3xl bg-slate-800 px-4 py-2 text-sm text-slate-300">{totalMatches} matches</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {totalMatches === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-slate-400 lg:col-span-2">
              No matches yet. Enter a query and run a search.
            </div>
          ) : (
            <>
              {catalogResults.map((item, index) => (
                <div key={`catalog-${index}`} className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.kind}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.label}</p>
                  {item.machine ? <p className="mt-2 text-slate-400">Machine: {item.machine}</p> : null}
                  {item.details ? <p className="mt-2 text-slate-300">{item.details}</p> : null}
                  <TagChips tags={item.tags} onSelect={handleTagSelect} />
                  <p className="mt-3 text-sm text-sky-400">Score: {item.score}</p>
                </div>
              ))}
              {documentResults.map((match, index) => (
                <div key={`document-${index}`} className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    {match.source_type === 'tribal_knowledge'
                      ? `Tribal knowledge${match.title ? ` · ${match.title}` : ''}`
                      : `${match.filename ?? 'Manual'} · Page ${match.page}`}
                  </p>
                  <p className="mt-3 text-slate-100">{match.snippet}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Describe the issue</h3>
          <p className="mt-2 text-sm text-slate-400">Use typed or voice input to request AI troubleshooting guidance.</p>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-slate-300">Issue Description</span>
              <div className="mt-3">
                <SymptomTypeahead
                  value={issue}
                  onChange={setIssue}
                  multiline
                  rows={6}
                  placeholder="Describe the observed problem or symptom"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 outline-none transition focus:border-emerald-500"
                />
              </div>
            </label>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleAISubmit()}
                className="btn-primary rounded-3xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white"
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                Get AI Suggestions
              </button>
              <button
                onClick={handleVoice}
                className={`btn-secondary rounded-3xl px-6 py-3 text-base font-semibold transition ${voiceActive ? 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}
              >
                <MicIcon className="mr-2 h-4 w-4" />
                {voiceActive ? 'Listening…' : 'Voice Input'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Troubleshooting guidance</h3>
          <p className="mt-2 text-sm text-slate-400">Structured suggestions generated from the issue and retrieved snippets.</p>

          <div className="mt-5 space-y-5">
            {suggestions ? (
              <>
                <ResultBlock title="Causes" items={suggestions.causes} />
                <ResultBlock title="Temporary Fixes" items={suggestions.temporary_fixes} />
                <ResultBlock title="Diagnostics" items={suggestions.diagnostics} />
                <ResultBlock title="Safety Notes" items={suggestions.safety_notes} />
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-slate-400">
                No AI suggestions yet. Use the voice button or submit an issue description.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
