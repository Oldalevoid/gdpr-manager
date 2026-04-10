import { useState, useRef, useEffect } from 'react';
import { C, ACCENT, PRIMARY } from './shared';

const AUDIT_SYSTEM = `Sei un facilitatore che conduce interviste 1:1 per mappare processi aziendali esattamente come funzionano oggi. Il tuo compito è estrarre la "conoscenza tacita" dell'utente — quella che sta in testa alle persone e non è mai stata documentata.

PRINCIPIO FONDAMENTALE
Solo AS-IS, mai TO-BE. Non ottimizzare, non correggere, non suggerire miglioramenti. Se il processo è rotto, manuale o inefficiente, lo documenti così com'è. L'ottimizzazione è un'altra sessione, un altro momento. Qui scatti una fotografia spietata della realtà.

REGOLE DI CONDUZIONE (inviolabili)
1. Una domanda alla volta. Regola assoluta. Attendi sempre la risposta prima di proseguire. Mai due domande nello stesso messaggio.
2. Se l'utente va nel TO-BE, fermalo gentilmente: "Capisco, ma adesso mi interessa solo come viene fatto oggi. L'ideale lo vediamo dopo."
3. Se l'utente segnala un problema, non risolverlo. Rispondi: "Nessun problema, lo registro come punto critico" e vai avanti.
4. Se l'utente fa un brain dump, estrai subito gli eventi al passato, mostra la sintesi e chiedi solo cosa manca. Non ripetere quello che ha già detto.
5. Se noti un buco logico tra un evento e l'altro, chiedi se oggi esiste un passaggio che copre quel vuoto. Se non c'è, registralo come hotspot.
6. Tutti gli eventi vanno al passato: "Fattura emessa", "Campione verificato", "Mail inviata".

TECNICHE PER FAR EMERGERE LA REALTÀ
- Memoria episodica: mai chiedere "Come fate di solito?". Chiedi sempre: "Pensa all'ultima volta che lo hai fatto. Cosa è successo in quel caso specifico?"
- Caccia agli artefatti: quando l'utente usa verbi generici ("controllo", "gestisco", "processo"), chiedi l'oggetto fisico o digitale: "Dove lo guardi? Apri un Excel? Un gestionale? Lo cerchi in una cartella?"
- Reverse engineering: se l'utente si blocca, fissa l'evento finale e vai a ritroso: "Subito prima che succedesse questo, qual è l'ultimissima cosa che hai fatto?"
- Riconoscimento dei segnali: quando l'utente dice "di solito", "normalmente", "in teoria" sta descrivendo il processo ideale. Rispondi: "Ok, questo è come dovrebbe andare. Ma l'ultima volta, cosa è successo davvero?"

FASI DELL'INTERVISTA

FASE 1 — Scope, obiettivo e confini
Quando: inizio conversazione.
- Chiedi quale processo vuole mappare, invitandolo a pensare all'ultima volta che lo ha fatto.
- Chiedi l'obiettivo di business: "Qual è l'obiettivo finale o il valore che vuoi ottenere con questo processo?"
- Fissa i confini: chiedi di confermare l'evento iniziale assoluto e l'evento finale.
- Se il processo è troppo ampio (rischi >20 eventi), suggerisci di partire da una porzione con inizio/fine chiari.

FASE 2 — Esplorazione sequenziale
Quando: obiettivo e confini sono definiti.
- Mostra la sequenza cronologica raccolta finora (lista numerata degli eventi al passato).
- Analizza i salti logici: "Esattamente come fai a passare da [Evento A] a [Evento B] oggi? C'è un passaggio intermedio?"
- Esplora i percorsi alternativi: "E se qualcosa va storto a questo punto, cosa succede?"
- Attendi che l'utente dichiari completa la sequenza.
- Ogni 5-7 eventi nuovi, fai una sintesi parziale per validare.

FASE 3 — Deep dive operativo
Quando: la sequenza temporale è completa e confermata.
- Avvisa l'utente: "Ora aggiungiamo i dettagli operativi per completare la fotografia."
- Per ogni evento significativo, deduci dal contesto oppure chiedi una cosa alla volta:
  * Azione concreta: cosa fa esattamente la persona in quel momento
  * Attore: chi lo fa (ruolo o nome)
  * Sistema/strumento: quale tool, software, foglio, telefono usa oggi
  * Regole/condizioni: vincoli, prerequisiti, policy che si applicano
- Quando hai coperto tutti gli eventi, chiedi: "Abbiamo mappato tutto il processo attuale. Posso generare il documento finale o manca ancora qualche dettaglio?"
- NON generare il documento prima di questa conferma esplicita.

FASE 4 — Restituzione finale
Quando: l'utente ha confermato che non manca nulla.
- Congratulati brevemente con l'utente.
- Genera il documento narrativo in Markdown con questa struttura ESATTA:

# Mappatura Processo: [NOME PROCESSO]

**Azienda:** [AZIENDA] | **Data:** [DATA ODIERNA] | **Sessione:** Audit AS-IS

## Obiettivo di Business
[Descrizione obiettivo]

## Confini del Processo
- **Evento iniziale:** [Evento]
- **Evento finale:** [Evento]
- **Attori coinvolti:** [Lista ruoli]

## Sequenza degli Eventi (AS-IS)
1. [Evento al passato]
2. [Evento al passato]
[...tutti gli eventi...]

## Dettaglio Operativo

### [Evento 1]
- **Attore:** [Ruolo]
- **Azione:** [Descrizione concreta]
- **Strumento/Sistema:** [Tool usato oggi]
- **Regole/Condizioni:** [Vincoli o policy]

[...ripeti per ogni evento significativo...]

## Hotspot e Punti Critici
- 🔴 [Problema 1]
- 🔴 [Problema 2]

## Osservazioni del Facilitatore
[Note generali sul processo mappato]

---

- Subito dopo il documento narrativo, genera la tabella CSV con questo formato ESATTO (inizia con la riga header, poi una riga per evento):

\`\`\`csv
#,Evento,Attore,Strumento,Regola_Condizione,Hotspot
1,[Evento],[Attore],[Strumento],[Regola],No
2,[Evento],[Attore],[Strumento],[Regola],Sì
\`\`\`

- Chiudi con: "Ecco la fotografia del tuo processo attuale. Adesso che lo vedi per intero, hai una base chiara per poterlo, in una fase successiva, ottimizzare e ridisegnare."`;

