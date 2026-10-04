import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function renderMarkdown(text) {
  // Tiny markdown support: **bold**, line breaks, • bullets
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const withBold = escaped.replace(
    /\*\*(.+?)\*\*/g,
    '<strong>$1</strong>',
  )
  const withBreaks = withBold.replace(/\n/g, '<br/>')
  return { __html: withBreaks }
}

export default function ChatBot() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [unread, setUnread] = useState(0)
  const scrollRef = useRef(null)

  // Load initial greeting once
  useEffect(() => {
    if (!user) return
    api
      .get('/chatbot/greet')
      .then(({ data }) => {
        setMessages([{ role: 'bot', text: data.greeting }])
        setSuggestions(data.suggestions || [])
        setUnread(1)
      })
      .catch(() => {
        setMessages([
          { role: 'bot', text: "Hi! I'm your BRSR assistant. How can I help?" },
        ])
      })
  }, [user])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  // Clear unread when chat opens
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  async function send(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setSending(true)

    try {
      const { data } = await api.post('/chatbot/message', { message: trimmed })
      // Small delay to feel natural
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'bot', text: data.reply }])
        setSending(false)
        if (!open) setUnread((n) => n + 1)
      }, 350)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: "Sorry, I couldn't reach the server. Please try again.",
        },
      ])
      setSending(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!user) return null

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          open
            ? 'bg-slate-800 hover:bg-slate-900'
            : 'bg-gradient-to-br from-green-500 to-sky-500 hover:scale-105'
        }`}
        aria-label="Open chat"
      >
        {open ? (
          <span className="text-white text-2xl leading-none">×</span>
        ) : (
          <span className="text-white text-2xl leading-none">💬</span>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold grid place-items-center border-2 border-white">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 bg-white shadow-2xl flex flex-col
            inset-0 sm:inset-auto sm:bottom-24 sm:right-5
            sm:w-[380px] sm:h-[560px]
            sm:rounded-2xl overflow-hidden
            border border-slate-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b1f33] to-[#14304f] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-sky-500 grid place-items-center text-lg">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold leading-tight">
                BRSR Assistant
              </div>
              <div className="text-[10.5px] text-green-300 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Online
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Message area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex mb-3 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-sky-500 grid place-items-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                  }`}
                >
                  <span
                    dangerouslySetInnerHTML={renderMarkdown(m.text)}
                  />
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-sky-500 grid place-items-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length <= 1 && (
            <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 flex-shrink-0">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="text-[11.5px] px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-green-50 hover:text-green-700 border border-slate-200 hover:border-green-200 text-slate-600 font-medium transition disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-slate-200 flex gap-2 items-end flex-shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              rows={1}
              className="flex-1 resize-none px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[13px] max-h-24"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white grid place-items-center hover:shadow-lg transition disabled:opacity-40 flex-shrink-0"
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}