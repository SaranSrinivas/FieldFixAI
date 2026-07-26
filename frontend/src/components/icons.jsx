export function IconShell({ children, className = '' }) {
  return <span className={`inline-flex items-center justify-center rounded-2xl bg-slate-800/80 text-slate-100 ${className}`}>{children}</span>
}

export function DocumentIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75A1.75 1.75 0 0 1 8.75 2h4.5l4.5 4.5v12.75A1.75 1.75 0 0 1 16 21H8.75A1.75 1.75 0 0 1 7 19.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 2v4.5h4.5" />
    </svg>
  )
}

export function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="5.5" />
      <path strokeLinecap="round" d="m15.5 15.5 4 4" />
    </svg>
  )
}

export function SparklesIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m18 14 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
    </svg>
  )
}

export function MicIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path strokeLinecap="round" d="M6 11a6 6 0 0 0 12 0" />
      <path strokeLinecap="round" d="M12 17v4" />
      <path strokeLinecap="round" d="M9 21h6" />
    </svg>
  )
}

export function PulseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  )
}

export function CompassIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="m14.5 9.5-2 4.5-4.5 2 2-4.5 4.5-2Z" />
    </svg>
  )
}
