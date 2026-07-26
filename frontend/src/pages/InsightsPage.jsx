import { useAppState } from '../context/AppStateContext'
import { ResultBlock } from '../components/ResultBlock'
import { TagChips } from '../components/TagChips'

function InsightsPage() {
  const { catalogResults, documentResults, suggestions } = useAppState()

  return (
    <div className="space-y-8 py-8">
      <section>
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Insights</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Review matches and suggestions</h1>
        <p className="mt-2 max-w-2xl text-slate-400">A recap of the latest search from the home page.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Knowledge results</h3>
          <p className="mt-2 text-sm text-slate-400">A combined view of the latest manual, tribal knowledge, and catalog matches.</p>
          <div className="mt-5 space-y-4">
            {catalogResults.length === 0 && documentResults.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-slate-400">
                No matches yet. Search from the home page to populate this panel.
              </div>
            ) : (
              <>
                {catalogResults.slice(0, 2).map((item, index) => (
                  <div key={`insight-catalog-${index}`} className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.kind}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{item.label}</p>
                    <TagChips tags={item.tags} />
                  </div>
                ))}
                {documentResults.slice(0, 2).map((match, index) => (
                  <div key={`insight-document-${index}`} className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-5">
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
        </div>

        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">AI guidance summary</h3>
          <p className="mt-2 text-sm text-slate-400">A compact summary of the latest troubleshooting guidance.</p>
          <div className="mt-5 space-y-5">
            {suggestions ? (
              <>
                <ResultBlock title="Causes" items={suggestions.causes} />
                <ResultBlock title="Temporary Fixes" items={suggestions.temporary_fixes} />
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-slate-400">
                No AI suggestions yet. Open the home page to generate guidance.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsightsPage
