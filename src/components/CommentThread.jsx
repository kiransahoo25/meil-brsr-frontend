import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const ROLE_SHORT = {
  'data-entry': 'Data Entry',
  approver: 'Approver',
  'unit-admin': 'Unit Admin',
  'esg-officer': 'ESG Officer',
  'group-admin': 'Group Admin',
}

export default function CommentThread({ submissionId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    try {
      const { data } = await api.get(`/approvals/${submissionId}/comments`)
      setComments(data)
    } catch (err) {
      // silent
    }
  }

  useEffect(() => {
    if (submissionId) load()
  }, [submissionId])

  async function send() {
    if (!body.trim()) return
    setSending(true)
    try {
      await api.post(`/approvals/${submissionId}/comment`, null, {
        params: { body: body.trim() },
      })
      setBody('')
      await load()
    } catch (err) {
      alert('Failed to post comment: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const myRoleColor =
    user.role === 'esg-officer'
      ? 'bg-green-100 text-green-700'
      : user.role === 'group-admin'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700'

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-[13px] font-bold text-slate-800">Comments</h4>
        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
          {comments.length}
        </span>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-4 text-[12px] text-slate-400 italic">
          No comments yet. Add the first one below.
        </div>
      ) : (
        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[12px] font-bold text-slate-800">
                  {c.author_name}
                </span>
                <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                  {c.author_code}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${myRoleColor}`}
                >
                  {ROLE_SHORT[c.author_role] || c.author_role}
                </span>
                <span className="text-[10.5px] text-slate-400 ml-auto">
                  {formatTime(c.created_at)}
                </span>
              </div>
              <div className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {c.body}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 pt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment to flag issues, request clarification, or note observations…"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[12.8px] min-h-[70px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10.5px] text-slate-400">⌘ + Enter to send</span>
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-[12px] hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}