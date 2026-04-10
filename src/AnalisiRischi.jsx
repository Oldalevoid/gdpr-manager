import { useState } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import { AICtx, useAIRecord } from './AIContext';

const PROB_LABELS = ['','Bassa','Media','Alta','Molto Alta'];
const IMP_LABELS  = ['','Trascurabile','Moderato','Significativo','Grave'];

// ─── Paniere di rischi GDPR di default ────────────────────────────────────────
const CATEGORIE_PANIERE = ['Accesso e Riservatezza', 'Integrità e Disponibilità', 'Errori e Conformità', 'Attacchi Informatici'];

const PANIERE_DEFAULT = [
  // ── Accesso e Riservatezza ──
  { cat: 'Accesso e Riservatezza', minaccia: 'Accesso non autorizzato ai dati personali', vulnerabilita: 'Credenziali deboli o condivise, assenza di autenticazione a più fattori, gestione insufficiente dei privilegi di accesso.', probabilita: 2, impatto: 3, misureMitigazione: 'Implementare MFA, politica password robusta, principio del privilegio minimo, log degli accessi.', rischioResiduo: 2 },
  { cat: 'Accesso e Riservatezza', minaccia: 'Divulgazione non autorizzata a terzi', vulnerabilita: 'Invio errato di email, condivisione accidentale di file, comunicazione a destinatari non autorizzati.', probabilita: 2, impatto: 3, misureMitigazione: 'Formazione del personale, DLP (Data Loss Prevention), procedure di verifica destinatari.', rischioResiduo: 2 },
  { cat: 'Accesso e Riservatezza', minaccia: 'Accesso fisico non autorizzato ai sistemi', vulnerabilita: 'Postazioni di lavoro incustodite, server room non protetti, mancanza di clean desk policy.', probabilita: 1, impatto: 3, misureMitigazione: 'Controllo accessi fisici, lock automatico postazioni, CCTV, clean desk policy.', rischioResiduo: 1 },
  { cat: 'Accesso e Riservatezza', minaccia: 'Intercettazione di dati in transito', vulnerabilita: 'Trasmissione dati senza cifratura, uso di reti Wi-Fi pubbliche, protocolli obsoleti (HTTP, FTP).', probabilita: 2, impatto: 3, misureMitigazione: 'Cifratura TLS/HTTPS su tutte le comunicazioni, VPN per accessi remoti, dismissione protocolli non sicuri.', rischioResiduo: 1 },
  { cat: 'Accesso e Riservatezza', minaccia: 'Utilizzo non autorizzato da parte di responsabili/sub-responsabili', vulnerabilita: 'Contratti DPA insufficienti, mancata verifica delle misure di sicurezza dei fornitori, sub-responsabili non autorizzati.', probabilita: 2, impatto: 3, misureMitigazione: 'Contratti Art.28 completi, audit fornitori, clausole di responsabilità, lista sub-responsabili approvati.', rischioResiduo: 2 },

  // ── Integrità e Disponibilità ──
  { cat: 'Integrità e Disponibilità', minaccia: 'Perdita o distruzione accidentale dei dati', vulnerabilita: 'Assenza di backup sistematici, backup non testati, archiviazione su supporti non ridondanti.', probabilita: 2, impatto: 4, misureMitigazione: 'Backup automatici giornalieri (3-2-1), test periodici di restore, storage ridondante, disaster recovery plan.', rischioResiduo: 1 },
  { cat: 'Integrità e Disponibilità', minaccia: 'Alterazione o corruzione dei dati personali', vulnerabilita: 'Accessi con permessi eccessivi, assenza di controllo integrità, processi di importazione/migrazione dati non controllati.', probabilita: 1, impatto: 3, misureMitigazione: 'Controllo integrità (hash/checksum), log delle modifiche, separazione dei ruoli, validazione input.', rischioResiduo: 1 },
  { cat: 'Integrità e Disponibilità', minaccia: 'Indisponibilità prolungata del sistema (downtime)', vulnerabilita: 'Infrastruttura non ridondante, assenza di SLA adeguati con fornitori cloud, mancanza di Business Continuity Plan.', probabilita: 2, impatto: 3, misureMitigazione: 'Architettura ad alta disponibilità, SLA con penali, BCP documentato, test di continuità operativa.', rischioResiduo: 2 },
  { cat: 'Integrità e Disponibilità', minaccia: 'Perdita dati alla scadenza del contratto con fornitore cloud', vulnerabilita: 'Dati archiviati solo presso fornitore, mancanza di procedura di portabilità, lock-in tecnologico.', probabilita: 1, impatto: 4, misureMitigazione: 'Backup locale periodico, clausola di portabilità nel contratto, test di migrazione annuale.', rischioResiduo: 1 },

  // ── Errori e Conformità ──
  { cat: 'Errori e Conformità', minaccia: 'Errore umano nel trattamento dei dati', vulnerabilita: 'Formazione insufficiente del personale, procedure non documentate, elevato turnover del personale.', probabilita: 3, impatto: 2, misureMitigazione: 'Formazione periodica GDPR, procedure operative documentate, checklist per operazioni critiche, supervisione.', rischioResiduo: 2 },
  { cat: 'Errori e Conformità', minaccia: 'Mancata cancellazione dei dati alla scadenza della retention', vulnerabilita: 'Assenza di procedure di cancellazione automatica, retention policy non implementata tecnicamente.', probabilita: 3, impatto: 2, misureMitigazione: 'Sistemi di cancellazione automatica, audit periodici degli archivi, responsabile della retention designato.', rischioResiduo: 2 },
  { cat: 'Errori e Conformità', minaccia: 'Mancata risposta alle richieste degli interessati (Art.15-22)', vulnerabilita: 'Nessun processo formale per la gestione delle richieste, tempi di risposta non monitorati.', probabilita: 2, impatto: 2, misureMitigazione: 'Procedura formalizzata per richieste DSAR, registro delle richieste, responsabile designato, reminder automatici.', rischioResiduo: 1 },
  { cat: 'Errori e Conformità', minaccia: 'Trasferimento illecito verso paesi terzi extra-SEE', vulnerabilita: 'Utilizzo di servizi cloud o fornitori in paesi senza adeguatezza, mancanza di SCC o BCR.', probabilita: 2, impatto: 3, misureMitigazione: 'Mappatura dei flussi internazionali, adozione SCC approvate, verifica adeguatezza paese destinatario.', rischioResiduo: 2 },
  { cat: 'Errori e Conformità', minaccia: 'Raccolta di dati eccedente la finalità (violazione minimizzazione)', vulnerabilita: 'Form di raccolta eccessivamente ampi, campi non necessari, finalità non documentate.', probabilita: 2, impatto: 2, misureMitigazione: 'Privacy by design, revisione periodica dei form e dei dati raccolti, data mapping aggiornato.', rischioResiduo: 1 },

  // ── Attacchi Informatici ──
  { cat: 'Attacchi Informatici', minaccia: 'Attacco phishing / ingegneria sociale', vulnerabilita: 'Personale non formato, email aziendali esposte pubblicamente, assenza di filtri antispam avanzati.', probabilita: 3, impatto: 3, misureMitigazione: 'Formazione anti-phishing con simulazioni, filtri email avanzati, MFA per tutti gli account, segnalazione incidenti.', rischioResiduo: 2 },
  { cat: 'Attacchi Informatici', minaccia: 'Attacco ransomware con cifratura dei dati', vulnerabilita: 'Sistemi non aggiornati, backup non isolati dalla rete, click su allegati malevoli, RDP esposto.', probabilita: 2, impatto: 4, misureMitigazione: 'Patch management sistematico, backup offline/immutabili, EDR/antivirus avanzato, segmentazione rete, piano risposta incidenti.', rischioResiduo: 2 },
  { cat: 'Attacchi Informatici', minaccia: 'Esfiltrazione dati da attore malevolo esterno', vulnerabilita: 'Vulnerabilità nelle applicazioni web, SQL injection, accessi API non protetti, credenziali compromesse.', probabilita: 2, impatto: 4, misureMitigazione: 'Penetration test periodico, WAF, SIEM, monitoraggio anomalie, gestione vulnerabilità, bug bounty.', rischioResiduo: 2 },
  { cat: 'Attacchi Informatici', minaccia: 'Minaccia interna — dipendente malintenzionato', vulnerabilita: 'Accessi eccessivi non revocati, mancanza di segregazione dei compiti, assenza di monitoraggio comportamentale.', probabilita: 1, impatto: 4, misureMitigazione: 'Principio del privilegio minimo, revoca immediata accessi in uscita, audit log, NDA, procedure offboarding.', rischioResiduo: 2 },
];

