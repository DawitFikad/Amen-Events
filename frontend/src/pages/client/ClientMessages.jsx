import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Image as ImageIcon, FileText, Phone, Mail, Building2 } from 'lucide-react'
import { useData } from '../../store/DataContext'

const MOCK_MESSAGES = [
  { id: 'm1', from: 'pm', text: 'Hi! I wanted to update you on the EthFinTech Summit progress. Everything is on track for August 18th.', time: '2 days ago' },
  { id: 'm2', from: 'client', text: 'That\'s great to hear! How is the venue setup coming along?', time: '2 days ago' },
  { id: 'm3', from: 'pm', text: 'Millennium Hall is confirmed. We\'ve booked 4 halls and the catering tasting is scheduled for next week.', time: '1 day ago' },
  { id: 'm4', from: 'client', text: 'Perfect. Can you share the floor plan when it\'s ready?', time: '1 day ago' },
  { id: 'm5', from: 'pm', text: 'Absolutely! I\'ll upload it to the documents section by end of this week.', time: '12 hr ago' },
]

export default function ClientMessages() {
  const { state } = useData()
  const clientId = state.currentUserId
  const client = state.clients.find((c) => c.id === clientId)
  const myEvents = state.events.filter((e) => e.clientId === clientId)
  const pm = state.staff.find((s) => s.id === myEvents[0]?.pmId)

  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const endRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    setMessages([...messages, { id: 'm' + Date.now(), from: 'client', text: input, time: 'Just now' }])
    setInput('')
  }

  const attach = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setMessages([...messages, { id: 'm' + Date.now(), from: 'client', text: `📎 Attached: ${f.name}`, time: 'Just now' }])
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-brand-950">Messages</h1>
        <p className="text-sm text-ink/50">Chat with your assigned Project Manager</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* PM info */}
        <div className="card p-5">
          <p className="mb-4 font-bold text-brand-950">Project Manager</p>
          {pm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${pm.color} text-base font-bold text-white`}>{pm.initials}</div>
                <div>
                  <p className="font-bold text-brand-950">{pm.name}</p>
                  <p className="text-xs text-ink/50">{pm.role}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand-600">
                    <span className="h-2 w-2 rounded-full bg-brand-500" /> Online
                  </span>
                </div>
              </div>
              <div className="space-y-2 border-t border-brand-50 pt-3">
                <div className="flex items-center gap-2 text-sm text-ink/60"><Phone size={14} className="text-brand-600" /> {pm.phone}</div>
                <div className="flex items-center gap-2 text-sm text-ink/60"><Mail size={14} className="text-brand-600" /> {pm.email}</div>
                <div className="flex items-center gap-2 text-sm text-ink/60"><Building2 size={14} className="text-brand-600" /> {pm.dept}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink/40">No PM assigned yet.</p>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 card flex flex-col" style={{ height: '500px' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-brand-50 p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${pm?.color || 'bg-brand-600'} text-xs font-bold text-white`}>
              {pm?.initials || 'PM'}
            </div>
            <div>
              <p className="text-sm font-bold text-brand-950">{pm?.name || 'Project Manager'}</p>
              <p className="text-[11px] text-brand-600">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  m.from === 'client' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-950'
                }`}>
                  <p className="text-sm">{m.text}</p>
                  <p className={`mt-1 text-[10px] ${m.from === 'client' ? 'text-brand-200' : 'text-ink/40'}`}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-brand-50 p-3">
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={attach} />
              <button onClick={() => fileRef.current?.click()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-100 text-ink/50 hover:bg-brand-50">
                <Paperclip size={16} />
              </button>
              <input
                className="input flex-1"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button onClick={send} className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