function renderMessage(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: 8 }} />;
    if (/^# /.test(trimmed)) return <div key={i} style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginTop: 18, marginBottom: 6 }}>{trimmed.slice(2)}</div>;
    if (/^## /.test(trimmed)) return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: '#1a3a5c', marginTop: 14, marginBottom: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 3 }}>{trimmed.slice(3)}</div>;
    if (/^### /.test(trimmed)) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: '#1e3a5f', marginTop: 12, marginBottom: 3 }}>{trimmed.slice(4)}</div>;
    if (/^[-*•]\s/.test(trimmed)) return (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 8 }}>
        <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>•</span>
        <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7 }}>{formatInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
      </div>
    );
    if (/^\d+\.\s/.test(trimmed)) return <div key={i} style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7, marginBottom: 3, paddingLeft: 8 }}>{formatInline(trimmed)}</div>;
    if (/^```/.test(trimmed)) return <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', borderRadius: 4, padding: '2px 6px', color: '#475569' }}>{trimmed.replace(/```\w*/,'')}</div>;
    if (/^---$/.test(trimmed)) return <hr key={i} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />;
    return <p key={i} style={{ margin: '0 0 4px', fontSize: 13.5, color: '#334155', lineHeight: 1.7 }}>{formatInline(trimmed)}</p>;
  });
}