function PaniereModal({ existing, onImport, onClose }) {
  const [sel, setSel] = useState({});
  const [catFilter, setCatFilter] = useState('Tutti');

  const toggle = i => setSel(p => ({ ...p, [i]: !p[i] }));
  const toggleAll = (filtered) => {
    const allSel = filtered.every((_, i) => sel[PANIERE_DEFAULT.indexOf(_)]);
    const upd = { ...sel };
    filtered.forEach(r => { upd[PANIERE_DEFAULT.indexOf(r)] = !allSel; });
    setSel(upd);
  };

  const existingMinacce = new Set(existing.map(s => s.minaccia.toLowerCase()));
  const filtered = PANIERE_DEFAULT.filter(r =>
    (catFilter === 'Tutti' || r.cat === catFilter) && !existingMinacce.has(r.minaccia.toLowerCase())
  );
  const alreadyImported = PANIERE_DEFAULT.filter(r => existingMinacce.has(r.minaccia.toLowerCase()));
  const selCount = Object.values(sel).filter(Boolean).length;

  const doImport = () => {
    const toAdd = PANIERE_DEFAULT
      .filter((_, i) => sel[i])
      .map(r => ({ ...r, id: Date.now().toString() + Math.random(), misureIds: [] }));
    onImport(toAdd);
    onClose();
  };

  const catColor = { 'Accesso e Riservatezza': '#dc2626', 'Integrità e Disponibilità': '#d97706', 'Errori e Conformità': '#7c3aed', 'Attacchi Informatici': '#0891b2' };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ ...C.card, width:'100%', maxWidth:780, maxHeight:'88vh', overflow:'auto', padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <span style={{ fontSize:22 }}>📚</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Paniere rischi GDPR — scenari tipici</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{PANIERE_DEFAULT.length} scenari predefiniti · {alreadyImported.length > 0 ? `${alreadyImported.length} già presenti` : 'nessuno ancora importato'}</div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#94a3b8' }}>✕</button>
        </div>

        {/* Filtro categorie */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {['Tutti', ...CATEGORIE_PANIERE].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ ...C.btn(catFilter===c ? (catColor[c]||ACCENT) : '#f1f5f9', catFilter===c ? '#fff' : '#374151', true), fontSize:11 }}>
              {c}
            </button>
          ))}
        </div>

        {/* Lista scenari */}
        <div style={{ marginBottom:16 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:24, color:'#94a3b8', fontSize:13 }}>
              {catFilter === 'Tutti' ? 'Tutti gli scenari di questa categoria sono già stati importati.' : 'Tutti gli scenari di questa categoria sono già presenti.'}
            </div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:12, color:'#64748b' }}>{filtered.length} scenari disponibili</span>
                <button onClick={() => toggleAll(filtered)}
                  style={{ ...C.btn('#f1f5f9','#374151',true), fontSize:11 }}>
                  {filtered.every(r => sel[PANIERE_DEFAULT.indexOf(r)]) ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
              </div>
              {filtered.map(r => {
                const i = PANIERE_DEFAULT.indexOf(r);
                const score = r.probabilita * r.impatto;
                return (
                  <div key={i} onClick={() => toggle(i)}
                    style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', borderRadius:10, marginBottom:6, cursor:'pointer', border:`1.5px solid ${sel[i] ? catColor[r.cat]||ACCENT : '#e5eaf0'}`, background: sel[i] ? (catColor[r.cat]||ACCENT)+'08' : '#fafafa' }}>
                    <input type='checkbox' checked={!!sel[i]} onChange={() => toggle(i)} onClick={e => e.stopPropagation()}
                      style={{ width:16, height:16, accentColor: catColor[r.cat]||ACCENT, flexShrink:0, marginTop:2 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{r.minaccia}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10, background: catColor[r.cat]+'22', color: catColor[r.cat] }}>{r.cat}</span>
                        <StatusBadge label={`Rischio ${riskLabel(score)}: ${score}`} color={riskColor(score)} />
                      </div>
                      <div style={{ fontSize:12, color:'#64748b', marginBottom:3 }}><strong>Vulnerabilità:</strong> {r.vulnerabilita}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>P:{r.probabilita} · I:{r.impatto} · Residuo:{r.rischioResiduo}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', gap:10, alignItems:'center', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
          <span style={{ fontSize:13, color:'#64748b' }}>{selCount > 0 ? `${selCount} scenario${selCount!==1?'i':''} selezionat${selCount!==1?'i':'o'}` : 'Nessuno selezionato'}</span>
          <div style={C.row}>
            <button onClick={onClose} style={C.btn('#f1f5f9','#374151')}>Annulla</button>
            <button onClick={doImport} disabled={selCount===0} style={{ ...C.btn(ACCENT,'#fff'), opacity: selCount===0 ? 0.5 : 1 }}>
              ⬇️ Importa {selCount > 0 ? selCount : ''} scenario{selCount!==1?'i':''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
const riskColor = r => r<=4?'#16a34a':r<=8?'#d97706':r<=12?'#ea580c':'#dc2626';
const riskLabel = r => r<=4?'Basso':r<=8?'Medio':r<=12?'Alto':'Critico';

export function ScenarioForm({ initial, onSave, onCancel, misure = [] }) {
  const empty = { minaccia:'', vulnerabilita:'', probabilita:1, impatto:1, misureIds:[], misureMitigazione:'', rischioResiduo:1 };
  const [f, setF] = useState(initial || empty);
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  const aiCtx = useAIRecord({ recordName: f.minaccia, sectionLabel: 'Analisi dei Rischi GDPR' });
  const rischio = f.probabilita * f.impatto;

  const toggleMisura = id => {
    const cur = f.misureIds||[];
    setF(p=>({...p, misureIds: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur,id]}));
  };

  const TIPO_COLOR = { Tecnica:'#0891b2', Organizzativa:'#7c3aed', Fisica:'#b45309', Logica:'#4f46e5' };
  const statCol = s => s==='Implementata'?'#16a34a':s==='In corso'?'#d97706':s==='Pianificata'?'#2563eb':'#94a3b8';

  return (
    <AICtx.Provider value={aiCtx}>
    <Modal onClose={onCancel} maxWidth={640}>
      <h3 style={{margin:'0 0 18px',color:'#0f172a'}}>{initial?'✏️ Modifica scenario':'➕ Nuovo scenario di rischio'}</h3>
      <Fld id='minaccia' label='Minaccia *' val={f.minaccia} onChange={u} ph='es. Accesso non autorizzato, Perdita dati...'/>
      <Fld id='vulnerabilita' label='Vulnerabilità' type='textarea' val={f.vulnerabilita} onChange={u} ph='es. Mancanza di autenticazione forte, assenza di backup...'/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 16px'}}>
        <div>
          <label style={C.lbl}>Probabilità (1-4)</label>
          <input type='range' min={1} max={4} step={1} value={f.probabilita}
            onChange={e=>u('probabilita',parseInt(e.target.value))}
            style={{width:'100%',accentColor:ACCENT,marginBottom:4}}/>
          <div style={{fontSize:12,color:'#64748b',textAlign:'center'}}>{f.probabilita} — {PROB_LABELS[f.probabilita]}</div>
        </div>
        <div>
          <label style={C.lbl}>Impatto (1-4)</label>
          <input type='range' min={1} max={4} step={1} value={f.impatto}
            onChange={e=>u('impatto',parseInt(e.target.value))}
            style={{width:'100%',accentColor:ACCENT,marginBottom:4}}/>
          <div style={{fontSize:12,color:'#64748b',textAlign:'center'}}>{f.impatto} — {IMP_LABELS[f.impatto]}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'12px 0'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:6}}>Rischio</div>
          <div style={{width:52,height:52,borderRadius:12,background:riskColor(rischio),display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff'}}>
            <span style={{fontWeight:800,fontSize:18}}>{rischio}</span>
            <span style={{fontSize:9,fontWeight:600,opacity:.9}}>{riskLabel(rischio)}</span>
          </div>
        </div>
      </div>

      {/* Misure Art.32 dalla libreria */}
      {misure.length > 0 && (
        <div style={{marginBottom:14}}>
          <label style={C.lbl}>🔒 Misure di sicurezza Art.32 (dalla libreria)</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {misure.map(m=>{
              const sel = (f.misureIds||[]).includes(m.id);
              const sc = statCol(m.stato);
              return (
                <button key={m.id} type='button' onClick={()=>toggleMisura(m.id)}
                  style={{...C.btn(sel?sc:'#f1f5f9', sel?'#fff':'#374151', true), border:`1.5px solid ${sel?sc:'#e2e8f0'}`, borderRadius:16}}>
                  {sel?'✓ ':''}{m.nome}
                  <span style={{opacity:.6,fontSize:10}}> ({m.tipo})</span>
                </button>
              );
            })}
          </div>
          {(f.misureIds||[]).length > 0 && (
            <div style={{fontSize:11,color:'#16a34a',marginTop:4,fontWeight:600}}>
              ✓ {(f.misureIds||[]).length} misura{(f.misureIds||[]).length!==1?'e':''} selezionata{(f.misureIds||[]).length!==1?'e':''}
            </div>
          )}
        </div>
      )}

      <Fld id='misureMitigazione' label='Note aggiuntive sulle misure di mitigazione' type='textarea' val={f.misureMitigazione} onChange={u} ph='es. Note specifiche non coperte dalle misure sopra...'/>
      <div style={{marginBottom:18}}>
        <label style={C.lbl}>Rischio residuo (1-4) dopo mitigazione</label>
        <input type='range' min={1} max={4} step={1} value={f.rischioResiduo}
          onChange={e=>u('rischioResiduo',parseInt(e.target.value))}
          style={{width:'100%',accentColor:riskColor(f.rischioResiduo*f.rischioResiduo)}}/>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginTop:2}}>
          <span>1 — Basso</span><span style={{fontWeight:700,color:riskColor(f.rischioResiduo*2)}}>{f.rischioResiduo} — {PROB_LABELS[f.rischioResiduo]}</span><span>4 — Molto Alto</span>
        </div>
      </div>
      <div style={C.row}>
        <button style={C.btn()} onClick={()=>{if(!f.minaccia.trim()){alert('Inserisci la minaccia');return;}onSave({...f,id:initial?.id||Date.now().toString()});}}>💾 Salva</button>
        <button style={C.btn('#f1f5f9','#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </Modal>
    </AICtx.Provider>
  );
}

function RiskMatrix({ scenarios }) {
  const cells = {};
  scenarios.forEach(s => {
    const k = `${s.probabilita}-${s.impatto}`;
    cells[k] = (cells[k]||0)+1;
  });
  return (
    <div style={{marginBottom:20}}>
      <SectionTitle>🗺️ Matrice dei Rischi</SectionTitle>
      <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',height:176,paddingBottom:4}}>
          {[4,3,2,1].map(p=><div key={p} style={{fontSize:10,color:'#94a3b8',textAlign:'right',lineHeight:'40px'}}>{PROB_LABELS[p]}</div>)}
        </div>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,44px)',gridTemplateRows:'repeat(4,44px)',gap:3}}>
            {[4,3,2,1].map(p=>[1,2,3,4].map(i=>{
              const score=p*i, k=`${p}-${i}`, n=cells[k]||0;
              return (
                <div key={k} style={{width:44,height:44,borderRadius:6,background:riskColor(score),opacity:.7+.3*(n>0?1:0),display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor:'default'}}
                  title={`P:${p} I:${i} Rischio:${score} ${n>0?`(${n} scenario${n>1?'i':''})`:''}` }>
                  {n>0&&<span style={{fontWeight:800,fontSize:15,color:'#fff'}}>{n}</span>}
                </div>
              );
            }))}
          </div>
          <div style={{display:'flex',gap:3,marginTop:4}}>
            {[1,2,3,4].map(i=><div key={i} style={{width:44,textAlign:'center',fontSize:10,color:'#94a3b8'}}>{IMP_LABELS[i]}</div>)}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,marginLeft:12}}>
          {[['#16a34a','Basso (1-4)'],['#d97706','Medio (5-8)'],['#ea580c','Alto (9-12)'],['#dc2626','Critico (13-16)']].map(([c,l])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#64748b'}}>
              <div style={{width:12,height:12,borderRadius:3,background:c}}/>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScenarioList({ scenarios, onAdd, onEdit, onDelete, onPaniere, misure = [] }) {
  const [confirmDel, setConfirmDel] = useState(null);
  const misuraMap = Object.fromEntries(misure.map(m=>[m.id,m]));
  const statCol = s => s==='Implementata'?'#16a34a':s==='In corso'?'#d97706':s==='Pianificata'?'#2563eb':'#94a3b8';
  return (
    <div>
      <div style={{...C.row,justifyContent:'space-between',marginBottom:12}}>
        <SectionTitle>⚠️ Scenari di Rischio</SectionTitle>
        <div style={C.row}>
          <button style={C.btn('#7c3aed','#fff',true)} onClick={onPaniere}>📚 Paniere default</button>
          <button style={C.btn(ACCENT,'#fff',true)} onClick={onAdd}>+ Aggiungi scenario</button>
        </div>
      </div>
      {scenarios.length===0
        ? <div style={{textAlign:'center',padding:24,color:'#94a3b8',fontSize:13}}>Nessuno scenario ancora.</div>
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {scenarios.map(s=>{
              const rischio = s.probabilita*s.impatto;
              const misureCollegate = (s.misureIds||[]).map(id=>misuraMap[id]).filter(Boolean);
              return (
                <div key={s.id} style={{...C.card,padding:'12px 16px',display:'flex',gap:12,alignItems:'flex-start',borderLeft:`4px solid ${riskColor(rischio)}`}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:13,color:'#0f172a'}}>{s.minaccia}</span>
                      <StatusBadge label={`Rischio ${riskLabel(rischio)}: ${rischio}`} color={riskColor(rischio)}/>
                    </div>
                    {s.vulnerabilita&&<div style={{fontSize:12,color:'#64748b',marginBottom:2}}>Vulnerabilità: {s.vulnerabilita}</div>}
                    <div style={{display:'flex',gap:12,fontSize:11,color:'#94a3b8'}}>
                      <span>P:{s.probabilita} ({PROB_LABELS[s.probabilita]})</span>
                      <span>I:{s.impatto} ({IMP_LABELS[s.impatto]})</span>
                      {s.rischioResiduo&&<span>Residuo: {s.rischioResiduo}</span>}
                    </div>
                    {misureCollegate.length>0&&(
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
                        {misureCollegate.map(m=>(
                          <span key={m.id} style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:10,background:statCol(m.stato)+'18',color:statCol(m.stato),border:`1px solid ${statCol(m.stato)}44`}}>
                            🔒 {m.nome}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.misureMitigazione&&<div style={{fontSize:12,color:'#374151',marginTop:4}}>📝 {s.misureMitigazione}</div>}
                  </div>
                  <div style={C.row}>
                    <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onEdit(s)}>✏️</button>
                    {confirmDel===s.id
                      ?<><button style={C.btn('#dc2626','#fff',true)} onClick={()=>{onDelete(s.id);setConfirmDel(null);}}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setConfirmDel(null)}>✕</button></>
                      :<button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setConfirmDel(s.id)}>🗑️</button>}
                  </div>
                </div>
              );
            })}
          </div>}
    </div>
  );
}

export function TrattamentoSelector({ trattamenti, selectedId, onSelect }) {
  return (
    <div style={{...C.card,padding:0,overflow:'hidden',minWidth:220,maxWidth:260}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',fontWeight:700,fontSize:12,color:'#475569',textTransform:'uppercase',letterSpacing:'.4px'}}>Trattamenti</div>
      {trattamenti.length===0
        ? <div style={{padding:'24px 16px',textAlign:'center',fontSize:12,color:'#94a3b8'}}>Nessun trattamento.<br/>Crealo nel tab Registro.</div>
        : trattamenti.map(t=>(
            <button key={t.id} onClick={()=>onSelect(t.id)}
              style={{display:'block',width:'100%',textAlign:'left',padding:'10px 16px',background:selectedId===t.id?'#eff6ff':'transparent',border:'none',borderBottom:'1px solid #f8fafc',cursor:'pointer',fontFamily:'inherit',borderLeft:selectedId===t.id?`3px solid ${ACCENT}`:'3px solid transparent'}}>
              <div style={{fontWeight:600,fontSize:13,color:selectedId===t.id?ACCENT:'#0f172a'}}>{t.nome}</div>
              <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{t.baseGiuridica}</div>
            </button>
          ))}
    </div>
  );
}

export default function AnalisiRischi({ trattamenti, analisi, onSave, initialSelId, misure = [] }) {
  const [selId, setSelId] = useState(initialSelId||trattamenti[0]?.id||null);
  const [showForm, setShowForm] = useState(false);
  const [editScenario, setEditScenario] = useState(null);
  const [showPaniere, setShowPaniere] = useState(false);

  const record = analisi.find(a=>a.trattamentoId===selId);
  const scenarios = record?.data?.scenarios||[];

  const persist = (newScenarios) => {
    const tratt = trattamenti.find(t=>t.id===selId);
    onSave({
      id: record?.id||Date.now().toString(),
      trattamentoId: selId,
      data: { scenarios: newScenarios },
      createdAt: record?.createdAt||new Date().toISOString(),
      label: tratt?.nome||''
    });
  };

  const handleSaveScenario = s => {
    const updated = editScenario
      ? scenarios.map(x=>x.id===s.id?s:x)
      : [...scenarios,s];
    persist(updated);
    setShowForm(false); setEditScenario(null);
  };

  const handleDelete = id => persist(scenarios.filter(s=>s.id!==id));

  const handleImportPaniere = (toAdd) => persist([...scenarios, ...toAdd]);

  return (
    <div>
      {showPaniere && (
        <PaniereModal
          existing={scenarios}
          onImport={handleImportPaniere}
          onClose={() => setShowPaniere(false)}
        />
      )}
      {(showForm||editScenario) && (
        <ScenarioForm
          initial={editScenario}
          misure={misure}
          onSave={handleSaveScenario}
          onCancel={()=>{setShowForm(false);setEditScenario(null);}}
        />
      )}
      <h3 style={{margin:'0 0 16px',color:'#0f172a',fontSize:16}}>⚠️ Analisi dei Rischi</h3>
      {trattamenti.length===0
        ? <EmptyState icon='⚠️' title='Nessun trattamento' sub='Crea prima un trattamento nel tab Registro.'/>
        : <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20,alignItems:'start'}}>
            <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId}/>
            {selId
              ? <div>
                  <RiskMatrix scenarios={scenarios}/>
                  <ScenarioList
                    scenarios={scenarios}
                    misure={misure}
                    onAdd={()=>{setEditScenario(null);setShowForm(true);}}
                    onEdit={s=>{setEditScenario(s);setShowForm(true);}}
                    onDelete={handleDelete}
                    onPaniere={() => setShowPaniere(true)}
                  />
                </div>
              : <EmptyState icon='👈' title='Seleziona un trattamento'/>}
          </div>}
    </div>
  );
}
