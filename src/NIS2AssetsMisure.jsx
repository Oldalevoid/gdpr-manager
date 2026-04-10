import { useState } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import * as XLSX from 'xlsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_TIPI = ['Server fisico','Workstation','Applicazione web','Database','Rete / Firewall','Cloud service','Mobile / BYOD','OT / SCADA / ICS','Storage / Backup','VPN / Accesso remoto','Altro'];
const ASSET_CRITICITA = ['Critica','Alta','Media','Bassa'];
const ASSET_ESPOSIZIONE = ['Internet (pubblico)','DMZ','Rete interna','Cloud privato','Isolata / Air-gapped'];

const CRIT_COLOR = { 'Critica':'#dc2626','Alta':'#ea580c','Media':'#d97706','Bassa':'#16a34a' };
const CRIT_ICON  = { 'Critica':'🔴','Alta':'🟠','Media':'🟡','Bassa':'🟢' };

const ART21_CATEGORIE = [
  { id:'a', label:'Politiche di analisi dei rischi', desc:'Art.21 par.2 lett.a — Politiche di analisi dei rischi e sicurezza dei sistemi' },
  { id:'b', label:'Gestione degli incidenti',        desc:'Art.21 par.2 lett.b — Gestione degli incidenti di sicurezza' },
  { id:'c', label:'Continuità operativa',            desc:'Art.21 par.2 lett.c — Backup, disaster recovery, gestione delle crisi' },
  { id:'d', label:'Sicurezza supply chain',          desc:'Art.21 par.2 lett.d — Sicurezza della catena di approvvigionamento' },
  { id:'e', label:'Acquisizione e sviluppo sicuro',  desc:'Art.21 par.2 lett.e — Sicurezza nell\'acquisizione, sviluppo e manutenzione' },
  { id:'f', label:'Valutazione dell\'efficacia',     desc:'Art.21 par.2 lett.f — Politiche per valutare l\'efficacia delle misure' },
  { id:'g', label:'Cyber hygiene e formazione',      desc:'Art.21 par.2 lett.g — Pratiche di igiene informatica di base e formazione' },
  { id:'h', label:'Crittografia e cifratura',        desc:'Art.21 par.2 lett.h — Politiche in materia di crittografia e cifratura' },
  { id:'i', label:'IAM e gestione accessi',          desc:'Art.21 par.2 lett.i — Controllo accessi, autenticazione, gestione asset' },
  { id:'j', label:'MFA e autenticazione continua',   desc:'Art.21 par.2 lett.j — Autenticazione a più fattori o autenticazione continua' },
];

const MISURA_TIPI   = ['Tecnica','Organizzativa','Fisica'];
const MISURA_STATI  = ['Implementata','In corso','Pianificata','Non implementata'];
const MISURA_PRIORITA = ['Alta','Media','Bassa'];

// ─── Catalogo misure predefinite Art. 21 NIS2 ────────────────────────────────

