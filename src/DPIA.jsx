import { useState, useMemo } from 'react';
import { C, Fld, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import { TrattamentoSelector } from './AnalisiRischi';

const STATI = ['Bozza', 'Approvata', 'Da rivedere'];
const STATO_COLOR = { Bozza: '#d97706', Approvata: '#16a34a', 'Da rivedere': '#dc2626' };

const CRITERI_PRESCREENING = [
  { id: 'valutazioneSistematica', label: 'Valutazione o scoring sistematico (profilazione)', desc: "Incluso il profiling e la previsione (es. solvibilità, salute, affidabilità lavorativa)" },
  { id: 'decisioneAutomatizzata', label: 'Decisione automatizzata con effetti giuridici significativi', desc: "Art.22 — decisioni che producono effetti legali o incidono significativamente sull'interessato" },
  { id: 'monitoraggioSistematico', label: 'Monitoraggio sistematico', desc: "Sorveglianza o tracciamento di persone nello spazio pubblico o online" },
  { id: 'datiParticolari', label: 'Dati sensibili o di natura molto personale', desc: "Dati particolari Art.9, penali Art.10, dati di localizzazione, comunicazioni private, dati finanziari" },
  { id: 'largaScala', label: 'Trattamento a larga scala', desc: "Grande numero di interessati, vasto territorio geografico, lungo periodo, ampiezza o portata del trattamento" },
  { id: 'abbinamentoDati', label: 'Abbinamento o combinazione di dataset', desc: "Dati provenienti da fonti diverse, o trattamenti per finalità diverse che si combinano incrociando le informazioni" },
  { id: 'soggettiVulnerabili', label: 'Dati relativi a soggetti vulnerabili', desc: "Minori, dipendenti, pazienti, anziani, richiedenti asilo, soggetti che non possono liberamente opporsi" },
  { id: 'nuovaTecnologia', label: 'Uso innovativo o applicazione di nuove soluzioni tecnologiche/organizzative', desc: "IoT, IA, riconoscimento facciale, geolocalizzazione, tecnologia blockchain, app mobile con sensori" },
  { id: 'impedimentoDiritti', label: "Il trattamento impedisce l'esercizio di un diritto o di fruire di un servizio/contratto", desc: "Incluso valutazione del merito creditizio, screening assicurativo, accesso a strutture pubbliche" },
];

const RISK_TYPES = [
  { id: 'accessoIllecito', label: 'Accesso illecito ai dati', icon: '🔓', color: '#dc2626', desc: 'Accesso non autorizzato, violazione della riservatezza, furto, intercettazione' },
  { id: 'modificaIndesiderata', label: 'Modifica indesiderata dei dati', icon: '✏️', color: '#d97706', desc: "Alterazione, corruzione, manipolazione o distruzione non autorizzata dei dati" },
  { id: 'sparizioneDati', label: 'Sparizione dei dati', icon: '🗑️', color: '#7c3aed', desc: 'Perdita, cancellazione accidentale, indisponibilità o inaccessibilità permanente dei dati' },
];

const PROBABILITA_LABELS = ['', 'Trascurabile', 'Limitata', 'Significativa', 'Massima'];
const GRAVITA_LABELS = ['', 'Trascurabile', 'Limitata', 'Significativa', 'Massima'];

const livelloRischio = (p, g) => {
  const v = p * g;
  if (v <= 2) return { label: 'Basso', color: '#16a34a' };
  if (v <= 4) return { label: 'Medio', color: '#d97706' };
  if (v <= 9) return { label: 'Alto', color: '#ea580c' };
  return { label: 'Molto alto', color: '#dc2626' };
};

const DPIA_TABS = [
  { id: 'prescreening', icon: '📋', label: 'Pre-screening' },
  { id: 'descrizione', icon: '📝', label: 'Descrizione sistematica' },
  { id: 'necessita', icon: '⚖️', label: 'Necessità e proporzionalità' },
  { id: 'rischi', icon: '⚠️', label: 'Valutazione rischi' },
  { id: 'misure', icon: '🛡️', label: 'Misure adottate' },
  { id: 'dpo', icon: '👤', label: 'DPO (Art.35.2)' },
  { id: 'interessati', icon: '👥', label: 'Interessati (Art.35.9)' },
  { id: 'autorita', icon: '🏛️', label: 'Autorità (Art.36.1)' },
  { id: 'stato', icon: '✅', label: 'Stato e revisione' },
];

const EMPTY = {
  prescreening: { criteri: {}, note: '' },
  descrizione: { natura: '', ambito: '', contesto: '', finalita: '', datiPersonali: '', categorieDati: '', destinatari: '', retention: '', asset: '', codiciCondotta: '' },
  necessita: { finalitaLecita: '', baseGiuridica: '', minimizzazione: '', limitazioneConservazione: '', diritti: { informazione: '', accesso: '', portabilita: '', rettificaCancellazione: '', opposizioneRestrizione: '' }, responsabiliArt28: '', trasfInternazionali: '' },
  riskTypes: {
    accessoIllecito: { fonti: '', impatti: '', minacce: '', probabilita: 2, gravita: 2, misureIds: [], note: '' },
    modificaIndesiderata: { fonti: '', impatti: '', minacce: '', probabilita: 2, gravita: 2, misureIds: [], note: '' },
    sparizioneDati: { fonti: '', impatti: '', minacce: '', probabilita: 2, gravita: 2, misureIds: [], note: '' },
  },
  misureIds: [],
  misureNote: '',
  dpoConsultato: false, dpoData: '', dpoParere: '', dpoNote: '',
  interessatiConsultati: false, interessatiModalita: '', interessatiGiustificazione: '',
  rischioResiduoAlto: false, autoritaConsultata: false, autoritaData: '', autoritaEsito: '',
  stato: 'Bozza', dataApprovazione: '', dataRevisione: '', approvato: '', note: '',
};

// ─── Pre-screening ───────────────────────────────────────────────────────────
function PrescreeningTab({ f, u }) {
  const criteri = f.prescreening?.criteri || {};
  const score = CRITERI_PRESCREENING.filter(c => criteri[c.id]).length;
  const verdict = score >= 2
    ? { label: 'DPIA obbligatoria', color: '#dc2626', bg: '#fef2f2', icon: '⚠️' }
    : score === 1
      ? { label: 'Valutare caso per caso', color: '#d97706', bg: '#fffbeb', icon: '🔍' }
      : { label: 'DPIA probabilmente non necessaria', color: '#16a34a', bg: '#f0fdf4', icon: '✅' };

  const toggle = id => {
    const updated = { ...criteri, [id]: !criteri[id] };
    u('prescreening', { ...f.prescreening, criteri: updated });
  };

  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: verdict.bg, border: `1px solid ${verdict.color}44` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>{verdict.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: verdict.color }}>{verdict.label}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {score} / {CRITERI_PRESCREENING.length} criteri soddisfatti — WP248 rev.01 / criteri obbligatori Garante italiano
            </div>
          </div>
        </div>
      </div>
      <div style={{ ...C.card, marginBottom: 16 }}>
        <SectionTitle>9 criteri per la necessità della DPIA (WP248 rev.01)</SectionTitle>
        {CRITERI_PRESCREENING.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <input type='checkbox' checked={!!criteri[c.id]} onChange={() => toggle(c.id)}
              style={{ width: 16, height: 16, accentColor: ACCENT, marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: criteri[c.id] ? '#0f172a' : '#374151' }}>{c.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={C.card}>
        <SectionTitle>Note e documentazione del pre-screening</SectionTitle>
        <Fld id='note' label='Note sul pre-screening' type='textarea' val={f.prescreening?.note || ''}
          onChange={(_, v) => u('prescreening', { ...f.prescreening, note: v })}
          ph="Documentare la valutazione effettuata, le motivazioni della decisione, eventuali consultazioni preliminari..." />
      </div>
    </div>
  );
}

// ─── Descrizione sistematica ──────────────────────────────────────────────────
function DescrizioneTab({ f, u }) {
  const d = f.descrizione || {};
  const upd = (k, v) => u('descrizione', { ...d, [k]: v });
  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Art.35.7.a GDPR</strong> — Una descrizione sistematica dei trattamenti previsti e delle finalità del trattamento, compreso, ove applicabile, l'interesse legittimo perseguito dal titolare del trattamento.
        </div>
      </div>
      <div style={C.card}>
        <SectionTitle>Descrizione sistematica del trattamento (Art.35.7.a)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Fld id='natura' label='Natura del trattamento' type='textarea' val={d.natura} onChange={upd}
            ph="Raccolta, registrazione, organizzazione, strutturazione, conservazione, adattamento, modifica, estrazione, consultazione, uso, comunicazione, cancellazione..." />
          <Fld id='ambito' label='Ambito del trattamento' type='textarea' val={d.ambito} onChange={upd}
            ph="Numero di interessati coinvolti, durata del trattamento, frequenza, ampiezza geografica, categorie di soggetti interessati..." />
          <Fld id='contesto' label='Contesto del trattamento' type='textarea' val={d.contesto} onChange={upd}
            ph="Rapporto tra titolare e interessati, settore operativo, rilevanza sociale del trattamento, entità del titolare..." />
          <Fld id='finalita' label='Finalità del trattamento' type='textarea' val={d.finalita} onChange={upd}
            ph="Scopi specifici, espliciti e legittimi per cui i dati sono trattati (art.5.1.b)..." />
          <Fld id='datiPersonali' label='Dati personali trattati' type='textarea' val={d.datiPersonali} onChange={upd}
            ph="Tipologie di dati: identificativi, anagrafe, contatti, comportamentali, preferenze, dati tecnici..." />
          <Fld id='categorieDati' label='Categorie particolari di dati (Art.9/10)' type='textarea' val={d.categorieDati} onChange={upd}
            ph="Dati sanitari, biometrici, genetici, origine razziale, orientamento sessuale, opinioni politiche, dati giudiziari (se presenti)..." />
          <Fld id='destinatari' label='Destinatari e categorie di destinatari' type='textarea' val={d.destinatari} onChange={upd}
            ph="Soggetti interni autorizzati, responsabili del trattamento nominati ex Art.28, terzi destinatari, autorità pubbliche..." />
          <Fld id='retention' label='Periodo e criteri di conservazione' type='textarea' val={d.retention} onChange={upd}
            ph="Durata della conservazione e criteri utilizzati per la determinazione, termini di cancellazione, politiche di archiviazione..." />
          <div style={{ gridColumn: '1/-1' }}>
            <Fld id='asset' label='Asset su cui poggiano i dati' type='textarea' val={d.asset} onChange={upd}
              ph="Sistemi informativi, banche dati, hardware, software gestionali, infrastrutture cloud, dispositivi mobili, fornitori di servizi IT..." />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Fld id='codiciCondotta' label='Codici di condotta, certificazioni e misure preesistenti' type='textarea' val={d.codiciCondotta} onChange={upd}
              ph="Indicare eventuali codici di condotta approvati (Art.40), certificazioni (Art.42), standard ISO 27001, misure tecniche/organizzative già in atto prima della DPIA..." />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Necessità e proporzionalità ─────────────────────────────────────────────
function NecessitaTab({ f, u }) {
  const n = f.necessita || {};
  const upd = (k, v) => u('necessita', { ...n, [k]: v });
  const d = n.diritti || {};
  const updD = (k, v) => u('necessita', { ...n, diritti: { ...d, [k]: v } });
  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Art.35.7.b GDPR</strong> — Una valutazione della necessità e proporzionalità dei trattamenti in relazione alle finalità.
        </div>
      </div>
      <div style={{ ...C.card, marginBottom: 16 }}>
        <SectionTitle>Finalità e base giuridica (Art.5.1.b, Art.6)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Fld id='finalitaLecita' label='Finalità lecita, determinata ed esplicita' type='textarea' val={n.finalitaLecita} onChange={upd}
            ph="Perché la finalità è lecita? È specificata ed esplicita fin dalla raccolta? Non si verificherà un uso incompatibile..." />
          <Fld id='baseGiuridica' label='Base giuridica (Art.6 GDPR)' type='textarea' val={n.baseGiuridica} onChange={upd}
            ph="Identificare e giustificare la base giuridica applicabile (consenso, contratto, obbligo legale, interesse legittimo, ecc.)..." />
        </div>
      </div>
      <div style={{ ...C.card, marginBottom: 16 }}>
        <SectionTitle>Minimizzazione e limitazione della conservazione (Art.5.1.c/e)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Fld id='minimizzazione' label='Minimizzazione dei dati (Art.5.1.c)' type='textarea' val={n.minimizzazione} onChange={upd}
            ph="I dati sono adeguati, pertinenti e limitati a quanto necessario? Non si raccolgono più dati del necessario..." />
          <Fld id='limitazioneConservazione' label='Limitazione della conservazione (Art.5.1.e)' type='textarea' val={n.limitazioneConservazione} onChange={upd}
            ph="I dati sono conservati in forma identificabile non più del tempo necessario? Esiste una procedura di cancellazione?" />
        </div>
      </div>
      <div style={{ ...C.card, marginBottom: 16 }}>
        <SectionTitle>Diritti degli interessati (Art.12–21)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Fld id='informazione' label='Diritto di informazione (Art.12–14)' type='textarea' val={d.informazione} onChange={updD}
            ph="Come viene fornita l'informativa? Modalità, tempi, linguaggio chiaro, informazioni obbligatorie..." />
          <Fld id='accesso' label='Diritto di accesso (Art.15)' type='textarea' val={d.accesso} onChange={updD}
            ph="Come può l'interessato accedere ai propri dati? Procedure, tempi di risposta, formato..." />
          <Fld id='portabilita' label='Diritto alla portabilità (Art.20)' type='textarea' val={d.portabilita} onChange={updD}
            ph="La portabilità è applicabile (base: consenso o contratto)? Come viene garantita tecnicamente?" />
          <Fld id='rettificaCancellazione' label='Rettifica, cancellazione e oblio (Art.16–17–19)' type='textarea' val={d.rettificaCancellazione} onChange={updD}
            ph="Procedure per rettifica e cancellazione, gestione del diritto all'oblio, notifica a terzi destinatari..." />
          <div style={{ gridColumn: '1/-1' }}>
            <Fld id='opposizioneRestrizione' label='Opposizione e limitazione del trattamento (Art.18–19–21)' type='textarea' val={d.opposizioneRestrizione} onChange={updD}
              ph="Come vengono gestite le richieste di opposizione e di limitazione? Effetti sulla catena di trattamento..." />
          </div>
        </div>
      </div>
      <div style={C.card}>
        <SectionTitle>Responsabili del trattamento e trasferimenti internazionali</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Fld id='responsabiliArt28' label='Responsabili del trattamento (Art.28)' type='textarea' val={n.responsabiliArt28} onChange={upd}
            ph="Elenco dei responsabili nominati, garanzie contrattuali offerte, clausole standard, controllo sulle attività..." />
          <Fld id='trasfInternazionali' label='Trasferimenti verso paesi terzi o organizzazioni internazionali' type='textarea' val={n.trasfInternazionali} onChange={upd}
            ph="Destinazioni, base giuridica del trasferimento (Art.45-46-49), garanzie adeguate, clausole contrattuali tipo, BCR..." />
        </div>
      </div>
    </div>
  );
}

// ─── Risk Type Panel ──────────────────────────────────────────────────────────
function RiskTypePanel({ rt, data, onUpdate, misure }) {
  const d = data || { fonti: '', impatti: '', minacce: '', probabilita: 2, gravita: 2, misureIds: [], note: '' };
  const upd = (k, v) => onUpdate({ ...d, [k]: v });
  const livello = livelloRischio(d.probabilita, d.gravita);
  const toggleMisura = id => {
    const ids = d.misureIds || [];
    upd('misureIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  return (
    <div style={{ ...C.card, marginBottom: 16, borderLeft: `4px solid ${rt.color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{rt.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{rt.label}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{rt.desc}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatusBadge label={livello.label} color={livello.color} />
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>P:{d.probabilita} × G:{d.gravita} = {d.probabilita * d.gravita}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Fld id='fonti' label='Fonti del rischio' type='textarea' val={d.fonti}
          onChange={(_, v) => upd('fonti', v)}
          ph="Attori interni/esterni, errori umani, incidenti tecnici, accessi non autorizzati, attacchi deliberati, calamità naturali..." />
        <Fld id='impatti' label='Impatti potenziali sugli interessati' type='textarea' val={d.impatti}
          onChange={(_, v) => upd('impatti', v)}
          ph="Danni fisici, materiali, immateriali: discriminazione, perdita economica, danni reputazionali, perdita di controllo sui propri dati..." />
        <div style={{ gridColumn: '1/-1' }}>
          <Fld id='minacce' label='Minacce e vulnerabilità identificate' type='textarea' val={d.minacce}
            onChange={(_, v) => upd('minacce', v)}
            ph="Minacce specifiche (es. SQL injection, phishing, perdita dispositivo) e vulnerabilità del sistema di trattamento..." />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Probabilità: <span style={{ color: rt.color }}>{PROBABILITA_LABELS[d.probabilita]}</span>
          </div>
          <input type='range' min={1} max={4} value={d.probabilita}
            onChange={e => upd('probabilita', +e.target.value)}
            style={{ width: '100%', accentColor: rt.color }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
            <span>1 - Trascurabile</span><span>4 - Massima</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Gravità: <span style={{ color: rt.color }}>{GRAVITA_LABELS[d.gravita]}</span>
          </div>
          <input type='range' min={1} max={4} value={d.gravita}
            onChange={e => upd('gravita', +e.target.value)}
            style={{ width: '100%', accentColor: rt.color }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
            <span>1 - Trascurabile</span><span>4 - Massima</span>
          </div>
        </div>
      </div>
      <Fld id='note' label='Note e misure specifiche per questo tipo di rischio' type='textarea' val={d.note}
        onChange={(_, v) => upd('note', v)}
        ph="Contromisure specifiche adottate, rischio residuo atteso dopo le misure, valutazioni ulteriori..." />
      {misure.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.4px' }}>Misure Art.32 collegate a questo rischio</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {misure.map(m => {
              const sel = (d.misureIds || []).includes(m.id);
              return (
                <span key={m.id} onClick={() => toggleMisura(m.id)}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${sel ? rt.color : '#dde3ec'}`, background: sel ? rt.color + '18' : '#f8fafc', color: sel ? rt.color : '#64748b', fontWeight: sel ? 700 : 400, userSelect: 'none' }}>
                  {m.nome}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Valutazione Rischi ───────────────────────────────────────────────────────
function RischiTab({ f, u, misure }) {
  const rts = f.riskTypes || {};
  const updRt = (id, val) => u('riskTypes', { ...rts, [id]: val });

  const levels = RISK_TYPES.map(rt => {
    const d = rts[rt.id] || {};
    return livelloRischio(d.probabilita || 2, d.gravita || 2);
  });
  const ORDER = { 'Basso': 1, 'Medio': 2, 'Alto': 3, 'Molto alto': 4 };
  const maxLevel = levels.reduce((m, l) => ORDER[l.label] > ORDER[m.label] ? l : m, levels[0]);

  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Art.35.7.c GDPR</strong> — Le misure previste per affrontare i rischi, incluse le garanzie, le misure di sicurezza e i meccanismi per garantire la protezione dei dati personali.
        </div>
      </div>
      <div style={{ ...C.card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 22 }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Livello di rischio complessivo della DPIA</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Massimo tra i 3 scenari di rischio WP248 — accesso illecito, modifica indesiderata, sparizione</div>
        </div>
        {maxLevel && <StatusBadge label={maxLevel.label} color={maxLevel.color} />}
      </div>
      {RISK_TYPES.map(rt => (
        <RiskTypePanel key={rt.id} rt={rt} data={rts[rt.id]} onUpdate={v => updRt(rt.id, v)} misure={misure} />
      ))}
    </div>
  );
}

// ─── Misure adottate ──────────────────────────────────────────────────────────
function MisureTab({ f, u, misure }) {
  const ids = f.misureIds || [];
  const toggle = id => u('misureIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const selected = misure.filter(m => ids.includes(m.id));
  const SCOL = { Implementata: '#16a34a', 'In corso': '#d97706', Pianificata: '#2563eb', 'Non implementata': '#dc2626' };

  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16 }}>
        <SectionTitle>Misure adottate (Art.32) — Collegamento alla libreria misure</SectionTitle>
        {misure.length === 0
          ? <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 13 }}>
              Nessuna misura nella libreria. Aggiungile nel tab <strong>Misure di sicurezza</strong>.
            </div>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {misure.map(m => {
                const sel = ids.includes(m.id);
                const sc = SCOL[m.stato] || '#64748b';
                return (
                  <div key={m.id} onClick={() => toggle(m.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${sel ? ACCENT : '#dde3ec'}`, background: sel ? ACCENT + '0f' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? '#0f172a' : '#64748b' }}>{m.nome}</span>
                    <span style={{ fontSize: 10, color: sc }}>{m.stato}</span>
                    {sel && <span style={{ color: ACCENT, fontSize: 12 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}
        {selected.length > 0 && (
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>MISURE SELEZIONATE ({selected.length})</div>
            {selected.map(m => (
              <div key={m.id} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                • <strong>{m.nome}</strong> ({m.tipo} — {m.stato}){m.riferimentoArt32 ? ` — ${m.riferimentoArt32}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={C.card}>
        <SectionTitle>Piano di trattamento del rischio e misure complementari</SectionTitle>
        <Fld id='misureNote' label='Descrizione complessiva e piano di implementazione' type='textarea' val={f.misureNote || ''} onChange={u}
          ph="Descrivere l'insieme delle misure tecniche e organizzative, il piano di implementazione, la verifica di efficacia, il rischio residuo atteso dopo le misure..." />
      </div>
    </div>
  );
}

// ─── DPO ─────────────────────────────────────────────────────────────────────
function DPOTab({ f, u }) {
  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Art.35.2 GDPR</strong> — Il titolare del trattamento chiede il parere del responsabile della protezione dei dati (DPO), ove designato, nello svolgimento della valutazione d'impatto sulla protezione dei dati.
        </div>
      </div>
      <div style={C.card}>
        <SectionTitle>Consultazione DPO (Art.35.2)</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input type='checkbox' id='dpoCheck' checked={!!f.dpoConsultato}
            onChange={e => u('dpoConsultato', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: ACCENT }} />
          <label htmlFor='dpoCheck' style={{ fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}>DPO consultato</label>
        </div>
        {f.dpoConsultato ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Fld id='dpoData' label='Data consultazione DPO' type='date' val={f.dpoData} onChange={u} />
            <div />
            <div style={{ gridColumn: '1/-1' }}>
              <Fld id='dpoParere' label='Parere del DPO' type='textarea' val={f.dpoParere} onChange={u}
                ph="Sintesi del parere espresso dal DPO, raccomandazioni specifiche, rilievi critici, eventuali condizioni poste..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Fld id='dpoNote' label='Note e follow-up' type='textarea' val={f.dpoNote} onChange={u}
                ph="Azioni concordate con il DPO, elementi ancora aperti, aggiornamenti a seguito del parere, data prevista revisione..." />
            </div>
          </div>
        ) : (
          <div style={{ background: '#fffbeb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#92400e' }}>
              ⚠️ Se è stato designato un DPO, la sua consultazione è obbligatoria ai sensi dell'Art.35.2 GDPR prima di procedere con il trattamento.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interessati ──────────────────────────────────────────────────────────────
function InteressatiTab({ f, u }) {
  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Art.35.9 GDPR</strong> — Ove opportuno, il titolare del trattamento raccoglie le opinioni degli interessati o dei loro rappresentanti riguardo al trattamento previsto, fatta salva la tutela degli interessi commerciali o pubblici o la sicurezza dei trattamenti.
        </div>
      </div>
      <div style={C.card}>
        <SectionTitle>Consultazione degli interessati (Art.35.9)</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input type='checkbox' id='intCheck' checked={!!f.interessatiConsultati}
            onChange={e => u('interessatiConsultati', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: ACCENT }} />
          <label htmlFor='intCheck' style={{ fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}>Interessati o loro rappresentanti consultati</label>
        </div>
        {f.interessatiConsultati ? (
          <Fld id='interessatiModalita' label='Modalità di consultazione degli interessati' type='textarea' val={f.interessatiModalita} onChange={u}
            ph="Descrivere come è stata effettuata la consultazione: sondaggi, focus group, consultazione dei rappresentanti sindacali, privacy notice test..." />
        ) : (
          <Fld id='interessatiGiustificazione' label='Motivazione per la mancata consultazione' type='textarea' val={f.interessatiGiustificazione} onChange={u}
            ph="Indicare le ragioni per cui non è stato opportuno raccogliere le opinioni (es. tutela di interessi commerciali o pubblici, sicurezza del trattamento, impraticabilità della consultazione)..." />
        )}
      </div>
    </div>
  );
}

// ─── Autorità di controllo ────────────────────────────────────────────────────
function AutoritaTab({ f, u }) {
  return (
    <div>
      <div style={{ ...C.card, marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Art.36.1 GDPR</strong> — Il titolare del trattamento consulta l'autorità di controllo prima di procedere al trattamento qualora la DPIA indichi che il trattamento presenterebbe un rischio residuo elevato in assenza di misure adottate per attenuarlo.
        </div>
      </div>
      <div style={C.card}>
        <SectionTitle>Consultazione preventiva del Garante (Art.36.1)</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input type='checkbox' id='rischioCheck' checked={!!f.rischioResiduoAlto}
            onChange={e => u('rischioResiduoAlto', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#dc2626' }} />
          <label htmlFor='rischioCheck' style={{ fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}>Il rischio residuo rimane elevato anche dopo le misure adottate</label>
        </div>
        {f.rischioResiduoAlto ? (
          <>
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>⚠️ Obbligo di consultazione preventiva del Garante (Art.36.1 GDPR)</div>
              <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 4 }}>
                Il trattamento non può iniziare fino a quando il Garante non ha fornito una risposta scritta (termine: 8 settimane, prorogabili di ulteriori 6 settimane in casi complessi — Art.36.2).
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <input type='checkbox' id='authCheck' checked={!!f.autoritaConsultata}
                onChange={e => u('autoritaConsultata', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: ACCENT }} />
              <label htmlFor='authCheck' style={{ fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}>Garante consultato</label>
            </div>
            {f.autoritaConsultata && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Fld id='autoritaData' label='Data consultazione Garante' type='date' val={f.autoritaData} onChange={u} />
                <div />
                <div style={{ gridColumn: '1/-1' }}>
                  <Fld id='autoritaEsito' label='Esito/risposta del Garante' type='textarea' val={f.autoritaEsito} onChange={u}
                    ph="Indicare l'esito della consultazione, eventuali prescrizioni impartite, autorizzazioni concesse o divieti al trattamento..." />
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#166534' }}>
              ✅ Il rischio residuo è stato ridotto a un livello accettabile mediante le misure adottate. La consultazione preventiva non è necessaria.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stato e revisione ────────────────────────────────────────────────────────
function StatoTab({ f, u }) {
  return (
    <div style={C.card}>
      <SectionTitle>Stato, approvazione e ciclo di revisione</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
        <Fld id='stato' label='Stato DPIA' options={STATI} val={f.stato} onChange={u} />
        <Fld id='approvato' label='Approvato da' val={f.approvato} onChange={u} ph="Nome e ruolo del responsabile dell'approvazione" />
        <div />
        <Fld id='dataApprovazione' label='Data approvazione' type='date' val={f.dataApprovazione} onChange={u} />
        <Fld id='dataRevisione' label='Data prossima revisione' type='date' val={f.dataRevisione} onChange={u} />
        <div />
        <div style={{ gridColumn: '1/-1' }}>
          <Fld id='note' label='Note finali e documentazione aggiuntiva' type='textarea' val={f.note} onChange={u}
            ph="Eventuali osservazioni conclusive, riferimenti a documenti allegati, modifiche rispetto a versioni precedenti, registro delle versioni..." />
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function DPIA({ trattamenti, dpia, misure = [], onSave }) {
  const [selId, setSelId] = useState(trattamenti[0]?.id || null);
  const [activeTab, setActiveTab] = useState('prescreening');

  const record = dpia.find(d => d.trattamentoId === selId);
  const f = { ...EMPTY, ...(record?.data || {}) };
  const tratt = trattamenti.find(t => t.id === selId);

  const persist = data => onSave({
    id: record?.id || Date.now().toString(),
    trattamentoId: selId,
    data,
    createdAt: record?.createdAt || new Date().toISOString(),
    label: tratt?.nome || ''
  });

  const u = (k, v) => persist({ ...f, [k]: v });

  const prescreeningScore = useMemo(() => {
    const criteri = f.prescreening?.criteri || {};
    return CRITERI_PRESCREENING.filter(c => criteri[c.id]).length;
  }, [f.prescreening]);

  const psIcon = prescreeningScore >= 2 ? '⚠️' : prescreeningScore === 1 ? '🔍' : '✅';

  if (!selId || !tratt) return (
    <div>
      <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>🔍 DPIA — Data Protection Impact Assessment</h3>
      {trattamenti.length === 0
        ? <EmptyState icon='🔍' title='Nessun trattamento' sub="Crea prima un trattamento nel tab Registro." />
        : <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20 }}>
            <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId} />
            <EmptyState icon='👈' title='Seleziona un trattamento' />
          </div>}
    </div>
  );

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>🔍 DPIA — Data Protection Impact Assessment</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start' }}>
        <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId} />
        <div>
          {/* Header */}
          <div style={{ ...C.card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{tratt.nome}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                DPIA · WP248 rev.01 · Pre-screening: {psIcon} {prescreeningScore}/{CRITERI_PRESCREENING.length} criteri
              </div>
            </div>
            <StatusBadge label={f.stato} color={STATO_COLOR[f.stato] || '#64748b'} />
          </div>

          {/* Tab strip */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
            {DPIA_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ ...C.btn(activeTab === t.id ? ACCENT : '#f1f5f9', activeTab === t.id ? '#fff' : '#374151', true), fontSize: 11 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'prescreening' && <PrescreeningTab f={f} u={u} />}
          {activeTab === 'descrizione' && <DescrizioneTab f={f} u={u} />}
          {activeTab === 'necessita' && <NecessitaTab f={f} u={u} />}
          {activeTab === 'rischi' && <RischiTab f={f} u={u} misure={misure} />}
          {activeTab === 'misure' && <MisureTab f={f} u={u} misure={misure} />}
          {activeTab === 'dpo' && <DPOTab f={f} u={u} />}
          {activeTab === 'interessati' && <InteressatiTab f={f} u={u} />}
          {activeTab === 'autorita' && <AutoritaTab f={f} u={u} />}
          {activeTab === 'stato' && <StatoTab f={f} u={u} />}
        </div>
      </div>
    </div>
  );
}
