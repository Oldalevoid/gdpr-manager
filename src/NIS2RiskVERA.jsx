import { useState, useMemo } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import * as XLSX from 'xlsx';

// ─── Catalogo Minacce (ISO/IEC 27005 + NIS2) ─────────────────────────────────

const MINACCE = [
  { id:'T01', cat:'Attacchi informatici esterni', label:'Attacco informatico esterno (hacking, intrusione, APT)', rid:'RID' },
  { id:'T02', cat:'Attacchi informatici esterni', label:'Ransomware e malware distruttivo', rid:'ID' },
  { id:'T03', cat:'Attacchi informatici esterni', label:'Virus, spyware, trojan (malware generico)', rid:'RID' },
  { id:'T04', cat:'Attacchi informatici esterni', label:'Phishing e social engineering verso il personale', rid:'RI' },
  { id:'T05', cat:'Attacchi informatici esterni', label:'Attacco DDoS — negazione del servizio', rid:'D' },
  { id:'T06', cat:'Attacchi informatici esterni', label:'Sfruttamento di vulnerabilità software (exploit, zero-day)', rid:'RID' },
  { id:'T07', cat:'Accessi non autorizzati', label:'Accesso non autorizzato da personale interno', rid:'RID' },
  { id:'T08', cat:'Accessi non autorizzati', label:'Abuso di privilegi da parte di amministratori di sistema', rid:'RID' },
  { id:'T09', cat:'Accessi non autorizzati', label:'Furto o compromissione di credenziali (password, token)', rid:'RI' },
  { id:'T10', cat:'Errori e incidenti interni', label:'Errore umano nella configurazione o gestione dei sistemi', rid:'RID' },
  { id:'T11', cat:'Errori e incidenti interni', label:'Divulgazione accidentale di dati a destinatari errati', rid:'R' },
  { id:'T12', cat:'Errori e incidenti interni', label:'Perdita o furto di dispositivi / supporti di memorizzazione', rid:'RD' },
  { id:'T13', cat:'Supply chain e terze parti', label:'Violazione o attacco tramite fornitore (supply chain attack)', rid:'RID' },
  { id:'T14', cat:'Supply chain e terze parti', label:'Interruzione o malfunzionamento di servizi cloud critici', rid:'ID' },
  { id:'T15', cat:'Supply chain e terze parti', label:'Inadempienza contrattuale o fallimento di fornitori critici', rid:'RD' },
  { id:'T16', cat:'Infrastruttura fisica e tecnologica', label:'Guasto hardware o software su sistemi critici', rid:'ID' },
  { id:'T17', cat:'Infrastruttura fisica e tecnologica', label:'Interruzione alimentazione elettrica prolungata', rid:'D' },
  { id:'T18', cat:'Infrastruttura fisica e tecnologica', label:'Interruzione connettività di rete / internet', rid:'D' },
  { id:'T19', cat:'Calamità e forza maggiore', label:'Incendio, allagamento, terremoto o calamità fisiche', rid:'D' },
  { id:'T20', cat:'Calamità e forza maggiore', label:'Epidemia o indisponibilità estesa del personale', rid:'D' },
];

const MINACCE_CAT = [...new Set(MINACCE.map(m => m.cat))];

// ─── Costanti e helpers ───────────────────────────────────────────────────────

const VERO_LABELS = ['', 'Bassa', 'Media', 'Alta'];
const VERO_COLOR  = ['', '#16a34a', '#d97706', '#dc2626'];
const RID_LABELS  = { R:'Riservatezza', I:'Integrità', D:'Disponibilità' };
const STATO_EFFICACIA = { 'Implementata':4, 'In corso':3, 'Pianificata':2, 'Non implementata':1 };
const EFFICACIA_LABELS = { 1:'Inadeguato', 2:'Parziale', 3:'Quasi adeguato', 4:'Adeguato' };

// Conseguenze = MAX(R*r, I*i, D*d) dove r,i,d sono 0/1 da rid flags del processo
function calcolaConseguenze(proc, minaccia) {
  const r = minaccia.rid.includes('R') ? 1 : 0;
  const i = minaccia.rid.includes('I') ? 1 : 0;
  const d = minaccia.rid.includes('D') ? 1 : 0;
  return Math.max(
    (proc.riservatezza || 1) * r,
    (proc.integrita    || 1) * i,
    (proc.disponibilita|| 1) * d
  ) || 1;
}

