import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Plus, Send, MessageSquare, Bot, User } from 'lucide-react';

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/chat/sessions');
      setSessions(data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const loadMessages = async (sessionId) => {
    try {
      setActiveSession(sessionId);
      const { data } = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(data.data);
    } catch (err) { console.error(err); }
  };

  const createSession = async () => {
    try {
      const { data } = await api.post('/chat/sessions', { title: 'New Chat' });
      setSessions(prev => [data.data, ...prev]);
      setActiveSession(data.data.id);
      setMessages(data.data.messages || []);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || sending) return;
    const content = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat/messages', { sessionId: activeSession, content });
      setMessages(prev => [...prev, data.data]);
      fetchSessions();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* Sidebar */}
      <div className="w-64 shrink-0 rounded-2xl border flex flex-col" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="p-3">
          <button onClick={createSession} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {sessions.map(s => (
            <button key={s.id} onClick={() => loadMessages(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${activeSession === s.id ? 'text-amber-400' : 'text-navy-300 hover:text-white hover:bg-white/[0.03]'}`}
              style={activeSession === s.id ? { background: 'rgba(245,158,11,0.1)' } : {}}>
              <MessageSquare size={14} className="shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
          {sessions.length === 0 && <p className="text-navy-500 text-xs text-center py-6">No conversations yet</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-2xl border flex flex-col" style={{ background: 'rgba(16,42,67,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Bot size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white">FactoryBot AI</h2>
            <p className="text-navy-400 text-sm mt-2 max-w-md">Your intelligent factory assistant. Ask about production status, inventory levels, machine health, employee data, and more.</p>
            <button onClick={createSession} className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Plus size={16} /> Start New Chat
            </button>
            <div className="mt-8 grid grid-cols-2 gap-2 max-w-sm w-full">
              {['Show production status', 'Check inventory levels', 'Machine utilization?', 'How many employees?'].map(q => (
                <button key={q} onClick={async () => { if (!activeSession) await createSession(); setInput(q); }}
                  className="px-3 py-2 rounded-xl text-xs text-navy-300 text-left transition-all hover:text-white hover:bg-white/[0.03]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <Bot size={16} className="text-amber-400" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-navy-200'}`}
                    style={{ background: m.role === 'user' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(10,25,41,0.6)', borderBottomRightRadius: m.role === 'user' ? '4px' : undefined, borderBottomLeftRadius: m.role === 'assistant' ? '4px' : undefined }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(96,165,250,0.15)' }}>
                      <User size={16} className="text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}><Bot size={16} className="text-amber-400" /></div>
                  <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: 'rgba(10,25,41,0.6)' }}>
                    <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" /><div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.15s' }} /><div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.3s' }} /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask FactoryBot anything..."
                  className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/30" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                  disabled={sending} autoFocus />
                <button type="submit" disabled={sending || !input.trim()}
                  className="px-4 py-3 rounded-xl text-white transition-all disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
