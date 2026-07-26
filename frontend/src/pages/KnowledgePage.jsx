import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { useAppState } from '../context/AppStateContext'
import { DocumentIcon } from '../components/icons'

function KnowledgePage() {
  const { setStatus } = useAppState()

  const [manualFile, setManualFile] = useState(null)
  const [manualFileName, setManualFileName] = useState('')
  const [isUploadingManual, setIsUploadingManual] = useState(false)

  const [tribalFile, setTribalFile] = useState(null)
  const [tribalFileName, setTribalFileName] = useState('')
  const [isUploadingTribalFile, setIsUploadingTribalFile] = useState(false)

  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  const [documents, setDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const response = await fetch(`${API_BASE}/documents`)
      if (!response.ok) throw new Error('Failed to load documents')
      const result = await response.json()
      setDocuments(Array.isArray(result) ? result : [])
    } catch {
      setDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleUploadManual = async () => {
    if (!manualFile) {
      setStatus('Select a PDF before uploading.')
      return
    }

    setIsUploadingManual(true)
    setStatus('Uploading manual...')

    try {
      const form = new FormData()
      form.append('file', manualFile)
      form.append('source_type', 'manual')

      const response = await fetch(`${API_BASE}/upload_document`, { method: 'POST', body: form })
      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      setStatus(`Uploaded ${result.filename} (${result.chunks_indexed} sections indexed).`)
      setManualFile(null)
      setManualFileName('')
      loadDocuments()
    } catch {
      setStatus('Manual upload failed. Please try another PDF.')
    } finally {
      setIsUploadingManual(false)
    }
  }

  const handleUploadTribalFile = async () => {
    if (!tribalFile) {
      setStatus('Select a file before uploading.')
      return
    }

    setIsUploadingTribalFile(true)
    setStatus('Uploading tribal knowledge document...')

    try {
      const form = new FormData()
      form.append('file', tribalFile)
      form.append('source_type', 'tribal_knowledge')

      const response = await fetch(`${API_BASE}/upload_document`, { method: 'POST', body: form })
      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      setStatus(`Uploaded ${result.filename} (${result.chunks_indexed} sections indexed).`)
      setTribalFile(null)
      setTribalFileName('')
      loadDocuments()
    } catch {
      setStatus('Tribal knowledge upload failed. Please try another file.')
    } finally {
      setIsUploadingTribalFile(false)
    }
  }

  const handleSubmitNote = async () => {
    if (!noteBody.trim()) {
      setStatus('Enter the knowledge you want to capture before saving.')
      return
    }

    setIsSubmittingNote(true)
    setStatus('Saving tribal knowledge note...')

    try {
      const response = await fetch(`${API_BASE}/tribal_notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noteTitle.trim() || 'Untitled note', body: noteBody }),
      })
      if (!response.ok) throw new Error('Failed to save note')

      const result = await response.json()
      setStatus(`Saved note (${result.chunks_indexed} sections indexed).`)
      setNoteTitle('')
      setNoteBody('')
      loadDocuments()
    } catch {
      setStatus('Saving the note failed. Please try again.')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  return (
    <div className="space-y-8 py-8">
      <section>
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Knowledge base</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Import manuals & tribal knowledge</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Everything uploaded or noted here is chunked, embedded, and immediately searchable from the
          AI search on the home page.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Upload a manual</h3>
          <p className="mt-2 text-sm text-slate-400">PDF technical manuals get chunked and indexed for search.</p>
          <label className="mt-4 block">
            <span className="text-slate-300">PDF Manual</span>
            <input
              type="file"
              accept="application/pdf"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setManualFile(file)
                setManualFileName(file?.name ?? '')
              }}
            />
            {manualFileName ? (
              <p className="mt-2 text-sm text-slate-400">Selected file: {manualFileName}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Select a PDF to index it.</p>
            )}
          </label>
          <button
            type="button"
            onClick={handleUploadManual}
            disabled={!manualFile || isUploadingManual}
            className="btn-secondary mt-4 inline-flex items-center rounded-3xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DocumentIcon className="mr-2 h-4 w-4" />
            {isUploadingManual ? 'Uploading…' : 'Upload Manual'}
          </button>
        </div>

        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Upload a tribal knowledge document</h3>
          <p className="mt-2 text-sm text-slate-400">PDF or plain text files with know-how that isn't in any manual.</p>
          <label className="mt-4 block">
            <span className="text-slate-300">Document</span>
            <input
              type="file"
              accept="application/pdf,.txt,text/plain"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setTribalFile(file)
                setTribalFileName(file?.name ?? '')
              }}
            />
            {tribalFileName ? (
              <p className="mt-2 text-sm text-slate-400">Selected file: {tribalFileName}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Select a PDF or text file to index it.</p>
            )}
          </label>
          <button
            type="button"
            onClick={handleUploadTribalFile}
            disabled={!tribalFile || isUploadingTribalFile}
            className="btn-secondary mt-4 inline-flex items-center rounded-3xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DocumentIcon className="mr-2 h-4 w-4" />
            {isUploadingTribalFile ? 'Uploading…' : 'Upload Document'}
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
        <h3 className="text-lg font-semibold text-white">Add a quick tribal knowledge note</h3>
        <p className="mt-2 text-sm text-slate-400">
          Capture things technicians know that aren't written down anywhere, e.g. "if X happens, check Y first".
        </p>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-slate-300">Title</span>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Short title for this note"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 outline-none transition focus:border-sky-500"
            />
          </label>
          <label className="block">
            <span className="text-slate-300">Knowledge</span>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={5}
              placeholder="Describe the know-how, workaround, or field observation"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 outline-none transition focus:border-sky-500"
            />
          </label>
          <button
            type="button"
            onClick={handleSubmitNote}
            disabled={!noteBody.trim() || isSubmittingNote}
            className="btn-primary inline-flex items-center rounded-3xl bg-sky-600 px-6 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmittingNote ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Ingested documents</h3>
          <span className="rounded-3xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
            {isLoadingDocuments ? 'Loading…' : `${documents.length} total`}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {documents.length === 0 && !isLoadingDocuments ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-slate-400">
              Nothing ingested yet.
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-100">{doc.title || doc.filename}</p>
                  <p className="text-xs text-slate-500">{doc.filename}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">
                  {doc.source_type === 'tribal_knowledge' ? 'Tribal knowledge' : 'Manual'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default KnowledgePage
