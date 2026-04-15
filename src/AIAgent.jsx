import { useState, useRef, useEffect } from 'react';
import { C, ACCENT, PRIMARY } from './shared';

function renderMessage(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} style={{ height: 8 }} />;
    if (/^# /.test(t)) return <div key={i} style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginTop: 18, marginBottom: 6 }}>{t.slice(2)}</div>;
    if (/^## /.test(t)) return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: '#1a3a5c', marginTop: 14, marginBottom: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 3 }}>{t.slice(3)}</div>;
    if (/^### /.test(t)) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: '#1e3a5f', marginTop: 12, marginBottom: 3 }}>{t.slice(4)}</div>;
    if (/^[-*•]\s/.test(t)) return (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 8 }}>
        <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>•</span>
        <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7 }}>{fmt(t.replace(/^[-*•]\s+/, ''))}</span>
      </div>
    );
    if (/^\d+\.\s/.test(t)) return <div key={i} style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7, marginBottom: 3, paddingLeft: 8 }}>{fmt(t)}</div>;
    if (/^---$/.test(t)) return <hr key={i} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />;
    return <p key={i} style={{ margin: '0 0 4px', fontSize: 13.5, color: '#334155', lineHeight: 1.7 }}>{fmt(t)}</p>;
  });
}

function fmt(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={m.index} style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

const SUGGESTIONS = [
  'Genera il Registro dei Trattamenti completo',
  'Analizza i rischi privacy e dimmi quali sono critici',
  'Crea un\'informativa privacy per i dipendenti',
  'Elenca tutti i fornitori con accesso ai dati personali',
  'Genera il DPA per i responsabili del trattamento',
  'Quali trattamenti richiedono una DPIA?',
  'Dammi un riepilogo dello stato della compliance GDPR',
];

export default function AIAgent({ client }) {
  const [messages, setMessages] = useState([]); // {role, content} per l'API
  const [display, setDisplay] = useState([]);   // {role, text} per il rendering
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [display, loading]);

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');
    setError('');

    const newDisplay = [...display, { role: 'user', text: userText }];
    setDisplay(newDisplay);

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const r = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, client_id: client.id }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || 'Errore agente');

      setMessages([...newMessages, { role: 'assistant', content: data.text }]);
      setDisplay([...newDisplay, { role: 'assistant', text: data.text }]);
    } catch (e) {
      setError(e.message);
      setDisplay([...newDisplay, { role: 'assistant', text: '❌ ' + e.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const reset = () => { setMessages([]); setDisplay([]); setInput(''); setError(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: 480 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>🤖 AI Agent</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
            Accesso diretto ai dati di <strong>{client.ragioneSociale}</strong> — chiedi in linguaggio naturale
          </div>
        </div>
        {display.length > 0 && (
          <button onClick={reset} style={{ ...C.btn('#f1f5f9', '#64748b'), fontSize: 12 }}>🗑️ Nuova chat</button>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {display.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>🤖</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', textAlign: 'center' }}>
              Cosa vuoi fare con i dati di {client.ragioneSociale}?
            </div>
            <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', maxWidth: 400 }}>
              L'agente legge e scrive autonomamente su Supabase — nessuna selezione manuale richiesta.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560, marginTop: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                  onMouseEnter={e => { e.target.style.borderColor = ACCENT; e.target.style.color = ACCENT; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#374151'; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {display.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? PRIMARY : '#fff',
              color: msg.role === 'user' ? '#fff' : '#0f172a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              fontSize: 13.5, lineHeight: 1.6,
            }}>
              {msg.role === 'user'
                ? <span>{msg.text}</span>
                : <div>{renderMessage(msg.text)}</div>
              }
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, animation: 'bounce 1.2s infinite', animationDelay: `${j * 0.2}s` }}/>
                ))}
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Lettura dati e generazione in corso...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Chiedi all'agente... (Invio per inviare, Shift+Invio per andare a capo)"
          rows={2}
          style={{ ...C.inp, flex: 1, resize: 'none', fontFamily: 'inherit', fontSize: 13 }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ ...C.btn(ACCENT, '#fff'), alignSelf: 'stretch', minWidth: 60, fontSize: 18, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
        >➤</button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.7);opacity:0.5} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