// Rischio inerente = conseguenze × verosimiglianza  (1–12)
function rischioInherente(proc, minaccia, verosimiglianza) {
  return calcolaConseguenze(proc, minaccia) * verosimiglianza;
}

// Efficacia controlli = MAX(efficacia delle misure collegate) — se nessuna: 1
function efficaciaMisure(misureIds, allMisure) {
  if (!misureIds?.length) return 1;
  const vals = misureIds.map(id => {
    const m = allMisure.find(x => x.id === id);
    return m ? (STATO_EFFICACIA[m.stato] || 1) : 1;
  });
  return Math.max(...vals);
}

// vlb = 5 − efficacia (VERA: vulnerability = 5 - control_value)
// Rischio residuo = conseguenze × verosimiglianza × vlb  (1–48)
function rischioResiduo(proc, minaccia, verosimiglianza, misureIds, allMisure, valoreAtteso) {
  const eff = valoreAtteso || efficaciaMisure(misureIds, allMisure);
  const vlb = 5 - eff;
  return calcolaConseguenze(proc, minaccia) * verosimiglianza * vlb;
}

const rColor = r => r <= 4 ? '#16a34a' : r <= 8 ? '#d97706' : '#dc2626';
const rLabel = r => r <= 4 ? 'Basso' : r <= 8 ? 'Medio' : 'Alto';
const rrColor = r => r <= 12 ? '#16a34a' : r <= 24 ? '#d97706' : r <= 36 ? '#ea580c' : '#dc2626';
const rrLabel = r => r <= 12 ? 'Basso' : r <= 24 ? 'Medio' : r <= 36 ? 'Alto' : 'Critico';

const vKey = (pId, mId) => `${pId}::${mId}`;

// ─── Processo Form ─────────────────────────────────────────────────────────

const EMPTY_PROC = { nome:'', unitaOrganizzativa:'', riservatezza:2, integrita:2, disponibilita:2, assetIds:[], referente:'', mtpd:'', note:'' };
const RID_DESC = {
  R: ['','Dati pubblici','Uso interno','Riservato','Strettamente riservato'],
  I: ['','Non critica','Bassa criticità','Alta criticità','Vitale — errori inaccettabili'],
  D: ['','Indisponibilità accettabile','Max qualche ora','Max qualche ora (SLA)','Disponibilità continua richiesta'],
};

