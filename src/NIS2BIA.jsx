import { useState } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import * as XLSX from 'xlsx';
import { AICtx, useAIRecord } from './AIContext';

// ─── Costanti ─────────────────────────────────────────────────────────────────

const FASCE_TEMPORALI = [
  { id: '1h',    label: '1 ora' },
  { id: '4h',    label: '4 ore' },
  { id: '8h',    label: '8 ore' },
  { id: '24h',   label: '1 giorno' },
  { id: '72h',   label: '3 giorni' },
  { id: '1sett', label: '1 settimana' },
];

const ASSI_IMPATTO = [
  { id: 'operativo',     label: 'Operativo',      icon: '⚙️',  desc: 'Interruzione attività core, SLA, contratti' },
  { id: 'finanziario',   label: 'Finanziario',    icon: '💰',  desc: 'Perdite economiche dirette e indirette' },
  { id: 'reputazionale', label: 'Reputazionale',  icon: '📣',  desc: 'Danno di immagine e fiducia dei clienti' },
  { id: 'normativo',     label: 'Normativo/Leg.', icon: '⚖️',  desc: 'Sanzioni, violazioni contrattuali, NIS2/GDPR' },
];

const IMP_LABELS = ['', 'Trascurabile', 'Limitato', 'Significativo', 'Grave'];
const IMP_COLORS = ['', '#16a34a', '#d97706', '#ea580c', '#dc2626'];

const CATEGORIE_PROC = [
  'Servizi digitali core', 'Infrastruttura IT', 'Gestione dati clienti',
  'Finanza e pagamenti', 'Risorse umane', 'Produzione / Operazioni',
  'Logistica e supply chain', 'Comunicazione e marketing', 'Compliance e sicurezza', 'Altro',
];

const RTO_OPTIONS = ['< 1 ora', '1-4 ore', '4-8 ore', '8-24 ore', '1-3 giorni', '> 3 giorni'];
const RPO_OPTIONS = ['Nessuna perdita (0)', '< 1 ora', '1-4 ore', '4-8 ore', '8-24 ore', '> 1 giorno'];
const PRIORITA_OPTIONS = ['Critica', 'Alta', 'Media', 'Bassa'];
const PRIORITA_COLORS = { 'Critica': '#dc2626', 'Alta': '#ea580c', 'Media': '#d97706', 'Bassa': '#16a34a' };

// Calcola lo score BIA: max(impatti su tutte le fasce) × peso priorità
function calcolaScoreBIA(proc) {
  const impatti = proc.impatti || {};
  let maxImp = 0;
  FASCE_TEMPORALI.forEach(f => {
    const fi = impatti[f.id] || {};
    ASSI_IMPATTO.forEach(a => {
      const v = fi[a.id] || 0;
      if (v > maxImp) maxImp = v;
    });
  });
  return maxImp;
}

function scoreColor(s) {
  return s <= 1 ? '#16a34a' : s <= 2 ? '#d97706' : s <= 3 ? '#ea580c' : '#dc2626';
}
function scoreLabel(s) {
  return s <= 1 ? 'Basso' : s <= 2 ? 'Medio' : s <= 3 ? 'Alto' : 'Critico';
}

// ─── Heatmap impatti ──────────────────────────────────────────────────────────

