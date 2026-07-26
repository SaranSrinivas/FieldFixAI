export function TagChips({ tags, onSelect }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect?.(tag)}
          className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300 transition hover:border-sky-500 hover:text-sky-300"
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
