import { AlertIcon, CompassIcon, GearIcon, MicIcon, NoteIcon, ScanIcon } from '../components/icons'

const BENEFITS = [
  {
    icon: ScanIcon,
    title: 'Faster diagnosis, less downtime',
    body: 'Search plain-language symptoms instead of paging through PDF manuals, and get manual excerpts, catalog matches, and AI-structured guidance in one pass.',
  },
  {
    icon: NoteIcon,
    title: 'Knowledge retention',
    body: 'Tribal-knowledge capture lets experienced technicians record fixes and workarounds that normally live only in their heads, so it outlives any single employee.',
  },
  {
    icon: CompassIcon,
    title: 'Visual confirmation',
    body: 'Search results surface the actual machine and component renders alongside text matches, reducing misidentification on complex equipment.',
  },
  {
    icon: AlertIcon,
    title: 'Structured, safety-first guidance',
    body: 'AI suggestions are organized into Causes, Temporary Fixes, Diagnostics, and Safety Notes, keeping safety information visually distinct and never buried.',
  },
  {
    icon: MicIcon,
    title: 'Hands-free operation',
    body: 'Voice input lets technicians dictate an issue description without touching a keyboard — useful when hands are dirty, gloved, or occupied.',
  },
  {
    icon: GearIcon,
    title: 'Low operating cost',
    body: 'The system runs comfortably on a 512MB-RAM hosting tier by design, keeping this cheap to run at small and medium scale.',
  },
]

function AboutPage() {
  return (
    <div className="space-y-8 py-8">
      <section>
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">About</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">FieldFix AI — Application Brief</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          A field-service intelligence tool that helps equipment technicians diagnose and repair machinery faster
          by unifying OEM manuals, an equipment catalog, and tribal knowledge into one search experience.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <img
            src="/AuthorPhoto.jpg"
            alt="Saran Srinivas"
            className="h-24 w-24 shrink-0 rounded-full border border-slate-700 object-cover shadow-lg"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-400">Author</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Saran Srinivas</h2>
            <p className="mt-1 text-slate-400">Creator of FieldFix AI</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white">Key benefits</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel-sheen rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <span className="icon-bubble flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-sky-300">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
        <h3 className="text-lg font-semibold text-white">How AI is used</h3>
        <div className="mt-4 space-y-4 text-slate-300">
          <p>
            <span className="font-semibold text-slate-100">Semantic-ish search &amp; ranking.</span> Rather than a
            heavyweight neural embedding model, search and AI-suggestion ranking run on TF-IDF vectorization and
            cosine similarity (scikit-learn), with FAISS available for larger document sets. The app originally used
            a <code className="rounded bg-slate-900 px-1.5 py-0.5 text-sm text-sky-300">sentence-transformers</code>{' '}
            neural model, but that pulled in PyTorch and pushed memory usage past what budget hosting tiers allow.
            Swapping to TF-IDF cut the dependency footprint dramatically with no loss of test coverage, at the cost
            of matching being keyword-driven rather than deeply semantic — a reasonable trade for short
            troubleshooting text.
          </p>
          <p>
            <span className="font-semibold text-slate-100">AI troubleshooting suggestions.</span> Candidate
            sentences from manuals and tribal notes are ranked by similarity to the reported issue, then sorted into
            Causes/Fixes/Diagnostics/Safety buckets via keyword heuristics, with results cached per issue description
            to avoid recomputation.
          </p>
          <p>
            <span className="font-semibold text-slate-100">Voice input.</span> Browser-native speech-to-text feeds
            directly into the same AI suggestion pipeline as typed input.
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-sky-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <h3 className="text-lg font-semibold text-white">Bottom line</h3>
        <p className="mt-2 text-slate-300">
          FieldFix AI trades "state-of-the-art ML" for "fast, cheap, and good enough" — it's built to get a
          technician a usable answer in seconds, on infrastructure that costs very little to run, while giving the
          team a durable place to store the knowledge that normally disappears when someone leaves.
        </p>
      </section>
    </div>
  )
}

export default AboutPage
