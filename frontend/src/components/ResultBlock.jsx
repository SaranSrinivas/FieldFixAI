export function ResultBlock({ title, items, icon: Icon, accent }) {
  const theme = accent ?? {
    ring: 'border-slate-800',
    iconBg: 'bg-slate-800 text-slate-300',
    itemBorder: 'border-slate-800',
  }

  return (
    <div className={`rounded-3xl border ${theme.ring} bg-gradient-to-br from-slate-950/90 to-slate-900/90 p-5`}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        ) : null}
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {(items ?? []).length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-500">
            Nothing flagged in this category.
          </li>
        ) : (
          items.map((item, index) => (
            <li
              key={index}
              className={`rounded-2xl border ${theme.itemBorder} bg-slate-900 p-4 text-slate-200`}
            >
              {item}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
