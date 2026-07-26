import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../api'

export function SymptomTypeahead({
  value,
  onChange,
  onSelect,
  placeholder,
  multiline = false,
  rows,
  className,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const requestIdRef = useRef(0)
  const abortControllerRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const blurTimerRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceTimerRef.current)

    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      fetch(`${API_BASE}/symptom_suggestions?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : []))
        .then((result) => {
          if (requestId !== requestIdRef.current) return
          setSuggestions(Array.isArray(result) ? result : [])
          setIsOpen(true)
        })
        .catch((error) => {
          if (error.name === 'AbortError') return
          if (requestId !== requestIdRef.current) return
          setSuggestions([])
        })
    }, 250)

    return () => clearTimeout(debounceTimerRef.current)
  }, [value])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      clearTimeout(blurTimerRef.current)
    }
  }, [])

  const handleSelect = (suggestion) => {
    clearTimeout(blurTimerRef.current)
    setIsOpen(false)
    onChange(suggestion)
    onSelect?.(suggestion)
  }

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const InputTag = multiline ? 'textarea' : 'input'
  const showDropdown = isOpen && suggestions.length > 0

  return (
    <div className="relative">
      <InputTag
        type={multiline ? undefined : 'text'}
        rows={multiline ? rows ?? 6 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {showDropdown ? (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(suggestion)}
                className="block w-full px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-800/80 hover:text-sky-300"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
