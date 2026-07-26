import { createContext, useContext, useState } from 'react'

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [status, setStatus] = useState('Ready')
  const [isReady, setIsReady] = useState(false)
  const [catalogResults, setCatalogResults] = useState([])
  const [documentResults, setDocumentResults] = useState([])
  const [suggestions, setSuggestions] = useState(null)

  const value = {
    status,
    setStatus,
    isReady,
    setIsReady,
    catalogResults,
    setCatalogResults,
    documentResults,
    setDocumentResults,
    suggestions,
    setSuggestions,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
