export function ResultBlock({ title, items }) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-950/90 to-slate-900/90 p-5">
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      <ul className="mt-4 space-y-3">
        {(items ?? []).map((item, index) => (
          <li key={index} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
