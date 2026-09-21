import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Send, Paperclip, Image as ImageIcon, FileText, Phone, Mail,
  Building2, Users, Wallet, ShieldAlert, Sparkles, X, CheckCheck
} from 'lucide-react'
import { useData } from '../../store/DataContext'

const CHANNELS = [
  { key: 'all', label: 'Team General', icon: Users, desc: 'Announcements & general team chat' },
  { key: 'client', label: 'Client Support', icon: Building2, desc: 'Client inquiries & project coordination' },
  { key: 'finance', label: 'Finance & Accounts', icon: Wallet, desc: 'Budgets, payments & invoice discussions' },
  { key: 'operator', label: 'Operations & Logistics', icon: ShieldAlert, desc: 'Venue setups & technical logistics' },
]

export default function ClientMessages() {
  const { state, sendMessage, rbac } = useData()
  const [activeChannel, setActiveChannel] = useState('all')
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const fileRef = useRef(null)

  const isClient = rbac?.roleKey === 'client'
  const currentUserId = state.currentUserId
  const currentUser = state.currentUser
  const currentStaff = state.staff.find((s) => s.id === currentUserId)
  const currentClient = state.clients.find((c) => c.id === currentUserId)

  const senderName = isClient
    ? currentClient?.company || currentClient?.contactPerson || 'Client'
    : currentUser?.name || currentStaff?.name || 'Staff'

  const senderRole = isClient ? 'client' : rbac?.roleKey || 'admin'

  // Filter messages based on active channel or client context
  const filteredMessages = useMemo(() => {
    const all = state.messages || []
    if (isClient) {
      // Clients see messages to/from 'client' or directed to them
      return all.filter((m) =>
        m.recipientRole === 'client' ||
        m.senderRole === 'client' ||
        m.recipientId === currentUserId ||
        m.senderId === currentUserId
      )
    }

    // Staff view by channel
    if (activeChannel === 'all') {
      return all.filter((m) => m.recipientRole === 'all' || !m.recipientRole)
    }
    return all.filter((m) => m.recipientRole === activeChannel || m.senderRole === activeChannel)
  }, [state.messages, isClient, activeChannel, currentUserId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [filteredMessages.length])

  const handleSend = async () => {
    const text = input.trim()
    if (!text && !attachment) return

    setSending(true)
    const targetRecipientRole = isClient ? 'pm' : activeChannel

    try {
      await sendMessage({
        senderId: currentUserId || null,
        senderName,
        senderRole,
        recipientRole: targetRecipientRole,
        text: text || (attachment ? `📎 Attached: ${attachment.name}` : ''),
        attachmentUrl: attachment?.data || '',
        attachmentName: attachment?.name || '',
      })
      setInput('')
      setAttachment(null)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
    setSending(false)
  }

  const onFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB',
        type: file.type,
        data: reader.result,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Find assigned PM for client view
  const myEvents = state.events.filter((e) => e.clientId === currentUserId)
  const pm = state.staff.find((s) => s.id === myEvents[0]?.pmId) || state.staff.find((s) => s.role === 'Project Manager') || state.staff[0]

  const roleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'finance': return 'bg-emerald-100 text-emerald-700'
      case 'operator': return 'bg-sky-100 text-sky-700'
      case 'pm': return 'bg-gold-100 text-gold-700'
      case 'client': return 'bg-brand-100 text-brand-800'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-950">Realtime Messages</h1>
          <p className="text-xs sm:text-sm text-ink/50">
            {isClient ? 'Live conversation with your Amen Events team' : 'Cross-role team collaboration & client messaging'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Supabase Realtime
          </span>
        </div>
      </div>

      {/* Staff Channel Tabs */}
      {!isClient && (
        <div className="flex flex-wrap gap-2 border-b border-brand-100 pb-2">
          {CHANNELS.map((c) => {
            const Icon = c.icon
            const active = activeChannel === c.key
            return (
              <button
                key={c.key}
                onClick={() => setActiveChannel(c.key)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-white text-ink/60 hover:bg-brand-50 hover:text-brand-900 border border-brand-100'
                }`}
              >
                <Icon size={14} />
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left sidebar: PM info or Channel info */}
        <div className="lg:col-span-1 space-y-4">
          {isClient ? (
            <div className="card p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink/40">Project Manager</p>
              {pm ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${pm.color || 'bg-brand-600'} text-sm font-bold text-white shadow-sm`}>
                      {pm.initials || 'PM'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-950 truncate">{pm.name}</p>
                      <p className="text-xs text-ink/50">{pm.role}</p>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Now
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-brand-50 pt-3 text-xs text-ink/60">
                    <div className="flex items-center gap-2 truncate"><Phone size={13} className="text-brand-600 shrink-0" /> {pm.phone || '+251 911 000 000'}</div>
                    <div className="flex items-center gap-2 truncate"><Mail size={13} className="text-brand-600 shrink-0" /> {pm.email || 'pm@amen.et'}</div>
                    <div className="flex items-center gap-2 truncate"><Building2 size={13} className="text-brand-600 shrink-0" /> {pm.dept || 'Event Operations'}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink/40">Dedicated PM assigned upon event booking.</p>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">Current Channel</p>
              <p className="text-sm font-bold text-brand-950">
                {CHANNELS.find((c) => c.key === activeChannel)?.label}
              </p>
              <p className="mt-1 text-xs text-ink/55 leading-relaxed">
                {CHANNELS.find((c) => c.key === activeChannel)?.desc}
              </p>
              <div className="mt-4 border-t border-brand-50 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink/45">Your Role:</span>
                  <span className={`chip ${roleColor(senderRole)} font-bold text-[10px]`}>{senderRole.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink/45">Active User:</span>
                  <span className="font-semibold text-brand-950 truncate max-w-[130px]">{senderName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Realtime Chat Container */}
        <div className="lg:col-span-3 card flex flex-col h-[520px] sm:h-[600px] overflow-hidden shadow-card">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/50 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700 text-white font-bold text-xs">
                {isClient ? (pm?.initials || 'PM') : activeChannel[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-brand-950">
                  {isClient ? `${pm?.name || 'Project Manager'} (Amen Team)` : CHANNELS.find((c) => c.key === activeChannel)?.label}
                </p>
                <p className="text-[10px] text-ink/45">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} in this thread
                </p>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-brand-50/20">
            {filteredMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-ink/40">
                <Sparkles size={32} className="text-brand-300 mb-2" />
                <p className="text-sm font-bold text-brand-950">No messages in this channel yet</p>
                <p className="text-xs text-ink/50 mt-1 max-w-sm">
                  Start the conversation! Messages persist to Supabase and stream in real time to all connected devices.
                </p>
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isMe = m.senderId === currentUserId || m.senderName === senderName
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink/45 px-1">
                        <span className="font-semibold text-brand-950">{m.senderName}</span>
                        {m.senderRole && (
                          <span className={`chip ${roleColor(m.senderRole)} text-[9px] !py-0 !px-1.5`}>
                            {m.senderRole}
                          </span>
                        )}
                        <span>· {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                      </div>

                      <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                        isMe
                          ? 'bg-brand-700 text-white rounded-br-none'
                          : 'bg-white text-brand-950 border border-brand-100 rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>

                        {/* Attachment preview */}
                        {m.attachmentUrl && (
                          <div className={`mt-2 rounded-xl p-2 text-xs border ${
                            isMe ? 'bg-white/10 border-white/20 text-white' : 'bg-brand-50 border-brand-100 text-brand-950'
                          }`}>
                            {m.attachmentUrl.startsWith('data:image/') ? (
                              <img src={m.attachmentUrl} alt="attachment" className="max-h-48 rounded-lg object-cover mb-1" />
                            ) : null}
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={m.attachmentName || 'attachment'}
                              className="inline-flex items-center gap-1.5 font-bold hover:underline"
                            >
                              <Paperclip size={13} /> {m.attachmentName || 'Download File'}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Pending Attachment Preview */}
          {attachment && (
            <div className="flex items-center justify-between bg-brand-50 border-t border-brand-100 px-4 py-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Paperclip size={14} className="text-brand-700 shrink-0" />
                <span className="font-semibold text-brand-950 truncate">{attachment.name}</span>
                <span className="text-ink/40">({attachment.size})</span>
              </div>
              <button onClick={() => setAttachment(null)} className="rounded-full p-1 hover:bg-red-50 text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="border-t border-brand-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={onFileSelect} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-200 text-ink/60 hover:bg-brand-50 transition"
                title="Attach document or image"
              >
                <Paperclip size={17} />
              </button>
              <input
                className="input flex-1 !h-10 text-sm"
                placeholder={isClient ? 'Type a message to your Project Manager…' : `Message #${activeChannel}…`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={sending}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!input.trim() && !attachment)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-50 transition shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
