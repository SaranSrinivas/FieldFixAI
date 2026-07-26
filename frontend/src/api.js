// In dev, Vite runs on its own port and talks to the local backend on :8000.
// In the production build, the backend serves the built frontend from the
// same origin, so requests should be relative (no host/port baked in).
export const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')