function formatInline(text) {
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

export default function Audit({ client }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const provider = localStorage.getItem('gdpr:aiProvider') || 'groq';

  const callFacilitator = async (msgs) => {
    const systemContent = AUDIT_SYSTEM + (client ? `\n\nCONTESTO AZIENDA: ${client.ragioneSociale}${client.settore ? `, settore: ${client.settore}` : ''}` : '');
    if (provider === 'claude') {
      const r = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 2000,
          system: systemContent,
          messages: msgs,
        }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error?.message || 'Errore Claude API');
      return data.content?.[0]?.text?.trim() || '';
    } else {
      const r = await fetch('/api/groq/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2000,
          temperature: 0.35,
          messages: [{ role: 'system', content: systemContent }, ...msgs],
        }),
      });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error?.message || 'Errore API');
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
  };

  const startSession = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const greeting = await callFacilitator([{ role: 'user', content: 'Inizia l\'intervista.' }]);
      setMessages([{ role: 'assistant', content: greeting }]);
    } catch (e) {
      setMessages([{ role: 'assistant', content: '❌ Errore: ' + e.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const reply = await callFacilitator(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: '❌ Errore: ' + e.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const resetSession = () => {
    setMessages([]); setInput(''); setStarted(false); setSessionName(''); setLoading(false);
  };

  const exportDocument = () => {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const content = lastAI.content;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `audit_${(sessionName || client?.ragioneSociale || 'processo').replace(/[^a-z0-9]/gi,'_')}.md`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const hasDocument = messages.some(m => m.role === 'assistant' && m.content.includes('# Mappatura Processo'));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>🔍 Audit — Mappatura Processi AS-IS</h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            Intervista guidata per fotografare i processi aziendali esattamente come sono oggi
          </div>
        </div>
        <div style={C.row}>
          {hasDocument && (
            <button style={C.btn('#16a34a', '#fff', true)} onClick={exportDocument}>
              📥 Esporta documento .md
            </button>
          )}
          {started && (
            <button style={C.btn('#f1f5f9', '#374151', true)} onClick={resetSession}>
              🔄 Nuova sessione
            </button>
          )}
        </div>
      </div>

      {!started ? (
        <div style={{ ...C.card, maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 18 }}>Sessione di Mappatura Processo</h3>
          <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
            Un facilitatore AI ti guiderà passo dopo passo per documentare come funziona oggi un processo aziendale.
          </p>
          <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: 12 }}>
            Una domanda alla volta · Solo AS-IS · Fotografia della realtà
          </p>
          <div style={{ marginBottom: 16 }}>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Nome sessione (opzionale, es. 'Onboarding cliente')"
              style={{ ...C.inp, maxWidth: 360, margin: '0 auto', display: 'block', textAlign: 'center' }}
            />
          </div>
          <button style={{ ...C.btn(PRIMARY, '#fff'), padding: '12px 32px', fontSize: 15 }} onClick={startSession}>
            ▶ Avvia intervista
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 500 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', marginBottom: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                    🎯
                  </div>
                )}
                <div style={{
                  maxWidth: msg.role === 'user' ? '65%' : '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                  background: msg.role === 'user' ? ACCENT : '#f8fafc',
                  color: msg.role === 'user' ? '#fff' : '#0f172a',
                  border: msg.role === 'assistant' ? '1px solid #e5eaf0' : 'none',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                }}>
                  {msg.role === 'user' ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  ) : (
                    <div style={{ fontFamily: '"Calibri", system-ui, sans-serif' }}>
                      {renderMessage(msg.content)}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: ACCENT + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginLeft: 8, marginTop: 2 }}>
                    👤
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🎯</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e5eaf0', borderRadius: '2px 12px 12px 12px', padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>
                  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ animation: 'pulse 1s infinite', opacity: 0.6 }}>●</span>
                    <span style={{ animation: 'pulse 1s infinite .2s', opacity: 0.6 }}>●</span>
                    <span style={{ animation: 'pulse 1s infinite .4s', opacity: 0.6 }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ ...C.card, padding: '12px 14px', borderTop: `3px solid ${PRIMARY}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Rispondi al facilitatore... (Invio per inviare, Shift+Invio per andare a capo)"
                rows={2}
                disabled={loading}
                style={{ ...C.inp, resize: 'none', flex: 1, minHeight: 44, fontSize: 13.5, lineHeight: 1.5 }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{ ...C.btn(PRIMARY, '#fff'), padding: '10px 18px', alignSelf: 'stretch', opacity: loading || !input.trim() ? 0.5 : 1 }}
              >
                Invia ↵
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'right' }}>
              Invio per inviare · Shift+Invio per andare a capo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
