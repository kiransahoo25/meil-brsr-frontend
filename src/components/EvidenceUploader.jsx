import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileIcon(contentType, filename) {
  if (contentType?.includes('pdf') || filename?.endsWith('.pdf')) return '📄'
  if (contentType?.includes('image')) return '🖼️'
  if (contentType?.includes('sheet') || filename?.match(/\.(xlsx?|csv)$/)) return '📊'
  if (contentType?.includes('word') || filename?.endsWith('.docx')) return '📝'
  return '📎'
}

export default function EvidenceUploader({ fieldId, entitySlug, fieldCode }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const fileRef = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get(`/evidence/field/${fieldId}`)
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fieldId) load()
  }, [fieldId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('field_id', fieldId)
      formData.append('entity_slug', entitySlug)
      formData.append('note', note)
      formData.append('file', file)

      await api.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setNote('')
      setShowUpload(false)
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(id, filename) {
    try {
      const token = sessionStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const res = await fetch(`${apiBase}/evidence/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      alert('Download failed: ' + err.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this evidence file? This cannot be undone.')) return
    try {
      await api.delete(`/evidence/${id}`)
      await load()
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  function canDelete(item) {
    return (
      item.uploaded_by_code === user.code ||
      ['unit-admin', 'esg-officer', 'group-admin'].includes(user.role)
    )
  }

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-slate-800">📎 Evidence</span>
          <span className="text-[10.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {items.length} file{items.length === 1 ? '' : 's'}
          </span>
        </div>
        {!showUpload && (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="text-[11.5px] font-semibold px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
          >
            + Add File
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-[11.5px] mb-2">
          ⚠️ {error}
        </div>
      )}

      {showUpload && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
          <div className="text-[11.5px] font-bold text-blue-900 mb-2">
            Upload evidence for {fieldCode}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g., 'March meter reading')"
            className="w-full px-3 py-2 mb-2 border border-blue-200 rounded-lg bg-white text-[12.5px] focus:outline-none focus:border-blue-500"
          />

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.docx,.doc"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-[12px] text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold file:text-[12px] hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
          />

          <div className="flex items-center justify-between mt-2">
            <div className="text-[10.5px] text-slate-500">
              Max 5 MB · PDF, image, spreadsheet, or document
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUpload(false)
                setNote('')
                setError('')
              }}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          {uploading && (
            <div className="mt-2 flex items-center gap-2 text-[11.5px] text-blue-800">
              <span className="w-3 h-3 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
              Uploading…
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-[11.5px] text-slate-400 italic py-2">Loading files…</div>
      )}

      {!loading && items.length === 0 && !showUpload && (
        <div className="text-[11.5px] text-slate-400 italic py-2">
          No evidence attached yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 grid place-items-center text-lg flex-shrink-0">
                {fileIcon(item.content_type, item.original_filename)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12.5px] font-semibold text-slate-800 truncate">
                    {item.original_filename}
                  </span>
                  {item.version > 1 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      v{item.version}
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                  {formatBytes(item.size_bytes)} · Uploaded by{' '}
                  <b className="text-slate-700">{item.uploaded_by_name}</b>{' '}
                  ({item.uploaded_by_code}) on {formatDate(item.uploaded_at)}
                </div>
                {item.note && (
                  <div className="text-[10.5px] text-slate-500 italic mt-0.5 truncate">
                    "{item.note}"
                  </div>
                )}
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(item.id, item.stored_filename)}
                  className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  title="Download"
                >
                  ⬇
                </button>
                {canDelete(item) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                    title="Delete"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}