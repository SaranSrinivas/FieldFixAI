import { useAppState } from '../context/AppStateContext'
import { ResultBlock } from '../components/ResultBlock'
import { TagChips } from '../components/TagChips'
import { DocumentIcon, NoteIcon } from '../components/icons'
import { DEFAULT_KIND_META, KIND_META, SUGGESTION_THEME } from '../theme'

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
                {catalogResults.slice(0, 2).map((item, index) => {
                  const meta = KIND_META[item.kind] ?? DEFAULT_KIND_META
                  const KindIcon = meta.icon
                  return (
                    <div key={`insight-catalog-${index}`} className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${meta.badge}`}>
                        <KindIcon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                      <p className="mt-2 text-lg font-semibold text-white">{item.label}</p>
                      <TagChips tags={item.tags} />
                    </div>
                  )
                })}
                {documentResults.slice(0, 2).map((match, index) => {
                  const isTribal = match.source_type === 'tribal_knowledge'
                  const SourceIcon = isTribal ? NoteIcon : DocumentIcon
                  return (
                    <div
                      key={`insight-document-${index}`}
                      className={`rounded-3xl border bg-gradient-to-br from-slate-950 to-slate-900 p-5 ${isTribal ? 'border-emerald-800/50' : 'border-sky-800/50'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isTribal ? 'bg-emerald-500/15 text-emerald-300' : 'bg-sky-500/15 text-sky-300'}`}>
                          <SourceIcon className="h-4 w-4" />
                        </span>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                          {isTribal
                            ? `Tribal knowledge${match.title ? ` · ${match.title}` : ''}`
                            : `${match.filename ?? 'Manual'} · Page ${match.page}`}
                        </p>
                      </div>
                      <p className="mt-3 text-slate-100">{match.snippet}</p>
                    </div>
                  )
                })}
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
                <ResultBlock title="Causes" items={suggestions.causes} icon={SUGGESTION_THEME.causes.icon} accent={SUGGESTION_THEME.causes} />
                <ResultBlock
                  title="Temporary Fixes"
                  items={suggestions.temporary_fixes}
                  icon={SUGGESTION_THEME.temporary_fixes.icon}
                  accent={SUGGESTION_THEME.temporary_fixes}
                />
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