const CATALOGO_MISURE = [
  // a) Politiche di analisi dei rischi
  { cat:'a', nome:'Politica di gestione del rischio informatico', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.a; ISO/IEC 27001 §6.1', note:'Definisce obiettivi, metodologia e responsabilità per la gestione del rischio di sicurezza informatica.' },
  { cat:'a', nome:'Valutazione periodica dei rischi (risk assessment annuale)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.a; ISO/IEC 27005', note:'Identificazione, analisi e valutazione dei rischi almeno annualmente o in caso di cambiamenti significativi.' },
  { cat:'a', nome:'Inventario e classificazione degli asset informatici', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.a; ISO/IEC 27001 A.5.9', note:'Registro completo degli asset con relativa classificazione per criticità e riservatezza.' },
  // b) Gestione degli incidenti
  { cat:'b', nome:'Procedura di gestione degli incidenti di sicurezza', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.b; Art.23 NIS2', note:'Processo formale per identificare, contenere, eradicare e recuperare da incidenti di sicurezza.' },
  { cat:'b', nome:'Sistema di rilevamento e monitoraggio degli incidenti (SIEM)', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.b; ISO/IEC 27001 A.8.15', note:'Piattaforma centralizzata per raccolta log, correlazione eventi e alerting in tempo reale.' },
  { cat:'b', nome:'Piano di risposta agli incidenti (IRP)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.b', note:'Documento operativo con ruoli, responsabilità, comunicazioni e procedure di escalation.' },
  { cat:'b', nome:'Notifica incidenti significativi all\'ACN (early warning 24h)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.23', note:'Procedura per la segnalazione obbligatoria entro 24h (early warning) e 72h (notifica completa) all\'autorità competente.' },
  // c) Continuità operativa e backup
  { cat:'c', nome:'Piano di continuità operativa (BCP)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.c; ISO/IEC 22301', note:'Piano per garantire la continuità delle funzioni critiche durante e dopo un evento disruptivo.' },
  { cat:'c', nome:'Piano di disaster recovery (DRP)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.c', note:'Procedure tecniche di ripristino dei sistemi e dei dati entro gli obiettivi RTO/RPO definiti.' },
  { cat:'c', nome:'Backup regolari con verifica del ripristino', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.c; ISO/IEC 27001 A.8.13', note:'Backup automatici schedulati (almeno giornalieri) con test periodici di ripristino effettivo.' },
  { cat:'c', nome:'Backup offsite / immutabile (protezione da ransomware)', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.c', note:'Copia di backup isolata dalla rete principale (air-gapped o immutabile su cloud) per resistere ad attacchi ransomware.' },
  { cat:'c', nome:'Test periodici di ripristino (DR test)', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.c', note:'Esercitazioni almeno annuali di ripristino completo per verificare l\'efficacia del DRP.' },
  // d) Sicurezza supply chain
  { cat:'d', nome:'Procedura di qualificazione e valutazione fornitori ICT', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.d', note:'Processo formale per valutare la postura di sicurezza dei fornitori critici prima dell\'ingaggio e periodicamente.' },
  { cat:'d', nome:'Clausole di sicurezza nei contratti con fornitori critici', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.d; GDPR Art.28', note:'Inclusione di requisiti di sicurezza, notifica breach, audit rights e standard minimi nei contratti.' },
  { cat:'d', nome:'Inventario fornitori critici e valutazione del rischio', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.d', note:'Registro aggiornato dei fornitori critici con classificazione del rischio e misure di mitigazione.' },
  // e) Acquisizione e sviluppo sicuro
  { cat:'e', nome:'Vulnerability assessment e penetration test periodici', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.e; ISO/IEC 27001 A.8.8', note:'Assessment almeno annuale (o dopo cambiamenti significativi) da parte di soggetti qualificati.' },
  { cat:'e', nome:'Gestione patch e aggiornamenti di sicurezza', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.e; ISO/IEC 27001 A.8.8', note:'Processo di applicazione tempestiva delle patch di sicurezza, con prioritizzazione per criticità (CVSS).' },
  { cat:'e', nome:'Processo di sviluppo sicuro (Secure SDLC)', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.e; ISO/IEC 27001 A.8.25', note:'Integrazione dei controlli di sicurezza nel ciclo di sviluppo software: threat modeling, code review, SAST/DAST.' },
  { cat:'e', nome:'Gestione delle vulnerabilità note (CVE tracking)', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.e', note:'Monitoraggio continuo delle vulnerabilità note (NVD, CISA KEV) applicate ai sistemi in uso.' },
  // f) Valutazione efficacia
  { cat:'f', nome:'Audit interni periodici sulla sicurezza informatica', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.f; ISO/IEC 27001 §9.2', note:'Verifiche interne almeno annuali sull\'efficacia delle misure di sicurezza implementate.' },
  { cat:'f', nome:'KPI e metriche di sicurezza informatica', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.f', note:'Definizione e monitoraggio di indicatori chiave: MTTD, MTTR, patch compliance rate, ecc.' },
  { cat:'f', nome:'Revisione periodica delle politiche di sicurezza', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.f; ISO/IEC 27001 §9.3', note:'Riesame almeno annuale di tutte le politiche di sicurezza per verificarne l\'attualità ed efficacia.' },
  // g) Cyber hygiene e formazione
  { cat:'g', nome:'Programma di formazione sulla cybersecurity per il personale', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.g; ISO/IEC 27001 A.6.3', note:'Formazione obbligatoria per tutto il personale, con contenuti aggiornati annualmente.' },
  { cat:'g', nome:'Policy di utilizzo accettabile degli strumenti informatici (AUP)', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.g; ISO/IEC 27001 A.5.10', note:'Regolamento che definisce l\'uso corretto di email, internet, dispositivi aziendali e cloud.' },
  { cat:'g', nome:'Simulazioni di phishing e test di consapevolezza', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.g', note:'Campagne periodiche di phishing simulato per misurare e migliorare la consapevolezza del personale.' },
  { cat:'g', nome:'Gestione sicura delle postazioni (endpoint hardening)', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.g; CIS Controls', note:'Configurazione sicura dei dispositivi: antivirus/EDR, screen lock, cifratura disco, aggiornamenti automatici.' },
  // h) Crittografia
  { cat:'h', nome:'Cifratura dei dati sensibili in transito (TLS 1.2+)', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.h; ISO/IEC 27001 A.8.24', note:'Utilizzo obbligatorio di protocolli cifrati (TLS 1.2 o superiore) per tutte le comunicazioni di dati sensibili.' },
  { cat:'h', nome:'Cifratura dei dati sensibili a riposo', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.h; ISO/IEC 27001 A.8.24', note:'Cifratura dei database, file system e dispositivi contenenti dati sensibili o critici.' },
  { cat:'h', nome:'Gestione sicura delle chiavi crittografiche (KMS)', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.h; ISO/IEC 27001 A.8.24', note:'Sistema centralizzato per la generazione, distribuzione, rotazione e revoca delle chiavi crittografiche.' },
  { cat:'h', nome:'Firma digitale per documenti e comunicazioni critiche', tipo:'Tecnica', priorita:'Media', riferimento:'NIS2 Art.21.2.h', note:'Utilizzo della firma digitale qualificata per garantire autenticità e integrità dei documenti ufficiali.' },
  // i) IAM e gestione accessi
  { cat:'i', nome:'Procedura di onboarding e offboarding sicuro', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.i; ISO/IEC 27001 A.6.1 A.6.5', note:'Processo formale per assegnare e revocare tempestivamente gli accessi al momento di ingresso/uscita del personale.' },
  { cat:'i', nome:'Politica di gestione degli accessi privilegiati (PAM)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.i; ISO/IEC 27001 A.8.2', note:'Controllo rigoroso degli account amministrativi: just-in-time access, session recording, password vault.' },
  { cat:'i', nome:'Revisione periodica dei diritti di accesso (access review)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.i; ISO/IEC 27001 A.5.18', note:'Verifica almeno semestrale della correttezza e necessità di tutti i diritti di accesso assegnati.' },
  { cat:'i', nome:'Principio del minimo privilegio (least privilege)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.i; ISO/IEC 27001 A.8.2', note:'Ogni utente e sistema dispone solo dei privilegi strettamente necessari all\'esercizio delle proprie funzioni.' },
  { cat:'i', nome:'Segregazione dei compiti (Separation of Duties)', tipo:'Organizzativa', priorita:'Media', riferimento:'NIS2 Art.21.2.i; ISO/IEC 27001 A.5.3', note:'Suddivisione delle attività critiche tra più soggetti per prevenire abusi e frodi.' },
  // j) MFA e autenticazione continua
  { cat:'j', nome:'Autenticazione a più fattori (MFA) per accessi remoti', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.j; ISO/IEC 27001 A.8.5', note:'MFA obbligatoria per VPN, RDP, SSH e tutti gli accessi remoti ai sistemi aziendali.' },
  { cat:'j', nome:'MFA per accesso a sistemi critici e account privilegiati', tipo:'Tecnica', priorita:'Alta', riferimento:'NIS2 Art.21.2.j', note:'MFA obbligatoria per amministratori di sistema, accesso a dati sensibili e sistemi OT/SCADA.' },
  { cat:'j', nome:'Politica di gestione delle password (complessità, rotazione, vault)', tipo:'Organizzativa', priorita:'Alta', riferimento:'NIS2 Art.21.2.j; ISO/IEC 27001 A.5.17', note:'Password di almeno 12 caratteri, unica per ogni account, gestita tramite password manager aziendale.' },
  { cat:'j', nome:'Single Sign-On (SSO) con controlli di sicurezza rafforzati', tipo:'Tecnica', priorita:'Media', riferimento:'NIS2 Art.21.2.j', note:'Centralizzazione dell\'autenticazione tramite SSO (es. SAML/OIDC) con MFA integrata e logging.' },
];

const STATO_COLOR = {
  'Implementata':'#16a34a','In corso':'#2563eb','Pianificata':'#d97706','Non implementata':'#dc2626'
};

// ─── Asset Form ───────────────────────────────────────────────────────────────

const EMPTY_ASSET = {
  nome:'', tipo:'Server fisico', criticita:'Media', esposizione:'Rete interna',
  responsabile:'', sistemaVersione:'', dataVerifica:'', note:''
};

function AssetForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || EMPTY_ASSET);
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <Modal onClose={onCancel} maxWidth={620}>
      <h3 style={{ margin: '0 0 18px', color: '#0f172a' }}>
        {initial ? '✏️ Modifica asset critico' : '➕ Nuovo asset critico'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Fld id='nome' label='Nome asset *' val={f.nome} onChange={u} ph='es. Web Server Apache, Azure SQL Database...' />
        </div>
        <Fld id='tipo' label='Tipo asset' val={f.tipo} onChange={u} options={ASSET_TIPI} />
        <Fld id='criticita' label='Criticità' val={f.criticita} onChange={u} options={ASSET_CRITICITA} />
        <Fld id='esposizione' label='Esposizione' val={f.esposizione} onChange={u} options={ASSET_ESPOSIZIONE} />
        <Fld id='responsabile' label='Responsabile' val={f.responsabile} onChange={u} ph='es. Mario Rossi, IT Manager' />
        <Fld id='sistemaVersione' label='Sistema / Versione (opz.)' val={f.sistemaVersione} onChange={u} ph='es. Windows Server 2022, Ubuntu 22.04' />
        <Fld id='dataVerifica' label='Data ultima verifica' val={f.dataVerifica} onChange={u} type='date' />
        <div style={{ gridColumn: '1/-1' }}>
          <Fld id='note' label='Note' val={f.note} onChange={u} type='textarea' ph='es. contiene dati clienti, esposto a internet, requires patching...' />
        </div>
      </div>
      <div style={C.row}>
        <button style={C.btn()} onClick={() => {
          if (!f.nome.trim()) { alert('Inserisci il nome dell\'asset'); return; }
          onSave({ ...f, id: initial?.id || Date.now().toString() });
        }}>💾 Salva</button>
        <button style={C.btn('#f1f5f9', '#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </Modal>
  );
}

// ─── Asset Critici Component ──────────────────────────────────────────────────

export function NIS2Assets({ assets, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [filterCrit, setFilterCrit] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const handleSave = a => {
    const updated = editAsset
      ? assets.map(x => x.id === a.id ? a : x)
      : [...assets, a];
    onSave(updated);
    setShowForm(false); setEditAsset(null);
  };

  const critCounts = ASSET_CRITICITA.reduce((acc, c) => {
    acc[c] = assets.filter(a => a.criticita === c).length;
    return acc;
  }, {});

  const filtered = filterCrit ? assets.filter(a => a.criticita === filterCrit) : assets;

  // Group by tipo for the overview bar
  const tipoIcons = {
    'Server fisico':'🖥️','Workstation':'💻','Applicazione web':'🌐','Database':'🗄️',
    'Rete / Firewall':'🛡️','Cloud service':'☁️','Mobile / BYOD':'📱',
    'OT / SCADA / ICS':'⚙️','Storage / Backup':'💾','VPN / Accesso remoto':'🔐','Altro':'📦'
  };

  return (
    <div>
      {(showForm || editAsset) && (
        <AssetForm
          initial={editAsset}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditAsset(null); }}
        />
      )}

      {/* Header row */}
      <div style={{ ...C.row, justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>🖥️ Asset Critici</SectionTitle>
        <button style={C.btn('#0891b2', '#fff', true)} onClick={() => { setEditAsset(null); setShowForm(true); }}>
          + Aggiungi asset
        </button>
      </div>

      {/* Summary bar */}
      {assets.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {ASSET_CRITICITA.map(c => (
            <button key={c} onClick={() => setFilterCrit(filterCrit === c ? '' : c)}
              style={{ ...C.btn(filterCrit === c ? CRIT_COLOR[c] : '#f1f5f9', filterCrit === c ? '#fff' : '#374151', true), gap: 6, borderRadius: 20 }}>
              {CRIT_ICON[c]} {c}
              <span style={{ background: filterCrit === c ? 'rgba(255,255,255,.25)' : '#e2e8f0', borderRadius: 12, padding: '1px 6px', fontSize: 11, fontWeight: 800 }}>
                {critCounts[c] || 0}
              </span>
            </button>
          ))}
          {filterCrit && (
            <button style={C.btn('#f8fafc', '#64748b', true)} onClick={() => setFilterCrit('')}>✕ Tutti ({assets.length})</button>
          )}
        </div>
      )}

      {assets.length === 0 ? (
        <EmptyState icon='🖥️' title='Nessun asset registrato'
          sub="Censisci gli asset critici dell'organizzazione per la valutazione NIS2."
          onAction={() => { setEditAsset(null); setShowForm(true); }} actionLabel='+ Aggiungi il primo asset' />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
          Nessun asset con criticità "{filterCrit}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(a => (
            <div key={a.id} style={{ ...C.card, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start', borderLeft: `4px solid ${CRIT_COLOR[a.criticita] || '#e5eaf0'}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: (CRIT_COLOR[a.criticita] || '#e5eaf0') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {tipoIcons[a.tipo] || '📦'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{a.nome}</span>
                  <StatusBadge label={`${CRIT_ICON[a.criticita]} ${a.criticita}`} color={CRIT_COLOR[a.criticita] || '#64748b'} />
                  <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '2px 7px' }}>{a.tipo}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                  {a.esposizione && <span>📡 {a.esposizione}</span>}
                  {a.responsabile && <span>👤 {a.responsabile}</span>}
                  {a.sistemaVersione && <span>💿 {a.sistemaVersione}</span>}
                  {a.dataVerifica && <span>📅 Verifica: {new Date(a.dataVerifica).toLocaleDateString('it-IT')}</span>}
                </div>
                {a.note && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>📝 {a.note}</div>}
              </div>
              <div style={{ ...C.row, flexShrink: 0 }}>
                <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => { setEditAsset(a); setShowForm(true); }}>✏️</button>
                {confirmDel === a.id
                  ? <>
                    <button style={C.btn('#dc2626', '#fff', true)} onClick={() => { onSave(assets.filter(x => x.id !== a.id)); setConfirmDel(null); }}>Conferma</button>
                    <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => setConfirmDel(null)}>✕</button>
                  </>
                  : <button style={C.btn('#fff5f5', '#dc2626', true)} onClick={() => setConfirmDel(a.id)}>🗑️</button>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      {assets.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => exportAssetsExcel(assets)}>
            📊 Esporta Excel
          </button>
        </div>
      )}
    </div>
  );
}

function exportAssetsExcel(assets) {
  const rows = assets.map(a => ({
    'Nome Asset': a.nome, 'Tipo': a.tipo, 'Criticità': a.criticita,
    'Esposizione': a.esposizione, 'Responsabile': a.responsabile,
    'Sistema / Versione': a.sistemaVersione, 'Data Ultima Verifica': a.dataVerifica, 'Note': a.note
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asset Critici NIS2');
  XLSX.writeFile(wb, 'nis2_asset_critici.xlsx');
}

// ─── Modal Catalogo ───────────────────────────────────────────────────────────

function CatalogoModal({ misureEsistenti, onImport, onClose }) {
  const [selected, setSelected] = useState({});
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');

  const existingNames = new Set(misureEsistenti.map(m => m.nome.toLowerCase()));

  const visible = CATALOGO_MISURE.filter(m => {
    if (filterCat && m.cat !== filterCat) return false;
    if (search && !m.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = idx => setSelected(p => ({ ...p, [idx]: !p[idx] }));
  const allVisible = visible.every((_, i) => selected[CATALOGO_MISURE.indexOf(visible[i])]);
  const toggleAll = () => {
    const next = {};
    if (!allVisible) visible.forEach(m => { next[CATALOGO_MISURE.indexOf(m)] = true; });
    setSelected(prev => ({ ...prev, ...next }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleImport = () => {
    const toImport = CATALOGO_MISURE
      .filter((_, i) => selected[i])
      .map(m => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        nome: m.nome,
        categoriaArt21: m.cat,
        tipo: m.tipo,
        stato: 'Pianificata',
        priorita: m.priorita,
        responsabile: '',
        scadenza: '',
        assetIds: [],
        riferimento: m.riferimento,
        note: m.note,
        createdAt: new Date().toISOString(),
      }));
    onImport(toImport);
  };

  return (
    <Modal onClose={onClose} maxWidth={780}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>📚 Catalogo Misure Art. 21 NIS2</h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {CATALOGO_MISURE.length} misure predefinite — seleziona quelle da importare
          </div>
        </div>
        {selectedCount > 0 && (
          <button style={C.btn('#0891b2', '#fff')} onClick={handleImport}>
            ✅ Importa {selectedCount} misur{selectedCount === 1 ? 'a' : 'e'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder='🔍 Cerca misura...'
          style={{ ...C.inp, width: 220, fontSize: 13 }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ ...C.inp, width: 'auto', fontSize: 13 }}>
          <option value=''>Tutte le categorie</option>
          {ART21_CATEGORIE.map(c => (
            <option key={c.id} value={c.id}>Art.21 lett.{c.id} — {c.label}</option>
          ))}
        </select>
        <button style={C.btn('#f1f5f9', '#374151', true)} onClick={toggleAll}>
          {allVisible ? '☐ Deseleziona tutti' : '☑ Seleziona tutti visibili'}
        </button>
      </div>

      {/* List grouped by category */}
      <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
        {ART21_CATEGORIE.filter(c => !filterCat || c.id === filterCat).map(cat => {
          const inCat = visible.filter(m => m.cat === cat.id);
          if (inCat.length === 0) return null;
          return (
            <div key={cat.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '.4px', padding: '4px 0', borderBottom: '1.5px solid #e0f2fe', marginBottom: 8 }}>
                Art.21 lett.{cat.id} — {cat.label}
              </div>
              {inCat.map(m => {
                const globalIdx = CATALOGO_MISURE.indexOf(m);
                const isSel = !!selected[globalIdx];
                const alreadyIn = existingNames.has(m.nome.toLowerCase());
                return (
                  <div key={globalIdx} onClick={() => !alreadyIn && toggle(globalIdx)}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                      background: alreadyIn ? '#f8fafc' : isSel ? '#eff6ff' : '#fff',
                      border: `1.5px solid ${alreadyIn ? '#e5eaf0' : isSel ? '#0891b2' : '#e5eaf0'}`,
                      cursor: alreadyIn ? 'default' : 'pointer', opacity: alreadyIn ? .55 : 1 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${alreadyIn ? '#cbd5e1' : isSel ? '#0891b2' : '#cbd5e1'}`, background: isSel ? '#0891b2' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      {isSel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: alreadyIn ? '#94a3b8' : '#0f172a' }}>{m.nome}</span>
                        {alreadyIn && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', borderRadius: 8, padding: '1px 6px' }}>✓ già presente</span>}
                        <span style={{ fontSize: 10, background: m.tipo === 'Tecnica' ? '#eff6ff' : '#f0fdf4', color: m.tipo === 'Tecnica' ? '#2563eb' : '#16a34a', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>{m.tipo}</span>
                        <span style={{ fontSize: 10, background: m.priorita === 'Alta' ? '#fef2f2' : '#fefce8', color: m.priorita === 'Alta' ? '#dc2626' : '#d97706', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>{m.priorita}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{m.note}</div>
                      {m.riferimento && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>🔗 {m.riferimento}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ ...C.row, justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
        <button style={C.btn('#f1f5f9', '#374151')} onClick={onClose}>Annulla</button>
        {selectedCount > 0 && (
          <button style={C.btn('#0891b2', '#fff')} onClick={handleImport}>
            ✅ Importa {selectedCount} misur{selectedCount === 1 ? 'a' : 'e'} selezionat{selectedCount === 1 ? 'a' : 'e'}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Misura Form ──────────────────────────────────────────────────────────────

const EMPTY_MISURA = {
  nome: '', categoriaArt21: 'a', tipo: 'Tecnica', stato: 'Pianificata',
  priorita: 'Media', responsabile: '', scadenza: '', assetIds: [], note: '', riferimento: ''
};

function MisuraForm({ initial, assets, onSave, onCancel }) {
  const [f, setF] = useState(initial || EMPTY_MISURA);
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));

  const toggleAsset = id => {
    const ids = f.assetIds || [];
    setF(p => ({ ...p, assetIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] }));
  };

  const cat = ART21_CATEGORIE.find(c => c.id === f.categoriaArt21);

  return (
    <Modal onClose={onCancel} maxWidth={660}>
      <h3 style={{ margin: '0 0 18px', color: '#0f172a' }}>
        {initial ? '✏️ Modifica misura di sicurezza' : '➕ Nuova misura di sicurezza'}
      </h3>

      <div style={{ gridColumn: '1/-1' }}>
        <Fld id='nome' label='Nome misura *' val={f.nome} onChange={u} ph='es. Implementazione MFA, Backup giornaliero crittografato...' />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {/* Category */}
        <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
          <label style={C.lbl}>Categoria Art. 21 NIS2 *</label>
          <select value={f.categoriaArt21} onChange={e => u('categoriaArt21', e.target.value)} style={C.inp}>
            {ART21_CATEGORIE.map(c => (
              <option key={c.id} value={c.id}>{c.id.toUpperCase()} — {c.label}</option>
            ))}
          </select>
          {cat && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{cat.desc}</div>}
        </div>

        <Fld id='tipo' label='Tipo' val={f.tipo} onChange={u} options={MISURA_TIPI} />
        <Fld id='stato' label='Stato' val={f.stato} onChange={u} options={MISURA_STATI} />
        <Fld id='priorita' label='Priorità' val={f.priorita} onChange={u} options={MISURA_PRIORITA} />
        <Fld id='responsabile' label='Responsabile' val={f.responsabile} onChange={u} ph='es. CISO, IT Manager...' />
        <Fld id='scadenza' label='Scadenza' val={f.scadenza} onChange={u} type='date' />
        <Fld id='riferimento' label='Riferimento normativo (opz.)' val={f.riferimento} onChange={u} ph='es. NIS2 Art.21.2.j, ISO 27001 A.9.4' />

        {/* Asset linkage */}
        {assets.length > 0 && (
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={C.lbl}>Asset coinvolti (opz.)</label>
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

        <div style={{ gridColumn: '1/-1' }}>
          <Fld id='note' label='Note / Descrizione' val={f.note} onChange={u} type='textarea' ph='es. Dettagli implementazione, strumenti adottati, costi previsti...' />
        </div>
      </div>

      <div style={C.row}>
        <button style={C.btn()} onClick={() => {
          if (!f.nome.trim()) { alert('Inserisci il nome della misura'); return; }
          onSave({ ...f, id: initial?.id || Date.now().toString(), createdAt: initial?.createdAt || new Date().toISOString() });
        }}>💾 Salva</button>
        <button style={C.btn('#f1f5f9', '#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </Modal>
  );
}

// ─── Misure di Sicurezza Component ───────────────────────────────────────────

export function NIS2Misure({ misure, assets, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editMisura, setEditMisura] = useState(null);
  const [filterCat, setFilterCat] = useState('');
  const [filterStato, setFilterStato] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showCatalogo, setShowCatalogo] = useState(false);

  const handleSave = m => {
    const updated = editMisura
      ? misure.map(x => x.id === m.id ? m : x)
      : [...misure, m];
    onSave(updated);
    setShowForm(false); setEditMisura(null);
  };

  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));

  // Stats per categoria
  const catStats = ART21_CATEGORIE.map(c => {
    const cm = misure.filter(m => m.categoriaArt21 === c.id);
    const impl = cm.filter(m => m.stato === 'Implementata').length;
    return { ...c, total: cm.length, impl };
  });

  // Filtered
  let filtered = misure;
  if (filterCat) filtered = filtered.filter(m => m.categoriaArt21 === filterCat);
  if (filterStato) filtered = filtered.filter(m => m.stato === filterStato);

  // Coverage score
  const totalImpl = misure.filter(m => m.stato === 'Implementata').length;
  const coveragePct = misure.length ? Math.round((totalImpl / misure.length) * 100) : 0;

  return (
    <div>
      {(showForm || editMisura) && (
        <MisuraForm
          initial={editMisura}
          assets={assets}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMisura(null); }}
        />
      )}
      {showCatalogo && (
        <CatalogoModal
          misureEsistenti={misure}
          onImport={arr => { onSave([...misure, ...arr]); setShowCatalogo(false); }}
          onClose={() => setShowCatalogo(false)}
        />
      )}

      {/* Header */}
      <div style={{ ...C.row, justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>🔒 Misure di Sicurezza — Art. 21 NIS2</SectionTitle>
        <div style={C.row}>
          <button style={C.btn('#6366f1', '#fff', true)} onClick={() => setShowCatalogo(true)}>
            📚 Catalogo
          </button>
          <button style={C.btn('#0891b2', '#fff', true)} onClick={() => { setEditMisura(null); setShowForm(true); }}>
            + Aggiungi misura
          </button>
        </div>
      </div>

      {/* Coverage bar */}
      {misure.length > 0 && (
        <div style={{ ...C.card, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
              Misure implementate: <span style={{ color: '#16a34a' }}>{totalImpl}</span> / {misure.length}
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: coveragePct >= 70 ? '#16a34a' : coveragePct >= 40 ? '#d97706' : '#dc2626' }}>
              {coveragePct}%
            </div>
          </div>
          <div style={{ height: 8, background: '#e5eaf0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${coveragePct}%`, background: coveragePct >= 70 ? '#16a34a' : coveragePct >= 40 ? '#d97706' : '#dc2626', borderRadius: 4, transition: 'width .4s' }} />
          </div>
          {/* Per-stato mini pills */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {MISURA_STATI.map(s => {
              const n = misure.filter(m => m.stato === s).length;
              return n > 0 ? (
                <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: STATO_COLOR[s] + '22', color: STATO_COLOR[s] }}>
                  {s}: {n}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Category overview */}
      {misure.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8, marginBottom: 16 }}>
          {catStats.filter(c => c.total > 0).map(c => (
            <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? '' : c.id)}
              style={{ ...C.card, padding: '10px 12px', border: `1.5px solid ${filterCat === c.id ? '#0891b2' : '#e5eaf0'}`, cursor: 'pointer', textAlign: 'left', background: filterCat === c.id ? '#f0f9ff' : '#fff' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0891b2', marginBottom: 2, textTransform: 'uppercase' }}>Art.21 lett.{c.id}</div>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#0f172a', marginBottom: 6, lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{c.impl}/{c.total} impl.</span>
                <div style={{ width: 36, height: 4, background: '#e5eaf0', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: c.total ? `${(c.impl / c.total) * 100}%` : '0', background: '#16a34a', borderRadius: 2 }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {misure.length > 0 && (
        <div style={{ ...C.row, marginBottom: 12, gap: 6 }}>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ ...C.inp, width: 'auto', fontSize: 12, padding: '6px 10px' }}>
            <option value=''>Tutte le categorie</option>
            {ART21_CATEGORIE.map(c => <option key={c.id} value={c.id}>Art.21 lett.{c.id} — {c.label}</option>)}
          </select>
          <select value={filterStato} onChange={e => setFilterStato(e.target.value)}
            style={{ ...C.inp, width: 'auto', fontSize: 12, padding: '6px 10px' }}>
            <option value=''>Tutti gli stati</option>
            {MISURA_STATI.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterCat || filterStato) && (
            <button style={C.btn('#f1f5f9', '#64748b', true)} onClick={() => { setFilterCat(''); setFilterStato(''); }}>✕ Reset</button>
          )}
        </div>
      )}

      {/* List */}
      {misure.length === 0 ? (
        <EmptyState icon='🔒' title='Nessuna misura registrata'
          sub="Aggiungi le misure di sicurezza adottate o pianificate ai sensi dell'art. 21 NIS2."
          onAction={() => { setEditMisura(null); setShowForm(true); }} actionLabel='+ Aggiungi la prima misura' />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>Nessuna misura per i filtri selezionati.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(m => {
            const cat = ART21_CATEGORIE.find(c => c.id === m.categoriaArt21);
            const linkedAssets = (m.assetIds || []).map(id => assetMap[id]).filter(Boolean);
            const isExpanded = expandedId === m.id;
            return (
              <div key={m.id} style={{ ...C.card, padding: '14px 16px', borderLeft: `4px solid ${STATO_COLOR[m.stato] || '#e5eaf0'}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.nome}</span>
                      <StatusBadge label={m.stato} color={STATO_COLOR[m.stato] || '#64748b'} />
                      {m.priorita === 'Alta' && <StatusBadge label='⚡ Alta priorità' color='#dc2626' />}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                      {cat && <span style={{ background: '#f0f9ff', color: '#0891b2', padding: '1px 7px', borderRadius: 6, fontWeight: 700, fontSize: 10 }}>Art.21.{m.categoriaArt21}</span>}
                      <span>{m.tipo}</span>
                      {m.responsabile && <span>👤 {m.responsabile}</span>}
                      {m.scadenza && <span>📅 {new Date(m.scadenza).toLocaleDateString('it-IT')}</span>}
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                        {cat && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>📋 {cat.desc}</div>}
                        {m.riferimento && <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>🔗 Rif.: {m.riferimento}</div>}
                        {m.note && <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>📝 {m.note}</div>}
                        {linkedAssets.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: '#64748b' }}>Asset:</span>
                            {linkedAssets.map(a => (
                              <span key={a.id} style={{ fontSize: 11, background: '#f1f5f9', color: '#374151', borderRadius: 6, padding: '1px 7px' }}>{a.nome}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 11, padding: '4px 0 0', fontFamily: 'inherit' }}
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                      {isExpanded ? '▲ meno dettagli' : '▼ dettagli'}
                    </button>
                  </div>
                  <div style={{ ...C.row, flexShrink: 0 }}>
                    <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => { setEditMisura(m); setShowForm(true); }}>✏️</button>
                    {confirmDel === m.id
                      ? <>
                        <button style={C.btn('#dc2626', '#fff', true)} onClick={() => { onSave(misure.filter(x => x.id !== m.id)); setConfirmDel(null); }}>Conferma</button>
                        <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => setConfirmDel(null)}>✕</button>
                      </>
                      : <button style={C.btn('#fff5f5', '#dc2626', true)} onClick={() => setConfirmDel(m.id)}>🗑️</button>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export */}
      {misure.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={C.btn('#f1f5f9', '#374151', true)} onClick={() => exportMisureExcel(misure, assets)}>
            📊 Esporta Excel
          </button>
        </div>
      )}
    </div>
  );
}

function exportMisureExcel(misure, assets) {
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a.nome]));
  const catMap = Object.fromEntries(ART21_CATEGORIE.map(c => [c.id, c.label]));
  const rows = misure.map(m => ({
    'Nome Misura': m.nome,
    'Categoria NIS2': `Art.21 lett.${m.categoriaArt21} — ${catMap[m.categoriaArt21] || ''}`,
    'Tipo': m.tipo,
    'Stato': m.stato,
    'Priorità': m.priorita,
    'Responsabile': m.responsabile,
    'Scadenza': m.scadenza,
    'Asset Coinvolti': (m.assetIds || []).map(id => assetMap[id]).filter(Boolean).join(', '),
    'Riferimento Normativo': m.riferimento,
    'Note': m.note,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Misure NIS2');
  XLSX.writeFile(wb, 'nis2_misure_sicurezza.xlsx');
}