function ImpactHeatmap({ impatti }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520, fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '2px solid #e5eaf0' }}>
              Asse impatto
            </th>
            {FASCE_TEMPORALI.map(f => (
              <th key={f.id} style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11, borderBottom: '2px solid #e5eaf0', whiteSpace: 'nowrap' }}>
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ASSI_IMPATTO.map(a => (
            <tr key={a.id}>
              <td style={{ padding: '7px 10px', fontWeight: 600, color: '#374151', fontSize: 12, borderBottom: '1px solid #f1f5f9' }}>
                {a.icon} {a.label}
              </td>
              {FASCE_TEMPORALI.map(f => {
                const v = impatti?.[f.id]?.[a.id] || 0;
                return (
                  <td key={f.id} style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    {v > 0 ? (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 28, borderRadius: 6,
                        background: IMP_COLORS[v] + '22', color: IMP_COLORS[v],
                        fontWeight: 800, fontSize: 13,
                      }}>
                        {v}
                      </div>
                    ) : (
                      <div style={{ color: '#d1d5db', fontSize: 11 }}>—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Processo BIA Form ────────────────────────────────────────────────────────

function ProcessoBIAForm({ initial, assets, onSave, onCancel }) {
  const emptyImpatti = {};
  FASCE_TEMPORALI.forEach(f => {
    emptyImpatti[f.id] = {};
    ASSI_IMPATTO.forEach(a => { emptyImpatti[f.id][a.id] = 0; });
  });

  const [f, setF] = useState(initial || {
    nome: '', unitaOrganizzativa: '', responsabile: '', categoria: '',
    rto: '', rpo: '', mtpd: '', priorita: 'Media',
    assetIds: [], fornitori: '', personaleChiave: '',
    impatti: emptyImpatti,
    strategiaRecupero: '', note: '',
  });

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const aiCtx = useAIRecord({ recordName: f.nome, sectionLabel: 'NIS2 — Business Impact Analysis' });
  const setImpatto = (fascia, asse, val) => setF(p => ({
    ...p,
    impatti: { ...p.impatti, [fascia]: { ...(p.impatti?.[fascia] || {}), [asse]: val } }
  }));
  const toggleAsset = id => {
    const ids = f.assetIds || [];
    setF(p => ({ ...p, assetIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] }));
  };

  const [activeSection, setActiveSection] = useState('base');
  const sections = [
    { id: 'base',       label: '📋 Anagrafica' },
    { id: 'recovery',   label: '⏱️ Recovery' },
    { id: 'dipendenze', label: '🔗 Dipendenze' },
    { id: 'impatti',    label: '📊 Impatti' },
  ];

  return (
    <AICtx.Provider value={aiCtx}>
    <Modal onClose={onCancel} maxWidth={700}>
      <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>
        {initial ? '✏️ Modifica processo' : '➕ Nuovo processo BIA'}
      </h3>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{
              flex: 1, padding: '6px 4px', border: 'none', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 11,
              background: activeSection === s.id ? '#fff' : 'transparent',
              color: activeSection === s.id ? '#0891b2' : '#64748b',
              boxShadow: activeSection === s.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Anagrafica */}
      {activeSection === 'base' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Fld id='nome' label='Nome processo *' val={f.nome} onChange={u} ph='es. Erogazione servizio web, Gestione ordini...' />
            </div>
            <Fld id='unitaOrganizzativa' label='Unità organizzativa' val={f.unitaOrganizzativa} onChange={u} ph='es. IT, Operations, Amministrazione...' />
            <Fld id='responsabile' label='Responsabile processo' val={f.responsabile} onChange={u} ph='es. Mario Rossi' />
            <Fld id='categoria' label='Categoria' options={CATEGORIE_PROC} val={f.categoria} onChange={u} />
            <Fld id='priorita' label='Priorità' options={PRIORITA_OPTIONS} val={f.priorita} onChange={u} />
          </div>
          <Fld id='note' label='Descrizione / Note' type='textarea' val={f.note} onChange={u} ph="Breve descrizione del processo e del suo ruolo nell'organizzazione..." />
        </div>
      )}

      {/* Recovery */}
      {activeSection === 'recovery' && (
        <div>
          <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #bae6fd' }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#0369a1', marginBottom: 10 }}>
              ℹ️ Definizioni obiettivi di recovery
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { t: 'RTO', d: 'Recovery Time Objective — max tempo tollerato di indisponibilità del processo' },
                { t: 'RPO', d: 'Recovery Point Objective — max perdita di dati tollerata (quanto indietro possiamo tornare)' },
                { t: 'MTPD', d: 'Max Tolerable Period of Disruption — limite massimo assoluto prima di conseguenze irreversibili' },
              ].map(x => (
                <div key={x.t} style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0369a1' }}>{x.t}:</strong> {x.d}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Fld id='rto' label='RTO *' options={RTO_OPTIONS} val={f.rto} onChange={u} />
            <Fld id='rpo' label='RPO *' options={RPO_OPTIONS} val={f.rpo} onChange={u} />
            <Fld id='mtpd' label='MTPD (testo libero)' val={f.mtpd} onChange={u} ph='es. Max 3 giorni' />
          </div>
          <Fld id='strategiaRecupero' label='Strategia di recupero / misure BCP' type='textarea' val={f.strategiaRecupero} onChange={u} ph='es. Failover su sito secondario, attivazione DRP, rerouting su provider alternativo...' />
        </div>
      )}

      {/* Dipendenze */}
      {activeSection === 'dipendenze' && (
        <div>
          {assets.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={C.lbl}>Asset critici collegati</label>
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
          <Fld id='personaleChiave' label='Personale chiave (ruoli critici)' type='textarea' val={f.personaleChiave} onChange={u} ph='es. System administrator, DBA, Network engineer — min 2 figure per ruolo...' />
          <Fld id='fornitori' label='Fornitori / sistemi esterni critici' type='textarea' val={f.fornitori} onChange={u} ph='es. AWS (hosting), Stripe (pagamenti), Telecom Italia (connettività)...' />
        </div>
      )}

      {/* Impatti per fascia temporale */}
      {activeSection === 'impatti' && (
        <div>
          <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fefce8', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, color: '#78350f' }}>
            Valuta l'impatto del processo <strong>per ogni fascia temporale di indisponibilità</strong>.<br />
            Scala: <strong>0</strong> = nessun impatto · <strong>1</strong> = Trascurabile · <strong>2</strong> = Limitato · <strong>3</strong> = Significativo · <strong>4</strong> = Grave
          </div>
          {FASCE_TEMPORALI.map(ft => (
            <div key={ft.id} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#0891b2', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0891b2' }} />
                Indisponibilità: {ft.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {ASSI_IMPATTO.map(a => {
                  const val = f.impatti?.[ft.id]?.[a.id] || 0;
                  return (
                    <div key={a.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        {a.icon} {a.label}
                      </div>
                      <input type='range' min={0} max={4} step={1} value={val}
                        onChange={e => setImpatto(ft.id, a.id, parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: val > 0 ? IMP_COLORS[val] : '#94a3b8' }} />
                      <div style={{ fontSize: 11, textAlign: 'center', fontWeight: 700, color: val > 0 ? IMP_COLORS[val] : '#94a3b8', marginTop: 2 }}>
                        {val === 0 ? 'N/A' : `${val} — ${IMP_LABELS[val]}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...C.row, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
        <button style={C.btn()} onClick={() => {
          if (!f.nome.trim()) { alert('Inserisci il nome del processo'); return; }
          onSave({ ...f, id: initial?.id || Date.now().toString() });
        }}>💾 Salva</button>
        <button style={C.btn('#f1f5f9', '#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </Modal>
    </AICtx.Provider>
  );
}

// ─── Dashboard BIA ─────────────────────────────────────────────────────────────

function BIADashboard({ processi }) {
  if (!processi.length) return null;

  const critici = processi.filter(p => calcolaScoreBIA(p) >= 4).length;
  const alti    = processi.filter(p => { const s = calcolaScoreBIA(p); return s === 3; }).length;
  const medi    = processi.filter(p => { const s = calcolaScoreBIA(p); return s === 2; }).length;

  // RTO distribution
  const rtoDist = {};
  processi.forEach(p => { if (p.rto) { rtoDist[p.rto] = (rtoDist[p.rto] || 0) + 1; } });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
      {[
        { label: 'Processi analizzati', value: processi.length, color: '#0891b2', bg: '#ecfeff' },
        { label: 'Impatto Critico', value: critici, color: '#dc2626', bg: '#fef2f2' },
        { label: 'Impatto Alto', value: alti, color: '#ea580c', bg: '#fff7ed' },
        { label: 'Impatto Medio/Basso', value: medi + (processi.length - critici - alti - medi), color: '#16a34a', bg: '#f0fdf4' },
      ].map(s => (
        <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}22` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Export Excel ──────────────────────────────────────────────────────────────

function exportBIA(processi, assets) {
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a.nome]));
  const rows = [];
  processi.forEach(p => {
    const row = {
      'Processo': p.nome,
      'Categoria': p.categoria || '',
      'Unità Org.': p.unitaOrganizzativa || '',
      'Responsabile': p.responsabile || '',
      'Priorità': p.priorita || '',
      'RTO': p.rto || '',
      'RPO': p.rpo || '',
      'MTPD': p.mtpd || '',
      'Asset': (p.assetIds || []).map(id => assetMap[id] || id).join(', '),
      'Score impatto': calcolaScoreBIA(p),
      'Livello BIA': scoreLabel(calcolaScoreBIA(p)),
    };
    FASCE_TEMPORALI.forEach(ft => {
      ASSI_IMPATTO.forEach(a => {
        row[`${ft.label} — ${a.label}`] = p.impatti?.[ft.id]?.[a.id] || 0;
      });
    });
    row['Strategia recupero'] = p.strategiaRecupero || '';
    rows.push(row);
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BIA');
  XLSX.writeFile(wb, 'nia2_bia.xlsx');
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function NIS2BIA({ biaData, onSave, assets }) {
  const processi = biaData?.processi || [];

  const [showForm, setShowForm]   = useState(false);
  const [editProc, setEditProc]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterPrio, setFilterPrio] = useState('');

  const saveProcessi = arr => onSave({ ...(biaData || {}), processi: arr });

  const handleSave = p => {
    const updated = editProc
      ? processi.map(x => x.id === p.id ? p : x)
      : [...processi, p];
    saveProcessi(updated);
    setShowForm(false); setEditProc(null);
  };

  const handleDelete = id => saveProcessi(processi.filter(p => p.id !== id));

  const filtered = filterPrio ? processi.filter(p => p.priorita === filterPrio) : processi;

  // Sort by score descending
  const sorted = [...filtered].sort((a, b) => calcolaScoreBIA(b) - calcolaScoreBIA(a));

  return (
    <div>
      {(showForm || editProc) && (
        <ProcessoBIAForm
          initial={editProc}
          assets={assets}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditProc(null); }}
        />
      )}

      {/* Header */}
      <div style={{ ...C.row, justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <SectionTitle>📊 Business Impact Analysis (BIA)</SectionTitle>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Analisi dell'impatto operativo, finanziario e normativo dell'interruzione dei processi critici — ISO 22301 / NIS2 Art.21.2.c
          </div>
        </div>
        <div style={C.row}>
          {processi.length > 0 && (
            <button style={C.btn('#16a34a', '#fff', true)} onClick={() => exportBIA(processi, assets)}>
              📥 Export Excel
            </button>
          )}
          <button style={C.btn('#0891b2', '#fff', true)} onClick={() => { setEditProc(null); setShowForm(true); }}>
            + Aggiungi processo
          </button>
        </div>
      </div>

      {processi.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Nessun processo analizzato"
          sub="Aggiungi i processi critici per condurre la Business Impact Analysis."
        />
      ) : (
        <>
          <BIADashboard processi={processi} />

          {/* Filtri */}
          <div style={{ ...C.row, marginBottom: 14, gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Filtra per priorità:</span>
            {['', ...PRIORITA_OPTIONS].map(p => (
              <button key={p} onClick={() => setFilterPrio(p)}
                style={{
                  ...C.btn(filterPrio === p ? (PRIORITA_COLORS[p] || '#0891b2') : '#f1f5f9',
                           filterPrio === p ? '#fff' : '#374151', true),
                  borderRadius: 16,
                }}>
                {p || 'Tutti'}
              </button>
            ))}
          </div>

          {/* Lista processi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map(proc => {
              const score  = calcolaScoreBIA(proc);
              const isOpen = expandedId === proc.id;
              const assetNomi = (proc.assetIds || []).map(id => assets.find(a => a.id === id)?.nome).filter(Boolean);

              return (
                <div key={proc.id} style={{
                  ...C.card, padding: 0, overflow: 'hidden',
                  borderLeft: `4px solid ${scoreColor(score)}`,
                }}>
                  {/* Header riga */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedId(isOpen ? null : proc.id)}>

                    {/* Score badge */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: scoreColor(score),
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: '#fff',
                    }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>{score}</span>
                      <span style={{ fontSize: 8, fontWeight: 600, opacity: .85 }}>{scoreLabel(score)}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{proc.nome}</span>
                        {proc.priorita && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: PRIORITA_COLORS[proc.priorita] + '18',
                            color: PRIORITA_COLORS[proc.priorita],
                          }}>{proc.priorita}</span>
                        )}
                        {proc.categoria && (
                          <span style={{ fontSize: 11, color: '#64748b' }}>{proc.categoria}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                        {proc.unitaOrganizzativa && <span style={{ fontSize: 11, color: '#94a3b8' }}>🏢 {proc.unitaOrganizzativa}</span>}
                        {proc.responsabile && <span style={{ fontSize: 11, color: '#94a3b8' }}>👤 {proc.responsabile}</span>}
                        {proc.rto && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>RTO: {proc.rto}</span>}
                        {proc.rpo && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>RPO: {proc.rpo}</span>}
                        {proc.mtpd && <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>MTPD: {proc.mtpd}</span>}
                      </div>
                      {assetNomi.length > 0 && (
                        <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {assetNomi.map(n => (
                            <span key={n} style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{n}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ ...C.row, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => { setEditProc(proc); setShowForm(true); }}>✏️</button>
                      {confirmDel === proc.id
                        ? <>
                            <button style={C.btn('#dc2626', '#fff', true)} onClick={() => { handleDelete(proc.id); setConfirmDel(null); }}>Conferma</button>
                            <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => setConfirmDel(null)}>✕</button>
                          </>
                        : <button style={C.btn('#fff5f5', '#dc2626', true)} onClick={() => setConfirmDel(proc.id)}>🗑️</button>
                      }
                      <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => setExpandedId(isOpen ? null : proc.id)}>
                        {isOpen ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Dettaglio espanso */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', background: '#fafcff' }}>

                      {/* Heatmap */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>
                          Mappa degli impatti nel tempo
                        </div>
                        <ImpactHeatmap impatti={proc.impatti} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {IMP_LABELS.slice(1).map((l, i) => (
                            <span key={l} style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: IMP_COLORS[i + 1] + '18', color: IMP_COLORS[i + 1] }}>
                              {i + 1} — {l}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recovery info */}
                      {proc.strategiaRecupero && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 4 }}>🛡️ Strategia di recupero</div>
                          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                            {proc.strategiaRecupero}
                          </div>
                        </div>
                      )}

                      {/* Dipendenze */}
                      {(proc.personaleChiave || proc.fornitori) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          {proc.personaleChiave && (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 4 }}>👥 Personale chiave</div>
                              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{proc.personaleChiave}</div>
                            </div>
                          )}
                          {proc.fornitori && (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 4 }}>🏭 Fornitori critici</div>
                              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{proc.fornitori}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {proc.note && (
                        <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>📝 {proc.note}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