function ProcessoForm({ initial, assets, onSave, onCancel }) {
  const [f, setF] = useState(initial || EMPTY_PROC);
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggleAsset = id => {
    const ids = f.assetIds || [];
    setF(p => ({ ...p, assetIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] }));
  };

  return (
    <Modal onClose={onCancel} maxWidth={640}>
      <h3 style={{ margin: '0 0 18px', color: '#0f172a' }}>
        {initial ? '✏️ Modifica processo critico' : '➕ Nuovo processo critico'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Fld id='nome' label='Nome processo *' val={f.nome} onChange={u} ph='es. Gestione ordini clienti, Erogazione servizio web...' />
        </div>
        <Fld id='unitaOrganizzativa' label='Unità organizzativa' val={f.unitaOrganizzativa} onChange={u} ph='es. IT, Amministrazione, Commerciale...' />
        <Fld id='referente' label='Referente' val={f.referente} onChange={u} ph='es. Mario Rossi' />
      </div>

      {/* RID sliders */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 12 }}>
          Valori R · I · D (1 = Basso → 4 = Critico)
        </div>
        {['riservatezza','integrita','disponibilita'].map(key => {
          const K = key === 'riservatezza' ? 'R' : key === 'integrita' ? 'I' : 'D';
          const label = key === 'riservatezza' ? 'Riservatezza (R)' : key === 'integrita' ? 'Integrità (I)' : 'Disponibilità (D)';
          const v = f[key] || 1;
          const colors = ['','#16a34a','#d97706','#ea580c','#dc2626'];
          return (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 200px', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#374151' }}>{label}</div>
              <input type='range' min={1} max={4} step={1} value={v}
                onChange={e => u(key, parseInt(e.target.value))}
                style={{ width: '100%', accentColor: colors[v] }} />
              <div style={{ fontSize: 11, color: colors[v], fontWeight: 700 }}>
                {v} — {RID_DESC[K][v]}
              </div>
            </div>
          );
        })}
      </div>

      <Fld id='mtpd' label='MTPD — Max tempo tollerato di indisponibilità (opz.)' val={f.mtpd} onChange={u} ph='es. 4 ore, 1 giorno, RTO < 2h...' />

      {/* Asset linkage */}
      {assets.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={C.lbl}>Asset coinvolti (dipendenze del processo)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {assets.map(a => {
              const sel = (f.assetIds || []).includes(a.id);
              return (
                <button key={a.id} type='button' onClick={() => toggleAsset(a.id)}
                  style={{ ...C.btn(sel ? '#0891b2' : '#f1f5f9', sel ? '#fff' : '#374151', true), borderRadius: 16 }}>
                  {sel ? '✓ ' : ''}{a.nome}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Fld id='note' label='Note' val={f.note} onChange={u} type='textarea' ph='es. processo critico per il business, soggetto a SLA...' />

      <div style={C.row}>
        <button style={C.btn()} onClick={() => {
          if (!f.nome.trim()) { alert("Inserisci il nome del processo"); return; }
          onSave({ ...f, id: initial?.id || Date.now().toString() });
        }}>💾 Salva</button>
        <button style={C.btn('#f1f5f9', '#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </Modal>
  );
}

// ─── Tab Processi Critici ─────────────────────────────────────────────────────

function ProcessiTab({ processi, assets, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editProc, setEditProc] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));

  const handleSave = p => {
    const updated = editProc ? processi.map(x => x.id === p.id ? p : x) : [...processi, p];
    onSave(updated);
    setShowForm(false); setEditProc(null);
  };

  const ridColors = ['', '#16a34a', '#d97706', '#ea580c', '#dc2626'];

  return (
    <div>
      {(showForm || editProc) && (
        <ProcessoForm initial={editProc} assets={assets}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditProc(null); }} />
      )}
      <div style={{ ...C.row, justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>🏭 Processi Critici</SectionTitle>
        <button style={C.btn('#0891b2', '#fff', true)} onClick={() => { setEditProc(null); setShowForm(true); }}>
          + Aggiungi processo
        </button>
      </div>

      {/* Info box */}
      <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#0c4a6e', lineHeight: 1.6 }}>
        <strong>Modello VERA 8</strong> — Censisci i processi critici e assegna i valori di <strong>Riservatezza (R)</strong>, <strong>Integrità (I)</strong> e <strong>Disponibilità (D)</strong> da 1 a 4.
        Questi valori determinano le conseguenze di ciascuna minaccia nel calcolo del rischio.
      </div>

      {processi.length === 0 ? (
        <EmptyState icon='🏭' title='Nessun processo critico'
          sub="Aggiungi i processi critici dell'organizzazione per avviare l'analisi dei rischi."
          onAction={() => { setEditProc(null); setShowForm(true); }} actionLabel='+ Aggiungi il primo processo' />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {processi.map(p => {
            const linkedAssets = (p.assetIds || []).map(id => assetMap[id]).filter(Boolean);
            const maxRID = Math.max(p.riservatezza || 1, p.integrita || 1, p.disponibilita || 1);
            return (
              <div key={p.id} style={{ ...C.card, padding: '16px', borderLeft: `4px solid ${ridColors[maxRID]}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.nome}</span>
                      {p.unitaOrganizzativa && <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '2px 7px' }}>{p.unitaOrganizzativa}</span>}
                    </div>
                    {/* RID badges */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      {[['R', p.riservatezza], ['I', p.integrita], ['D', p.disponibilita]].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, background: ridColors[v] + '18', borderRadius: 8, padding: '3px 10px' }}>
                          <span style={{ fontWeight: 800, fontSize: 12, color: ridColors[v] }}>{k}</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: ridColors[v] }}>{v}</span>
                          <span style={{ fontSize: 10, color: ridColors[v], opacity: .8 }}>
                            {v === 1 ? 'Basso' : v === 2 ? 'Medio' : v === 3 ? 'Alto' : 'Critico'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                      {p.referente && <span>👤 {p.referente}</span>}
                      {p.mtpd && <span>⏱️ MTPD: {p.mtpd}</span>}
                      {linkedAssets.length > 0 && (
                        <span>🖥️ Asset: {linkedAssets.map(a => a.nome).join(', ')}</span>
                      )}
                    </div>
                    {p.note && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>📝 {p.note}</div>}
                  </div>
                  <div style={{ ...C.row, flexShrink: 0 }}>
                    <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => { setEditProc(p); setShowForm(true); }}>✏️</button>
                    {confirmDel === p.id
                      ? <>
                        <button style={C.btn('#dc2626', '#fff', true)} onClick={() => { onSave(processi.filter(x => x.id !== p.id)); setConfirmDel(null); }}>Conferma</button>
                        <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => setConfirmDel(null)}>✕</button>
                      </>
                      : <button style={C.btn('#fff5f5', '#dc2626', true)} onClick={() => setConfirmDel(p.id)}>🗑️</button>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Riga Minaccia nel tab Valutazione ────────────────────────────────────────

function MinacciaRow({ minaccia, processo, val, allMisure, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const v = val?.verosimiglianza || 0;
  const cons = calcolaConseguenze(processo, minaccia);
  const ri = v > 0 ? rischioInherente(processo, minaccia, v) : null;
  const rr = v > 0 ? rischioResiduo(processo, minaccia, v, val?.misureIds, allMisure, val?.valoreControlloAtteso) : null;
  const efficacia = efficaciaMisure(val?.misureIds, allMisure);
  const vlb = 5 - efficacia;

  const linkedMisure = (val?.misureIds || []).map(id => allMisure.find(m => m.id === id)).filter(Boolean);

  const toggleMisura = id => {
    const ids = val?.misureIds || [];
    onUpdate('misureIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  const ridFlags = minaccia.rid.split('').join(' · ');

  return (
    <div style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Threat label */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 2 }}>{minaccia.label}</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Impatto su: {ridFlags} | Conseguenze calcolate: <strong>{cons}</strong></div>
        </div>

        {/* Verosimiglianza */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 120 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Verosimiglianza</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3].map(n => (
              <button key={n} onClick={() => onUpdate('verosimiglianza', n)}
                style={{ width: 28, height: 28, borderRadius: 6, border: `2px solid ${v === n ? (n === 0 ? '#94a3b8' : VERO_COLOR[n]) : '#e5eaf0'}`, background: v === n ? (n === 0 ? '#f1f5f9' : VERO_COLOR[n] + '22') : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: v === n ? (n === 0 ? '#94a3b8' : VERO_COLOR[n]) : '#94a3b8' }}>
                {n === 0 ? '—' : n}
              </button>
            ))}
          </div>
          {v > 0 && <div style={{ fontSize: 10, color: VERO_COLOR[v], fontWeight: 700 }}>{VERO_LABELS[v]}</div>}
        </div>

        {/* Rischio inerente */}
        {ri !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 70 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Inerente</div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: rColor(ri), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{ri}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: rColor(ri) }}>{rLabel(ri)}</div>
          </div>
        ) : (
          <div style={{ minWidth: 70, textAlign: 'center', fontSize: 11, color: '#cbd5e1' }}>—</div>
        )}

        {/* Rischio residuo */}
        {rr !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 70 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Residuo</div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: rrColor(rr), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{rr}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: rrColor(rr) }}>{rrLabel(rr)}</div>
          </div>
        ) : (
          <div style={{ minWidth: 70, textAlign: 'center', fontSize: 11, color: '#cbd5e1' }}>—</div>
        )}

        {/* Expand button */}
        <button onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: '1px solid #e5eaf0', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontSize: 11, padding: '4px 8px', fontFamily: 'inherit', fontWeight: 600 }}>
          {expanded ? '▲' : '▼'} Misure
          {linkedMisure.length > 0 && <span style={{ marginLeft: 4, background: '#0891b2', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 10 }}>{linkedMisure.length}</span>}
        </button>
      </div>

      {/* Expanded: misure selector + vlb info */}
      {expanded && v > 0 && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
            Misure Art.21 che mitigano questa minaccia
          </div>
          {allMisure.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Nessuna misura Art.21 inserita. Aggiungile nel tab "Misure Art.21".</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {allMisure.map(m => {
                const sel = (val?.misureIds || []).includes(m.id);
                const statCol = { 'Implementata':'#16a34a','In corso':'#2563eb','Pianificata':'#d97706','Non implementata':'#dc2626' }[m.stato] || '#64748b';
                return (
                  <button key={m.id} onClick={() => toggleMisura(m.id)}
                    style={{ ...C.btn(sel ? '#0891b2' : '#fff', sel ? '#fff' : '#374151', true), border: `1.5px solid ${sel ? '#0891b2' : '#e5eaf0'}`, borderRadius: 16, gap: 4 }}>
                    {sel ? '✓ ' : ''}{m.nome}
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: statCol + '22', color: statCol, fontWeight: 700 }}>{m.stato}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Efficacia summary */}
          {(val?.misureIds || []).length > 0 && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#374151', background: '#fff', borderRadius: 6, padding: '8px 12px', border: '1px solid #e5eaf0' }}>
              <span>Efficacia controllo: <strong style={{ color: ['','#dc2626','#d97706','#2563eb','#16a34a'][efficacia] }}>{efficacia}/4 — {EFFICACIA_LABELS[efficacia]}</strong></span>
              <span>Vulnerabilità (vlb): <strong>{vlb}</strong></span>
              <span>Formula: {cons} (cons.) × {v} (veros.) × {vlb} (vlb) = <strong style={{ color: rrColor(rr) }}>{rr}</strong></span>
            </div>
          )}

          {/* Manual control value override for treatment tab */}
          <div style={{ marginTop: 10 }}>
            <label style={C.lbl}>Valore controllo atteso dopo trattamento (opz., 1–4)</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {[null, 1, 2, 3, 4].map(n => {
                const cur = val?.valoreControlloAtteso;
                return (
                  <button key={String(n)} onClick={() => onUpdate('valoreControlloAtteso', n === cur ? null : n)}
                    style={{ ...C.btn(cur === n && n !== null ? '#0891b2' : '#f1f5f9', cur === n && n !== null ? '#fff' : '#374151', true) }}>
                    {n === null ? 'Auto' : `${n} — ${EFFICACIA_LABELS[n]}`}
                  </button>
                );
              })}
            </div>
            {val?.valoreControlloAtteso && (() => {
              const atteso = rischioResiduo(processo, minaccia, v, val?.misureIds, allMisure, val.valoreControlloAtteso);
              return <div style={{ fontSize: 11, marginTop: 4, color: rrColor(atteso) }}>Rischio residuo atteso: <strong>{atteso} — {rrLabel(atteso)}</strong></div>;
            })()}
          </div>

          {/* Note */}
          <div style={{ marginTop: 10 }}>
            <label style={C.lbl}>Note / giustificazione</label>
            <textarea value={val?.note || ''} onChange={e => onUpdate('note', e.target.value)}
              rows={2} placeholder="es. Zona a basso rischio sismico, attaccante non otterrebbe vantaggi significativi..."
              style={{ ...C.inp, resize: 'vertical', minHeight: 48, marginTop: 4 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Valutazione Rischi ───────────────────────────────────────────────────

function ValutazioneTab({ processi, valutazioni, allMisure, onUpdateVal }) {
  const [selProcId, setSelProcId] = useState(processi[0]?.id || null);
  const [catOpen, setCatOpen] = useState({});
  const [filterNonVal, setFilterNonVal] = useState(false);

  const proc = processi.find(p => p.id === selProcId);

  const toggleCat = c => setCatOpen(p => ({ ...p, [c]: !p[c] }));

  // Stats for selected process
  const stats = useMemo(() => {
    if (!proc) return null;
    let valutate = 0, basse = 0, medie = 0, alte = 0;
    MINACCE.forEach(m => {
      const val = valutazioni[vKey(proc.id, m.id)];
      const v = val?.verosimiglianza || 0;
      if (v === 0) return;
      valutate++;
      const rr = rischioResiduo(proc, m, v, val?.misureIds, allMisure, val?.valoreControlloAtteso);
      if (rr <= 12) basse++;
      else if (rr <= 24) medie++;
      else alte++;
    });
    return { valutate, basse, medie, alte };
  }, [proc, valutazioni, allMisure]);

  if (processi.length === 0) {
    return <EmptyState icon='⚠️' title='Nessun processo critico' sub="Aggiungi prima i processi critici nel tab 'Processi'." />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
      {/* Sidebar */}
      <div style={{ ...C.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '1px solid #f1f5f9' }}>
          Processi
        </div>
        {processi.map(p => {
          const evalCount = MINACCE.filter(m => (valutazioni[vKey(p.id, m.id)]?.verosimiglianza || 0) > 0).length;
          return (
            <button key={p.id} onClick={() => setSelProcId(p.id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: selProcId === p.id ? '#eff6ff' : 'transparent', border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer', fontFamily: 'inherit', borderLeft: selProcId === p.id ? `3px solid #0891b2` : '3px solid transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: selProcId === p.id ? '#0891b2' : '#0f172a' }}>{p.nome}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{evalCount}/{MINACCE.length} minacce valutate</div>
            </button>
          );
        })}
      </div>

      {/* Main panel */}
      {proc ? (
        <div>
          {/* Process header */}
          <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, color: '#fff' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{proc.nome}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['R', proc.riservatezza], ['I', proc.integrita], ['D', proc.disponibilita]].map(([k, v]) => (
                <span key={k} style={{ fontSize: 12, background: 'rgba(255,255,255,.2)', borderRadius: 8, padding: '2px 10px', fontWeight: 700 }}>
                  {k}: {v}/4
                </span>
              ))}
              {stats && <>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '2px 8px' }}>
                  {stats.valutate}/{MINACCE.length} minacce valutate
                </span>
                {stats.alte > 0 && <span style={{ fontSize: 11, background: '#dc2626', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>🔴 {stats.alte} rischi alti/critici</span>}
                {stats.medie > 0 && <span style={{ fontSize: 11, background: '#d97706', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>🟡 {stats.medie} medi</span>}
                {stats.basse > 0 && <span style={{ fontSize: 11, background: '#16a34a', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>🟢 {stats.basse} bassi</span>}
              </>}
            </div>
          </div>

          {/* Filter */}
          <div style={{ ...C.row, marginBottom: 10, gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
              <input type='checkbox' checked={filterNonVal} onChange={e => setFilterNonVal(e.target.checked)} />
              Mostra solo minacce valutate
            </label>
          </div>

          {/* Threats by category */}
          {MINACCE_CAT.map(cat => {
            const minCat = MINACCE.filter(m => m.cat === cat);
            const open = catOpen[cat] !== false; // default open
            const evalInCat = minCat.filter(m => (valutazioni[vKey(proc.id, m.id)]?.verosimiglianza || 0) > 0).length;
            const visibleMinacce = filterNonVal ? minCat.filter(m => (valutazioni[vKey(proc.id, m.id)]?.verosimiglianza || 0) > 0) : minCat;
            if (filterNonVal && visibleMinacce.length === 0) return null;
            return (
              <div key={cat} style={{ ...C.card, marginBottom: 10, padding: 0, overflow: 'hidden' }}>
                <button onClick={() => toggleCat(cat)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>{cat}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{evalInCat}/{minCat.length} valutate</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
                  </div>
                </button>
                {open && (
                  <div style={{ padding: '0 16px' }}>
                    {visibleMinacce.map(m => (
                      <MinacciaRow
                        key={m.id}
                        minaccia={m}
                        processo={proc}
                        val={valutazioni[vKey(proc.id, m.id)]}
                        allMisure={allMisure}
                        onUpdate={(field, value) => onUpdateVal(proc.id, m.id, field, value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon='👈' title='Seleziona un processo' />
      )}
    </div>
  );
}

// ─── Tab Piano di Trattamento ─────────────────────────────────────────────────

function TrattamentoTab({ processi, valutazioni, allMisure, onUpdateVal }) {
  const [sortBy, setSortBy] = useState('residuo');

  // Build all evaluated (processo, minaccia) pairs
  const rows = useMemo(() => {
    const result = [];
    processi.forEach(proc => {
      MINACCE.forEach(m => {
        const val = valutazioni[vKey(proc.id, m.id)];
        const v = val?.verosimiglianza || 0;
        if (v === 0) return;
        const ri = rischioInherente(proc, m, v);
        const rr = rischioResiduo(proc, m, v, val?.misureIds, allMisure, val?.valoreControlloAtteso);
        const rrAtteso = val?.valoreControlloAtteso
          ? rischioResiduo(proc, m, v, val?.misureIds, allMisure, val.valoreControlloAtteso)
          : null;
        result.push({ proc, minaccia: m, val, ri, rr, rrAtteso });
      });
    });
    if (sortBy === 'residuo') result.sort((a, b) => b.rr - a.rr);
    else if (sortBy === 'inerente') result.sort((a, b) => b.ri - a.ri);
    return result;
  }, [processi, valutazioni, allMisure, sortBy]);

  if (processi.length === 0) {
    return <EmptyState icon='📋' title='Nessun processo critico' sub="Aggiungi prima i processi e valuta le minacce." />;
  }
  if (rows.length === 0) {
    return <EmptyState icon='📋' title='Nessuna minaccia valutata' sub="Vai nel tab 'Valutazione Rischi' e assegna la verosimiglianza alle minacce." />;
  }

  return (
    <div>
      <div style={{ ...C.row, justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>📋 Piano di Trattamento del Rischio</SectionTitle>
        <div style={{ ...C.row, gap: 8 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ ...C.inp, width: 'auto', fontSize: 12, padding: '5px 10px' }}>
            <option value='residuo'>Ordina per rischio residuo</option>
            <option value='inerente'>Ordina per rischio inerente</option>
          </select>
          <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => exportTrattamento(rows)}>
            📊 Esporta Excel
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: '#64748b' }}>Rischio residuo:</div>
        {[['#16a34a', '≤12 Basso'], ['#d97706', '13-24 Medio'], ['#ea580c', '25-36 Alto'], ['#dc2626', '>36 Critico']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(({ proc, minaccia, val, ri, rr }) => {
          const accettabile = rr <= 12;
          return (
            <div key={vKey(proc.id, minaccia.id)} style={{ ...C.card, padding: '14px 16px', borderLeft: `4px solid ${rrColor(rr)}`, opacity: accettabile ? .75 : 1 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Risk scores */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>INERENTE</div>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: rColor(ri), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>{ri}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 16, paddingTop: 16 }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>RESIDUO</div>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: rrColor(rr), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>{rr}</div>
                  </div>
                </div>

                {/* Process + Threat */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0891b2', marginBottom: 2 }}>
                    {proc.nome}
                    {proc.unitaOrganizzativa && <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {proc.unitaOrganizzativa}</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>{minaccia.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    V:{val?.verosimiglianza} × C:{calcolaConseguenze(proc, minaccia)} × vlb:{5 - efficaciaMisure(val?.misureIds, allMisure)} = {rr} · <span style={{ color: rrColor(rr), fontWeight: 700 }}>{rrLabel(rr)}</span>
                    {accettabile && <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 700 }}>✓ Accettabile</span>}
                  </div>
                </div>

                {/* Treatment actions — only for non-acceptable risks */}
                {!accettabile && (
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
                      <div style={{ gridColumn: '1/-1', marginBottom: 6 }}>
                        <label style={C.lbl}>Azione di trattamento</label>
                        <textarea value={val?.azione || ''} onChange={e => onUpdateVal(proc.id, minaccia.id, 'azione', e.target.value)}
                          rows={2} placeholder='es. Implementare MFA, attivare backup offsite...'
                          style={{ ...C.inp, resize: 'none', fontSize: 12, minHeight: 52 }} />
                      </div>
                      <div>
                        <label style={C.lbl}>Responsabile</label>
                        <input value={val?.responsabile || ''} onChange={e => onUpdateVal(proc.id, minaccia.id, 'responsabile', e.target.value)}
                          placeholder='es. CISO' style={{ ...C.inp, fontSize: 12 }} />
                      </div>
                      <div>
                        <label style={C.lbl}>Scadenza</label>
                        <input type='date' value={val?.scadenza || ''} onChange={e => onUpdateVal(proc.id, minaccia.id, 'scadenza', e.target.value)}
                          style={{ ...C.inp, fontSize: 12 }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function exportTrattamento(rows) {
  const data = rows.map(({ proc, minaccia, val, ri, rr }) => ({
    'Processo': proc.nome,
    'Unità Org.': proc.unitaOrganizzativa || '',
    'Minaccia': minaccia.label,
    'Categoria': minaccia.cat,
    'Verosimiglianza': val?.verosimiglianza || 0,
    'Conseguenze': calcolaConseguenze(proc, minaccia),
    'Rischio Inerente': ri,
    'Rischio Inerente Livello': rLabel(ri),
    'Rischio Residuo': rr,
    'Rischio Residuo Livello': rrLabel(rr),
    'Azione': val?.azione || '',
    'Responsabile': val?.responsabile || '',
    'Scadenza': val?.scadenza || '',
    'Note': val?.note || '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Piano Trattamento NIS2');
  XLSX.writeFile(wb, 'nis2_piano_trattamento_rischio.xlsx');
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NIS2RiskVERA({ riskData, onSave, assets, misure }) {
  const [activeTab, setActiveTab] = useState('processi');

  const data = riskData || { processi: [], valutazioni: {} };
  const processi = data.processi || [];
  const valutazioni = data.valutazioni || {};

  const saveProcessi = newProcessi => {
    onSave({ ...data, processi: newProcessi });
  };

  const updateVal = (procId, minacciaId, field, value) => {
    const k = vKey(procId, minacciaId);
    const updated = {
      ...data,
      valutazioni: {
        ...valutazioni,
        [k]: { ...(valutazioni[k] || {}), [field]: value }
      }
    };
    onSave(updated);
  };

  const TABS = [
    { id:'processi',    icon:'🏭', label:'Processi Critici', badge: processi.length || null },
    { id:'valutazione', icon:'⚠️', label:'Valutazione Rischi' },
    { id:'trattamento', icon:'📋', label:'Piano di Trattamento' },
  ];

  // Global risk count for badge
  const riskiAlti = useMemo(() => {
    let n = 0;
    processi.forEach(p => {
      MINACCE.forEach(m => {
        const val = valutazioni[vKey(p.id, m.id)];
        const v = val?.verosimiglianza || 0;
        if (v === 0) return;
        const rr = rischioResiduo(p, m, v, val?.misureIds, misure, val?.valoreControlloAtteso);
        if (rr > 12) n++;
      });
    });
    return n;
  }, [processi, valutazioni, misure]);

  return (
    <div>
      {/* Info header */}
      <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#0c4a6e', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>📐 Modello VERA 8 (Cesare Gallotti)</span>
        <span>Rischio inerente = C × V · Rischio residuo = C × V × vlb (max 48) · vlb = 5 − efficacia_controllo</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[['≤12','Basso','#16a34a'],['13-24','Medio','#d97706'],['25-36','Alto','#ea580c'],['>36','Critico','#dc2626']].map(([r,l,c])=>(
            <span key={r} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: c+'22', color: c }}>{r} {l}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: '8px 4px', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12,
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? '#0891b2' : '#64748b',
              boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {t.icon} {t.label}
            {t.id === 'processi' && processi.length > 0 && (
              <span style={{ marginLeft: 4, background: '#0891b222', color: '#0891b2', borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>
                {processi.length}
              </span>
            )}
            {t.id === 'trattamento' && riskiAlti > 0 && (
              <span style={{ marginLeft: 4, background: '#dc262622', color: '#dc2626', borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>
                {riskiAlti}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'processi' && (
        <ProcessiTab processi={processi} assets={assets} onSave={saveProcessi} />
      )}
      {activeTab === 'valutazione' && (
        <ValutazioneTab processi={processi} valutazioni={valutazioni} allMisure={misure} onUpdateVal={updateVal} />
      )}
      {activeTab === 'trattamento' && (
        <TrattamentoTab processi={processi} valutazioni={valutazioni} allMisure={misure} onUpdateVal={updateVal} />
      )}
    </div>
  );
}
