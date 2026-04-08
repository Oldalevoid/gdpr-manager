import { useState, useEffect, useRef } from "react";
import { supabase } from './supabase';

const PRIMARY = '#1a3a5c';
const ACCENT = '#2563eb';

const DOC_TYPES = [
  { id:'registro', label:'Registro dei Trattamenti', icon:'📋', desc:'Art. 30 GDPR', color:'#2563eb',
    fields:[
      {id:'tipoDati',label:'Tipologie di dati trattati',type:'textarea',ph:'es. anagrafici, contrattuali, navigazione...'},
      {id:'finalita',label:'Finalità dei trattamenti',type:'textarea',ph:'es. gestione clienti, marketing, adempimenti fiscali...'},
      {id:'responsabili',label:'Responsabili esterni del trattamento',type:'textarea',ph:'es. commercialista, provider hosting...'},
      {id:'retention',label:'Tempi di conservazione',type:'textarea',ph:'es. dati fiscali 10 anni, marketing 2 anni...'},
      {id:'sicurezza',label:'Misure di sicurezza adottate',type:'textarea',ph:'es. backup, antivirus, crittografia, 2FA...'},
    ]},
  { id:'informativa', label:'Informativa Privacy', icon:'📄', desc:'Art. 13/14 GDPR', color:'#7c3aed',
    fields:[
      {id:'interessati',label:'Categorie di interessati',type:'textarea',ph:'es. clienti, dipendenti, fornitori...'},
      {id:'canali',label:'Canali di raccolta dati',type:'textarea',ph:'es. sito web, moduli cartacei, email...'},
      {id:'baseGiuridica',label:'Base giuridica',type:'textarea',ph:'es. consenso Art.6.1.a, contratto Art.6.1.b...'},
      {id:'paesiTerzi',label:'Trasferimenti paesi terzi (opz.)',type:'text',ph:'es. USA tramite SCC, nessuno'},
      {id:'dettagli',label:'Note aggiuntive (opz.)',type:'textarea',ph:'Altre informazioni rilevanti...'},
    ]},
  { id:'nomina29', label:'Nomina ex Art. 29', icon:'✍️', desc:'Incaricati al trattamento', color:'#059669',
    fields:[
      {id:'incaricato',label:'Nome e cognome incaricato',type:'text',ph:'es. Mario Rossi'},
      {id:'ruolo',label:'Ruolo / Mansione',type:'text',ph:'es. Responsabile Amministrativo'},
      {id:'trattamenti',label:'Trattamenti assegnati',type:'textarea',ph:'es. gestione dati clienti, elaborazione paghe...'},
      {id:'istruzioni',label:'Istruzioni operative specifiche',type:'textarea',ph:'es. non condividere dati senza autorizzazione...'},
    ]},
  { id:'databreach', label:'Data Breach Policy', icon:'🚨', desc:'Art. 33/34 GDPR', color:'#dc2626',
    fields:[
      {id:'referente',label:'Referente interno data breach',type:'text',ph:'es. Mario Rossi, IT Manager'},
      {id:'processi',label:'Sistemi/processi che gestiscono dati',type:'textarea',ph:'es. CRM, ERP, server email...'},
      {id:'tempiNotifica',label:'Tempi e canali notifica interna',type:'textarea',ph:'es. notifica entro 4 ore al DPO...'},
      {id:'contenimento',label:'Misure di contenimento disponibili',type:'textarea',ph:'es. blocco accessi, restore backup...'},
    ]},
  { id:'diritti', label:'Policy Diritti Interessati', icon:'⚖️', desc:'Art. 15-22 GDPR', color:'#d97706',
    fields:[
      {id:'referente',label:'Referente per le richieste',type:'text',ph:'es. privacy@azienda.it'},
      {id:'modalita',label:'Modalità di esercizio dei diritti',type:'textarea',ph:'es. email, PEC, raccomandata...'},
      {id:'tempiRisposta',label:'Tempi di risposta',type:'text',ph:'es. entro 30 giorni, prorogabili di 60 gg'},
    ]},
  { id:'regolamento', label:'Regolamento Strumenti Informatici', icon:'💻', desc:'D.Lgs. 196/2003 + Art.4 L.300/70', color:'#4f46e5',
    fields:[
      {id:'strumenti',label:'Strumenti aziendali in dotazione',type:'textarea',ph:'es. PC, smartphone, email, cloud, VPN...'},
      {id:'politiche',label:'Politiche di utilizzo',type:'textarea',ph:'es. uso personale limitato, siti vietati...'},
      {id:'monitoraggio',label:'Modalità di monitoraggio',type:'textarea',ph:'es. log accessi per sicurezza, nessuno...'},
      {id:'sanzioni',label:'Conseguenze in caso di violazione',type:'textarea',ph:'es. provvedimenti disciplinari CCNL...'},
    ]},
  { id:'dpa', label:'Data Processing Agreement', icon:'🤝', desc:'Art. 28 GDPR — DPA', color:'#0891b2',
    fields:[
      {id:'responsabile',label:'Responsabile del trattamento (fornitore)',type:'text',ph:'es. Google LLC, Salesforce Inc., Studio Bianchi...'},
      {id:'servizio',label:'Servizio/attività oggetto del DPA',type:'textarea',ph:'es. hosting cloud, gestione paghe, supporto IT...'},
      {id:'datiTrattati',label:'Categorie di dati trattati dal responsabile',type:'textarea',ph:'es. dati anagrafici clienti, dati sanitari dipendenti...'},
      {id:'finalitaDpa',label:'Finalità del trattamento affidato',type:'textarea',ph:'es. erogazione del servizio SaaS, elaborazione cedolini...'},
      {id:'misure',label:'Misure di sicurezza richieste al responsabile',type:'textarea',ph:'es. crittografia TLS, accesso con 2FA, backup giornaliero...'},
      {id:'subResponsabili',label:'Sub-responsabili autorizzati (opz.)',type:'textarea',ph:'es. AWS (hosting), Stripe (pagamenti)...'},
      {id:'paeseSede',label:'Paese di sede del responsabile',type:'text',ph:'es. USA, Germania, Italia...'},
    ]},
];

const DEFAULT_SYSTEM = (docLabel) =>
  `Sei un esperto consulente GDPR e privacy italiano con 15 anni di esperienza. Genera documenti professionali, dettagliati e conformi alla normativa vigente (GDPR, D.Lgs. 196/2003 e successive modifiche). Scrivi sempre in italiano. Il documento deve essere immediatamente utilizzabile senza ulteriori modifiche. Non aggiungere note o disclaimer sul fatto che il documento è generato da AI.`;

const DEFAULT_PARAMS = { temperature: 0.3 };

function buildPrompt(id, client, inp, settings, assets, suppliers) {
  const ci = `Ragione Sociale: ${client.ragioneSociale}\nSettore: ${client.settore}\nTitolare: ${client.titolare}\nP.IVA: ${client.piva}\nSede: ${client.sede}${client.dpo?`\nDPO: ${client.dpo}`:''}`;
  const assetStr = assets?.length ? `\nASSET AZIENDALI:\n${assets.map(a=>`- ${a.nome} (${a.categoria}${a.note?', '+a.note:''})`).join('\n')}` : '';
  const supplierStr = suppliers?.length ? `\nFORNITORI NOTI:\n${suppliers.map(s=>`- ${s.nome} | ${s.ruolo} | ${s.servizio}`).join('\n')}` : '';
  const tmplStr = settings?.templateText ? `\n\nTEMPLATE DI RIFERIMENTO (segui questa struttura adattando il contenuto al cliente):\n${settings.templateText}` : '';
  const base = `DATI CLIENTE:\n${ci}${assetStr}${supplierStr}\n`;
  const map = {
    registro: base+`DOCUMENTO DA GENERARE: Registro delle Attività di Trattamento (Art. 30 GDPR)\nDati trattati: ${inp.tipoDati||'-'}\nFinalità: ${inp.finalita||'-'}\nResponsabili: ${inp.responsabili||'-'}\nRetention: ${inp.retention||'-'}\nSicurezza: ${inp.sicurezza||'-'}\nCrea registro completo con intestazione, schede per ogni categoria di trattamento (finalità, base giuridica, categorie interessati, dati, destinatari, retention, sicurezza), spazio firme.`,
    informativa: base+`DOCUMENTO: Informativa Privacy (Art. 13-14 GDPR)\nInteressati: ${inp.interessati||'-'}\nCanali: ${inp.canali||'-'}\nBase giuridica: ${inp.baseGiuridica||'-'}\nPaesi terzi: ${inp.paesiTerzi||'nessuno'}\nNote: ${inp.dettagli||'-'}\nCrea informativa completa con tutti gli elementi obbligatori, tutti i diritti degli interessati, reclamo al Garante.`,
    nomina29: base+`DOCUMENTO: Nomina Incaricato al Trattamento (Art. 29 GDPR, Art. 2-quaterdecies D.Lgs. 196/2003)\nIncaricato: ${inp.incaricato||'-'}\nRuolo: ${inp.ruolo||'-'}\nTrattamenti: ${inp.trattamenti||'-'}\nIstruzioni: ${inp.istruzioni||'-'}\nCrea nomina formale con riferimenti normativi, designazione, elenco trattamenti autorizzati, obblighi, spazio firme.`,
    databreach: base+`DOCUMENTO: Data Breach Policy (Art. 33-34 GDPR)\nReferente: ${inp.referente||'-'}\nSistemi: ${inp.processi||'-'}\nNotifica: ${inp.tempiNotifica||'-'}\nContenimento: ${inp.contenimento||'-'}\nCrea policy completa: definizioni, procedura step-by-step, notifica Garante entro 72h, registro data breach.`,
    diritti: base+`DOCUMENTO: Policy Gestione Diritti degli Interessati (Art. 15-22 GDPR)\nReferente: ${inp.referente||'-'}\nModalità: ${inp.modalita||'-'}\nTempi: ${inp.tempiRisposta||'-'}\nCrea policy con tutti i diritti, procedura ricezione richieste, tempi risposta e proroghe, registro richieste.`,
    regolamento: base+`DOCUMENTO: Regolamento Utilizzo Strumenti Informatici (GDPR, D.Lgs.196/2003, Provv.Garante 2007, Art.4 L.300/70)\nStrumenti: ${inp.strumenti||'-'}\nPolitiche: ${inp.politiche||'-'}\nMonitoraggio: ${inp.monitoraggio||'-'}\nSanzioni: ${inp.sanzioni||'-'}\nCrea regolamento completo con disciplina per ogni strumento, informativa Art.4 L.300/70, sanzioni graduate, firma presa visione.`,
    dpa: base+`DOCUMENTO: Data Processing Agreement — DPA (Art. 28 GDPR)\nTitolare: ${client.ragioneSociale} (${client.titolare})\nResponsabile del trattamento: ${inp.responsabile||'-'}\nServizio: ${inp.servizio||'-'}\nDati trattati: ${inp.datiTrattati||'-'}\nFinalità affidato: ${inp.finalitaDpa||'-'}\nMisure di sicurezza richieste: ${inp.misure||'-'}\nSub-responsabili: ${inp.subResponsabili||'nessuno'}\nPaese sede responsabile: ${inp.paeseSede||'-'}\nCrea DPA completo conforme Art.28 GDPR con: premesse, definizioni, oggetto e durata, istruzioni del titolare, obblighi del responsabile (riservatezza, sicurezza, sub-responsabili, assistenza, cancellazione/restituzione dati, audit), trasferimenti internazionali se applicabile, responsabilità, spazio firme entrambe le parti.`,
  };
  return (map[id] || base) + tmplStr;
}

// ---- DOCUMENT RENDERER ----
function DocRenderer({ content }) {
  if (!content) return null;
  const lines = content.split('\n');
  const styled = lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: 10 }} />;
    if (/^[A-ZÀÈÉÌÒÙ\s\d\-–—:.,()]{8,}$/.test(trimmed) && trimmed.length < 90 && !/^[-=*•·▸▶►]/.test(trimmed)) {
      return <div key={i} style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginTop: 22, marginBottom: 6, borderBottom: '2px solid #e2e8f0', paddingBottom: 5, letterSpacing: '.3px' }}>{trimmed}</div>;
    }
    if (/^(\d+\.(\d+\.?)?\s|Art(\.|icolo)?\s?\d|ARTICOLO\s?\d)/i.test(trimmed)) {
      return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: '#1e3a5f', marginTop: 16, marginBottom: 4 }}>{trimmed}</div>;
    }
    if (/^[A-ZÀÈÉÌÒÙ][^a-z]{0,3}[a-zA-ZÀ-ÿ\s]{2,40}:$/.test(trimmed) || /^[A-ZÀÈÉÌÒÙ][A-ZÀ-Ÿa-zà-ÿ\s]{1,40}:\s*$/.test(trimmed)) {
      return <div key={i} style={{ fontWeight: 700, fontSize: 11, color: '#6b7280', marginTop: 12, marginBottom: 2, textTransform:'uppercase', letterSpacing:'.4px' }}>{trimmed}</div>;
    }
    if (/^[-–•·▸▶►*]\s/.test(trimmed)) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 8 }}>
          <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
          <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7 }}>{trimmed.replace(/^[-–•·▸▶►*]\s+/, '')}</span>
        </div>
      );
    }
    if (/^[a-z]\)\s|^\d+\)\s/.test(trimmed)) {
      const [marker, ...rest] = trimmed.split(/(?<=^[a-z\d]\))\s/);
      return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 8 }}>
          <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{marker}</span>
          <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7 }}>{rest.join(' ')}</span>
        </div>
      );
    }
    if (/firma|data[:\s]|luogo[:\s]|il\s+titolare|il\s+responsabile|il\s+dpo/i.test(trimmed) && trimmed.length < 60) {
      return <div key={i} style={{ marginTop: 20, paddingTop: 14, borderTop: '1px dashed #e2e8f0', fontSize: 13, color: '#374151', fontStyle: 'italic' }}>{trimmed}</div>;
    }
    if (/^[=\-_]{5,}$/.test(trimmed)) {
      return <hr key={i} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />;
    }
    return <p key={i} style={{ margin: '0 0 4px', fontSize: 13.5, color: '#334155', lineHeight: 1.75 }}>{trimmed}</p>;
  });
  return <div style={{ fontFamily: '"Calibri", "Georgia", serif' }}>{styled}</div>;
}

function exportToDoc(content, filename) {
  const safe = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;margin:2cm}pre{white-space:pre-wrap;font-family:Calibri,sans-serif;font-size:11pt}</style></head><body><pre>${safe}</pre></body></html>`;
  const blob = new Blob(['\ufeff', html], {type:'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:(filename||'doc').replace(/[^a-z0-9_\-]/gi,'_')+'.doc'});
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// storage helpers removed — now using Supabase

const C = {
  card: {background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #e5eaf0'},
  btn: (bg=ACCENT,col='#fff',sm=false)=>({background:bg,color:col,border:'none',borderRadius:8,padding:sm?'6px 12px':'9px 18px',cursor:'pointer',fontWeight:600,fontSize:sm?12:14,fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}),
  inp: {width:'100%',padding:'8px 11px',border:'1.5px solid #dde3ec',borderRadius:8,fontSize:14,boxSizing:'border-box',outline:'none',fontFamily:'inherit',background:'#fff'},
  lbl: {display:'block',fontSize:11,fontWeight:700,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'},
  row: {display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'},
};

function Fld({id,label,type='text',val,onChange,ph,options}) {
  const fo=e=>e.target.style.borderColor=ACCENT, bl=e=>e.target.style.borderColor='#dde3ec';
  if(options) return (
    <div style={{marginBottom:14}}>
      <label style={C.lbl}>{label}</label>
      <select value={val||''} onChange={e=>onChange(id,e.target.value)} style={C.inp} onFocus={fo} onBlur={bl}>
        <option value=''>Seleziona...</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const Tag=type==='textarea'?'textarea':'input';
  return (
    <div style={{marginBottom:14}}>
      <label style={C.lbl}>{label}</label>
      <Tag value={val||''} onChange={e=>onChange(id,e.target.value)} placeholder={ph} rows={type==='textarea'?3:undefined}
        style={{...C.inp,resize:type==='textarea'?'vertical':undefined,minHeight:type==='textarea'?68:undefined}}
        onFocus={fo} onBlur={bl}/>
    </div>
  );
}

// ---- DOC SETTINGS MODAL ----
function DocSettingsModal({dt, settings, onSave, onClose}) {
  const [s, setS] = useState({
    systemPrompt: settings?.systemPrompt ?? DEFAULT_SYSTEM(dt.label),
    temperature: settings?.temperature ?? DEFAULT_PARAMS.temperature,
    templateText: settings?.templateText ?? '',
    templateName: settings?.templateName ?? '',
  });
  const fileRef = useRef();
  const handleFile = async e => {
    const f = e.target.files[0];
    if(!f) return;
    const text = await f.text();
    setS(p=>({...p, templateText: text, templateName: f.name}));
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{...C.card,width:'100%',maxWidth:640,maxHeight:'90vh',overflow:'auto',padding:28}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22,paddingBottom:16,borderBottom:'1px solid #f1f5f9'}}>
          <span style={{fontSize:24}}>{dt.icon}</span>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:17,color:'#0f172a'}}>⚙️ Impostazioni agente</h2>
            <div style={{fontSize:12,color:dt.color,fontWeight:600,marginTop:2}}>{dt.label}</div>
          </div>
          <button style={C.btn('#f1f5f9','#374151',true)} onClick={onClose}>✕ Chiudi</button>
        </div>
        <div style={{marginBottom:20}}>
          <label style={C.lbl}>System Prompt — Istruzioni per l'agente</label>
          <p style={{margin:'0 0 8px',fontSize:12,color:'#64748b'}}>Definisci il ruolo, il tono e le regole che l'AI deve seguire per questo documento.</p>
          <textarea value={s.systemPrompt} onChange={e=>setS(p=>({...p,systemPrompt:e.target.value}))} rows={7}
            style={{...C.inp,resize:'vertical',minHeight:140,fontFamily:'"Courier New",monospace',fontSize:13,lineHeight:1.6}}
            onFocus={e=>e.target.style.borderColor=dt.color} onBlur={e=>e.target.style.borderColor='#dde3ec'}/>
          <button style={{...C.btn('#f8fafc','#64748b',true),marginTop:6,fontSize:11}} onClick={()=>setS(p=>({...p,systemPrompt:DEFAULT_SYSTEM(dt.label)}))}>
            ↺ Ripristina default
          </button>
        </div>
        <div style={{marginBottom:20}}>
          <label style={C.lbl}>Temperature ({s.temperature})</label>
          <p style={{margin:'0 0 6px',fontSize:12,color:'#64748b'}}>Controlla quanto l'AI è precisa (0) o creativa (1). Per documenti legali si consiglia un valore basso.</p>
          <input type='range' min={0} max={1} step={0.05} value={s.temperature}
            onChange={e=>setS(p=>({...p,temperature:parseFloat(e.target.value)}))}
            style={{width:'100%',accentColor:dt.color}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginTop:2}}>
            <span>0 — Deterministico</span><span>1 — Creativo</span>
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <label style={C.lbl}>Template di riferimento</label>
          <p style={{margin:'0 0 10px',fontSize:12,color:'#64748b'}}>Carica un file .txt con la struttura che vuoi che l'AI segua.</p>
          <input ref={fileRef} type='file' accept='.txt,.doc,.docx,.md' style={{display:'none'}} onChange={handleFile}/>
          <div style={{...C.row,gap:10}}>
            <button style={C.btn(dt.color,'#fff')} onClick={()=>fileRef.current.click()}>📂 Carica file template</button>
            {s.templateName&&<button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setS(p=>({...p,templateText:'',templateName:''}))}>🗑️ Rimuovi</button>}
          </div>
          {s.templateName&&(
            <div style={{marginTop:10,padding:'8px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,fontSize:13,color:'#166534',display:'flex',alignItems:'center',gap:8}}>
              ✅ <strong>{s.templateName}</strong> — {s.templateText.length} caratteri caricati
            </div>
          )}
          {!s.templateText&&(
            <textarea value='' onChange={e=>{if(e.target.value) setS(p=>({...p,templateText:e.target.value}));}} rows={3}
              placeholder="...oppure incolla direttamente il testo del template qui"
              style={{...C.inp,marginTop:10,resize:'vertical',fontFamily:'"Courier New",monospace',fontSize:12}}
              onFocus={e=>e.target.style.borderColor=dt.color} onBlur={e=>e.target.style.borderColor='#dde3ec'}/>
          )}
        </div>
        <div style={C.row}>
          <button style={C.btn(dt.color)} onClick={()=>onSave(s)}>💾 Salva impostazioni</button>
          <button style={C.btn('#f1f5f9','#374151')} onClick={onClose}>Annulla</button>
        </div>
      </div>
    </div>
  );
}

// ---- ASSET MANAGER ----
const ASSET_CATS = ['Hardware','Software','Cloud/SaaS','Rete','Mobile','Altro'];
function AssetManager({assets, onChange}) {
  const [form,setForm]=useState({nome:'',categoria:'Hardware',note:''});
  const [editing,setEditing]=useState(null);
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));
  const save=()=>{if(!form.nome.trim())return;if(editing!==null){onChange(assets.map((a,i)=>i===editing?{...form}:a));setEditing(null);}else onChange([...assets,{...form,id:Date.now().toString()}]);setForm({nome:'',categoria:'Hardware',note:''});};
  return (
    <div>
      <div style={{...C.card,marginBottom:16}}>
        <div style={{fontWeight:700,color:'#0f172a',marginBottom:14,fontSize:14}}>{editing!==null?'✏️ Modifica asset':'➕ Aggiungi asset'}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 12px'}}>
          <Fld id='nome' label='Nome *' val={form.nome} onChange={u} ph='es. Server HP, Salesforce...'/>
          <Fld id='categoria' label='Categoria' val={form.categoria} onChange={u} options={ASSET_CATS}/>
          <Fld id='note' label='Note' val={form.note} onChange={u} ph='es. contiene dati clienti...'/>
        </div>
        <div style={C.row}>
          <button style={C.btn()} onClick={save}>{editing!==null?'💾 Aggiorna':'➕ Aggiungi'}</button>
          {editing!==null&&<button style={C.btn('#f1f5f9','#374151')} onClick={()=>{setEditing(null);setForm({nome:'',categoria:'Hardware',note:''});}}>Annulla</button>}
        </div>
      </div>
      {!assets.length?<div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:14}}>Nessun asset ancora.</div>:(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {assets.map((a,i)=>(
            <div key={a.id||i} style={{...C.card,display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
              <div style={{width:32,height:32,borderRadius:8,background:'#f0f9ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
                {{'Hardware':'🖥️','Software':'💿','Cloud/SaaS':'☁️','Rete':'🌐','Mobile':'📱','Altro':'📦'}[a.categoria]||'📦'}
              </div>
              <div style={{flex:1}}><div style={{fontWeight:600,color:'#0f172a'}}>{a.nome}</div><div style={{fontSize:12,color:'#64748b'}}>{a.categoria}{a.note&&` · ${a.note}`}</div></div>
              <div style={C.row}>
                <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>{setForm(assets[i]);setEditing(i);}}>✏️</button>
                <button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>onChange(assets.filter((_,idx)=>idx!==i))}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- SUPPLIER MANAGER ----
const SUP_ROLES = ['Responsabile del trattamento (Art.28)','Contitolare','Terzo','Fornitore IT','Consulente'];
function SupplierManager({suppliers, onChange}) {
  const [form,setForm]=useState({nome:'',ruolo:'Responsabile del trattamento (Art.28)',servizio:'',paeseSede:'Italia',contatto:''});
  const [editing,setEditing]=useState(null);
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));
  const save=()=>{if(!form.nome.trim()||!form.servizio.trim())return;if(editing!==null){onChange(suppliers.map((s,i)=>i===editing?{...form}:s));setEditing(null);}else onChange([...suppliers,{...form,id:Date.now().toString()}]);setForm({nome:'',ruolo:'Responsabile del trattamento (Art.28)',servizio:'',paeseSede:'Italia',contatto:''});};
  const rc={'Responsabile del trattamento (Art.28)':'#2563eb','Contitolare':'#7c3aed','Terzo':'#64748b','Fornitore IT':'#059669','Consulente':'#d97706'};
  return (
    <div>
      <div style={{...C.card,marginBottom:16}}>
        <div style={{fontWeight:700,color:'#0f172a',marginBottom:14,fontSize:14}}>{editing!==null?'✏️ Modifica fornitore':'➕ Aggiungi fornitore'}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
          <Fld id='nome' label='Ragione Sociale *' val={form.nome} onChange={u} ph='es. Google LLC...'/>
          <Fld id='ruolo' label='Ruolo GDPR' val={form.ruolo} onChange={u} options={SUP_ROLES}/>
          <Fld id='servizio' label='Servizio *' val={form.servizio} onChange={u} ph='es. Cloud storage...'/>
          <Fld id='paeseSede' label='Paese sede' val={form.paeseSede} onChange={u} ph='es. Italia, USA...'/>
          <div style={{gridColumn:'1/-1'}}><Fld id='contatto' label='Referente (opz.)' val={form.contatto} onChange={u} ph='es. Mario Bianchi — privacy@fornitore.it'/></div>
        </div>
        <div style={C.row}>
          <button style={C.btn()} onClick={save}>{editing!==null?'💾 Aggiorna':'➕ Aggiungi'}</button>
          {editing!==null&&<button style={C.btn('#f1f5f9','#374151')} onClick={()=>{setEditing(null);setForm({nome:'',ruolo:'Responsabile del trattamento (Art.28)',servizio:'',paeseSede:'Italia',contatto:''});}}>Annulla</button>}
        </div>
      </div>
      {!suppliers.length?<div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:14}}>Nessun fornitore ancora.</div>:(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {suppliers.map((s,i)=>(
            <div key={s.id||i} style={{...C.card,display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
              <div style={{width:32,height:32,borderRadius:8,background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🏭</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:'#0f172a'}}>{s.nome}</div>
                <div style={{fontSize:12,color:'#64748b'}}>{s.servizio} · {s.paeseSede}</div>
                <span style={{display:'inline-block',marginTop:3,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:(rc[s.ruolo]||'#64748b')+'18',color:rc[s.ruolo]||'#64748b'}}>{s.ruolo}</span>
              </div>
              <div style={C.row}>
                <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>{setForm(suppliers[i]);setEditing(i);}}>✏️</button>
                <button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>onChange(suppliers.filter((_,idx)=>idx!==i))}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- REPO ----
function ClientRepo({docs, onView, onDelete, onExport}) {
  const [tab,setTab]=useState(DOC_TYPES[0].id);
  const [delId,setDelId]=useState(null);
  const dt=DOC_TYPES.find(d=>d.id===tab);
  const filtered=docs.filter(d=>d.tipo===tab).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {DOC_TYPES.map(d=>{const n=docs.filter(x=>x.tipo===d.id).length;return(
          <button key={d.id} style={{...C.btn(tab===d.id?d.color:'#f1f5f9',tab===d.id?'#fff':'#374151',true),gap:5}} onClick={()=>setTab(d.id)}>
            {d.icon} {d.label.split(' ').slice(0,2).join(' ')}
            <span style={{background:tab===d.id?'rgba(255,255,255,.25)':'#e2e8f0',borderRadius:12,padding:'1px 6px',fontSize:11,fontWeight:800}}>{n}</span>
          </button>
        );})}
      </div>
      {!filtered.length?(
        <div style={{...C.card,textAlign:'center',padding:'36px',color:'#94a3b8'}}>
          <div style={{fontSize:36,marginBottom:10}}>{dt?.icon}</div>
          <div style={{fontWeight:600}}>Nessun "{dt?.label}" ancora generato</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(doc=>(
            <div key={doc.id} style={{...C.card,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              <div style={{width:36,height:36,borderRadius:9,background:dt?.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>{dt?.icon}</div>
              <div style={{flex:1,minWidth:120}}>
                <div style={{fontWeight:700,color:'#0f172a',fontSize:14}}>{doc.label}</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{new Date(doc.createdAt).toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})} alle {new Date(doc.createdAt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <div style={C.row}>
                <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onView(doc)}>👁️</button>
                <button style={C.btn('#4f46e5','#fff',true)} onClick={()=>onExport(doc.contenuto,doc.label)}>📥 .doc</button>
                {delId===doc.id
                  ?<><button style={C.btn('#dc2626','#fff',true)} onClick={()=>{onDelete(doc);setDelId(null);}}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setDelId(null)}>✕</button></>
                  :<button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setDelId(doc.id)}>🗑️</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- CLIENT DETAIL ----
function ClientDetail({client, docs, assets, suppliers, docSettings, onGenerate, onView, onDeleteDoc, onExport, onChangeAssets, onChangeSuppliers, onOpenSettings}) {
  const [tab,setTab]=useState('docs');
  const getDoc=id=>docs.find(d=>d.tipo===id);
  const pct=Math.round((docs.length/DOC_TYPES.length)*100);
  const TB=({id,label,badge})=>(
    <button onClick={()=>setTab(id)} style={{background:'none',border:'none',borderBottom:tab===id?`2px solid ${ACCENT}`:'2px solid transparent',color:tab===id?ACCENT:'#64748b',fontWeight:tab===id?700:500,fontSize:14,cursor:'pointer',padding:'10px 16px',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
      {label}{badge!==undefined&&<span style={{background:tab===id?ACCENT+'18':'#f1f5f9',color:tab===id?ACCENT:'#64748b',borderRadius:12,padding:'1px 7px',fontSize:11,fontWeight:700}}>{badge}</span>}
    </button>
  );
  return (
    <div>
      <div style={{...C.card,marginBottom:0,borderBottomLeftRadius:0,borderBottomRightRadius:0,borderBottom:'none',display:'flex',gap:14,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div style={{width:48,height:48,borderRadius:12,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🏢</div>
        <div style={{flex:1,minWidth:180}}>
          <h2 style={{margin:'0 0 5px',color:'#0f172a'}}>{client.ragioneSociale}</h2>
          <div style={{display:'flex',flexWrap:'wrap',gap:'3px 14px',fontSize:13,color:'#64748b'}}>
            <span>📊 {client.settore}</span><span>👤 {client.titolare}</span><span>🏛️ {client.piva}</span><span>📍 {client.sede}</span>
            {client.dpo&&<span>🔐 DPO: {client.dpo}</span>}
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:700,color:pct===100?'#16a34a':'#64748b'}}>{docs.length}/{DOC_TYPES.length} doc</div>
          <div style={{background:'#f1f5f9',borderRadius:8,height:5,width:110,marginTop:5,marginLeft:'auto'}}><div style={{background:pct===100?'#16a34a':ACCENT,borderRadius:8,height:'100%',width:`${pct}%`,transition:'width .5s'}}/></div>
        </div>
      </div>
      <div style={{background:'#fff',borderLeft:'1px solid #e5eaf0',borderRight:'1px solid #e5eaf0',display:'flex',gap:0,borderBottom:'1px solid #e5eaf0',marginBottom:20}}>
        <TB id='docs' label='📋 Documenti GDPR'/>
        <TB id='repo' label='📚 Repository' badge={docs.length}/>
        <TB id='assets' label='🖥️ Asset' badge={assets.length}/>
        <TB id='suppliers' label='🏭 Fornitori' badge={suppliers.length}/>
      </div>
      {tab==='docs'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:12}}>
          {DOC_TYPES.map(dt=>{
            const doc=getDoc(dt.id);
            const hasSettings=docSettings[dt.id]&&(docSettings[dt.id].systemPrompt!==DEFAULT_SYSTEM(dt.label)||docSettings[dt.id].templateText);
            return (
              <div key={dt.id} style={{...C.card,borderLeft:`4px solid ${dt.color}`}}>
                <div style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                  <span style={{fontSize:22,flexShrink:0}}>{dt.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:'#0f172a',fontSize:14}}>{dt.label}</div>
                    <div style={{fontSize:11,color:dt.color,fontWeight:600,marginTop:1}}>{dt.desc}</div>
                  </div>
                  <div style={{display:'flex',gap:4,alignItems:'center'}}>
                    {hasSettings&&<span style={{fontSize:10,background:dt.color+'18',color:dt.color,fontWeight:700,padding:'2px 6px',borderRadius:20}}>⚙️ custom</span>}
                    {doc&&<span style={{background:'#dcfce7',color:'#16a34a',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20}}>✅</span>}
                  </div>
                </div>
                {doc&&<div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>Generato: {new Date(doc.createdAt).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                <div style={C.row}>
                  <button style={C.btn(dt.color,'#fff',true)} onClick={()=>onGenerate(dt)}>{doc?'🔄 Rigenera':'✨ Genera'}</button>
                  {doc&&<button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onView(doc)}>👁️</button>}
                  <button style={C.btn('#f8fafc','#475569',true)} onClick={()=>onOpenSettings(dt)} title="Impostazioni agente">⚙️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {tab==='repo'&&<ClientRepo docs={docs} onView={onView} onDelete={onDeleteDoc} onExport={onExport}/>}
      {tab==='assets'&&<AssetManager assets={assets} onChange={onChangeAssets}/>}
      {tab==='suppliers'&&<SupplierManager suppliers={suppliers} onChange={onChangeSuppliers}/>}
    </div>
  );
}

// ---- DASHBOARD ----
function Dashboard({clients,onOpen,onNew,onEdit,onDelete}) {
  const [del,setDel]=useState(null);
  return (
    <div>
      <div style={{...C.row,justifyContent:'space-between',marginBottom:20}}>
        <div><h2 style={{margin:0,fontSize:21,color:'#0f172a'}}>👥 Clienti</h2><p style={{margin:'3px 0 0',color:'#64748b',fontSize:13}}>{clients.length} cliente{clients.length!==1?'i':''} registrat{clients.length!==1?'i':'o'}</p></div>
        <button style={C.btn()} onClick={onNew}>+ Nuovo Cliente</button>
      </div>
      {!clients.length?(
        <div style={{...C.card,textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:52,marginBottom:14}}>📁</div>
          <h3 style={{margin:'0 0 8px',color:'#1e293b'}}>Nessun cliente ancora</h3>
          <p style={{margin:'0 0 20px',color:'#94a3b8'}}>Inizia aggiungendo il tuo primo cliente</p>
          <button style={C.btn()} onClick={onNew}>+ Aggiungi Cliente</button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(285px,1fr))',gap:14}}>
          {clients.map(c=>{
            const pct=Math.round((c._docCount||0)/DOC_TYPES.length*100);
            return (
              <div key={c.id} style={{...C.card,transition:'all .18s'}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 18px rgba(37,99,235,.1)';e.currentTarget.style.borderColor='#93c5fd';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.07)';e.currentTarget.style.borderColor='#e5eaf0';}}>
                <div onClick={()=>onOpen(c)} style={{cursor:'pointer',marginBottom:12}}>
                  <div style={{display:'flex',gap:10,marginBottom:10,alignItems:'center'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>🏢</div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.ragioneSociale}</div><div style={{fontSize:12,color:'#64748b'}}>{c.settore}</div></div>
                  </div>
                  <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>👤 {c.titolare} · 🏛️ {c.piva}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10}}>
                    <span style={{fontSize:12,fontWeight:600,color:pct===100?'#16a34a':pct>0?'#d97706':'#94a3b8'}}>{c._docCount||0}/{DOC_TYPES.length} doc</span>
                    <div style={{background:'#f1f5f9',borderRadius:8,height:5,width:80}}><div style={{background:pct===100?'#16a34a':ACCENT,borderRadius:8,height:'100%',width:`${pct}%`,transition:'width .5s'}}/></div>
                  </div>
                </div>
                <div style={{borderTop:'1px solid #f1f5f9',paddingTop:10,...C.row}}>
                  <button style={C.btn('#f1f5f9','#374151',true)} onClick={e=>{e.stopPropagation();onEdit(c);}}>✏️ Modifica</button>
                  {del===c.id
                    ?<><button style={C.btn('#dc2626','#fff',true)} onClick={e=>{e.stopPropagation();onDelete(c.id);setDel(null);}}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={e=>{e.stopPropagation();setDel(null);}}>✕</button></>
                    :<button style={C.btn('#fff5f5','#dc2626',true)} onClick={e=>{e.stopPropagation();setDel(c.id);}}>🗑️</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- CLIENT FORM ----
function ClientForm({initial,onSave,onCancel}) {
  const [f,setF]=useState(initial||{ragioneSociale:'',settore:'',titolare:'',piva:'',sede:'',dpo:'',email:'',telefono:''});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div style={{...C.card,maxWidth:680}}>
      <h2 style={{margin:'0 0 20px',color:'#0f172a'}}>{initial?'✏️ Modifica Cliente':'➕ Nuovo Cliente'}</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
        <div style={{gridColumn:'1/-1'}}><Fld id='ragioneSociale' label='Ragione Sociale *' val={f.ragioneSociale} onChange={u} ph='es. Rossi S.r.l.'/></div>
        <Fld id='settore' label='Settore *' val={f.settore} onChange={u} ph='es. Commercio, Sanità, IT...'/>
        <Fld id='piva' label='P.IVA *' val={f.piva} onChange={u} ph='es. 12345678901'/>
        <Fld id='titolare' label='Titolare del Trattamento *' val={f.titolare} onChange={u} ph='es. Mario Rossi'/>
        <Fld id='dpo' label='DPO (se nominato)' val={f.dpo} onChange={u} ph='es. Luca Bianchi'/>
        <div style={{gridColumn:'1/-1'}}><Fld id='sede' label='Sede Legale *' val={f.sede} onChange={u} ph='es. Via Roma 1, 20100 Milano MI'/></div>
        <Fld id='email' label='Email' val={f.email} onChange={u} ph='es. info@azienda.it'/>
        <Fld id='telefono' label='Telefono' val={f.telefono} onChange={u} ph='es. +39 02 12345678'/>
      </div>
      <div style={C.row}>
        <button style={C.btn()} onClick={()=>{if(!f.ragioneSociale||!f.settore||!f.titolare||!f.piva||!f.sede){alert('Compila i campi obbligatori (*)');return;}onSave(f);}}>💾 Salva Cliente</button>
        <button style={C.btn('#f1f5f9','#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
}

// ---- GENERATE PAGE ----
function GeneratePage({client,dt,inputs,setInputs,onGenerate,generating,genDoc,error,onCopy,copied,onBack,onExport,autoSaved,docSettings,onOpenSettings}) {
  const u=(k,v)=>setInputs(p=>({...p,[k]:v}));
  const s=docSettings[dt.id]||{};
  return (
    <div>
      <button style={{...C.btn('#f1f5f9','#374151',true),marginBottom:16}} onClick={onBack}>← Indietro</button>
      <div style={{display:'grid',gridTemplateColumns:genDoc?'1fr 1fr':'minmax(300px,580px)',gap:18,alignItems:'start'}}>
        <div style={C.card}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,paddingBottom:14,borderBottom:'1px solid #f1f5f9'}}>
            <span style={{fontSize:26}}>{dt.icon}</span>
            <div style={{flex:1}}>
              <h2 style={{margin:0,fontSize:17,color:'#0f172a'}}>{dt.label}</h2>
              <div style={{fontSize:12,color:dt.color,fontWeight:600,marginTop:2}}>{dt.desc} · {client.ragioneSociale}</div>
              <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                {s.templateText&&<span style={{fontSize:10,background:'#f0fdf4',color:'#16a34a',fontWeight:700,padding:'2px 6px',borderRadius:20}}>📄 Template attivo</span>}
                {s.systemPrompt&&s.systemPrompt!==DEFAULT_SYSTEM(dt.label)&&<span style={{fontSize:10,background:'#eff6ff',color:ACCENT,fontWeight:700,padding:'2px 6px',borderRadius:20}}>⚙️ Prompt custom</span>}
                <span style={{fontSize:10,background:'#f8fafc',color:'#64748b',padding:'2px 6px',borderRadius:20}}>temp: {s.temperature??DEFAULT_PARAMS.temperature}</span>
              </div>
            </div>
            <button style={C.btn('#f8fafc','#475569',true)} onClick={()=>onOpenSettings(dt)} title="Impostazioni agente">⚙️ Settings</button>
          </div>
          {dt.fields.map(f=><Fld key={f.id} id={f.id} label={f.label} type={f.type} val={inputs[f.id]} onChange={u} ph={f.ph}/>)}
          <button style={{...C.btn(dt.color,'#fff'),width:'100%',padding:'11px',fontSize:15,justifyContent:'center',opacity:generating?.7:1}} onClick={onGenerate} disabled={generating}>
            {generating?'⏳ Generazione in corso...':'✨ Genera con AI'}
          </button>
          {error&&<div style={{marginTop:10,padding:12,background:'#fef2f2',color:'#dc2626',borderRadius:8,fontSize:13,wordBreak:'break-word'}}>{error}</div>}
        </div>
        {genDoc&&(
          <div style={C.card}>
            <div style={{...C.row,justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
              <div>
                <span style={{fontWeight:700,color:'#0f172a',fontSize:15}}>📄 Documento Generato</span>
                {autoSaved&&<div style={{fontSize:11,color:'#16a34a',marginTop:3,fontWeight:600}}>✅ Salvato in Repository</div>}
              </div>
              <div style={C.row}>
                <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onCopy(genDoc)}>{copied?'✅':'📋'} Copia</button>
                <button style={C.btn('#4f46e5','#fff',true)} onClick={()=>onExport(genDoc,`${dt.label}_${client.ragioneSociale}`)}>📥 .doc</button>
              </div>
            </div>
            <div style={{maxHeight:520,overflowY:'auto',padding:'20px 24px',background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',boxShadow:'inset 0 1px 3px rgba(0,0,0,0.04)'}}>
              <DocRenderer content={genDoc}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- VIEW DOC ----
function ViewDoc({doc,onCopy,copied,onBack,onExport}) {
  const dt=DOC_TYPES.find(d=>d.id===doc.tipo);
  return (
    <div>
      <button style={{...C.btn('#f1f5f9','#374151',true),marginBottom:16}} onClick={onBack}>← Indietro</button>
      <div style={C.card}>
        <div style={{...C.row,justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16,paddingBottom:14,borderBottom:'1px solid #f1f5f9'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:24}}>{dt?.icon}</span>
            <div><h2 style={{margin:0,fontSize:18,color:'#0f172a'}}>{doc.label}</h2><div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{new Date(doc.createdAt).toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
          </div>
          <div style={C.row}>
            <button style={C.btn('#f1f5f9','#374151')} onClick={()=>onCopy(doc.contenuto)}>{copied?'✅ Copiato!':'📋 Copia tutto'}</button>
            <button style={C.btn('#4f46e5')} onClick={()=>onExport(doc.contenuto,doc.label)}>📥 Esporta .doc</button>
          </div>
        </div>
        <div style={{maxHeight:600,overflowY:'auto',padding:'4px 8px'}}><DocRenderer content={doc.contenuto}/></div>
      </div>
    </div>
  );
}

// ---- API KEY MODAL ----
function ApiKeyModal({apiKey, onSave, onClose}) {
  const [val, setVal] = useState(apiKey || '');
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{...C.card,maxWidth:500,width:'100%',padding:28}}>
        <h3 style={{margin:'0 0 8px',color:'#0f172a',fontSize:17}}>🔑 API Key Groq</h3>
        <p style={{margin:'0 0 16px',fontSize:13,color:'#64748b',lineHeight:1.6}}>
          Inserisci la tua API Key di Groq per abilitare la generazione AI dei documenti GDPR.<br/>
          Gratuita su <strong>console.groq.com</strong> — la chiave viene salvata solo nel browser.
        </p>
        <input
          type="password"
          value={val}
          onChange={e=>setVal(e.target.value)}
          placeholder="gsk_..."
          style={{...C.inp,marginBottom:16,fontFamily:'"Courier New",monospace',letterSpacing:'0.5px'}}
          onFocus={e=>e.target.style.borderColor=ACCENT}
          onBlur={e=>e.target.style.borderColor='#dde3ec'}
        />
        <div style={C.row}>
          <button style={C.btn()} onClick={()=>onSave(val.trim())}>💾 Salva</button>
          <button style={C.btn('#f1f5f9','#374151')} onClick={onClose}>Annulla</button>
          {apiKey && <button style={C.btn('#fff5f5','#dc2626')} onClick={()=>onSave('')}>🗑️ Rimuovi</button>}
        </div>
      </div>
    </div>
  );
}

// ---- MAIN APP ----
export default function App() {
  const [page,setPage]=useState('dashboard');
  const [prevPage,setPrev]=useState('client');
  const [clients,setClients]=useState([]);
  const [selClient,setSelClient]=useState(null);
  const [editClient,setEditClient]=useState(null);
  const [clientDocs,setClientDocs]=useState([]);
  const [clientAssets,setClientAssets]=useState([]);
  const [clientSuppliers,setClientSuppliers]=useState([]);
  const [docSettings,setDocSettings]=useState({});
  const [selDt,setSelDt]=useState(null);
  const [settingsDt,setSettingsDt]=useState(null);
  const [inputs,setInputs]=useState({});
  const [generating,setGenerating]=useState(false);
  const [genDoc,setGenDoc]=useState(null);
  const [autoSaved,setAutoSaved]=useState(false);
  const [viewDoc,setViewDoc]=useState(null);
  const [loading,setLoading]=useState(true);
  const [copied,setCopied]=useState(false);
  const [error,setError]=useState(null);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem('gdpr:groqKey')||'');
  const [showApiKey,setShowApiKey]=useState(false);

  useEffect(()=>{
    async function load() {
      const [{ data: clientRows }, { data: settingsRows }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at'),
        supabase.from('doc_settings').select('*').eq('id','global')
      ]);
      setClients((clientRows||[]).map(r=>r.data));
      setDocSettings(settingsRows?.[0]?.data||{});
      setLoading(false);
    }
    load();
  },[]);

  const saveClients=async arr=>{
    setClients(arr);
    const { data: existing } = await supabase.from('clients').select('id');
    const existingIds = (existing||[]).map(r=>r.id);
    const newIds = new Set(arr.map(c=>c.id));
    const toDelete = existingIds.filter(id=>!newIds.has(id));
    if(toDelete.length>0) await supabase.from('clients').delete().in('id',toDelete);
    if(arr.length>0) await supabase.from('clients').upsert(arr.map(c=>({id:c.id,data:c})));
  };
  const loadClient=async c=>{
    const [{ data: docRows },{ data: assetRows },{ data: supplierRows }] = await Promise.all([
      supabase.from('documents').select('*').eq('client_id',c.id).order('created_at'),
      supabase.from('assets').select('*').eq('client_id',c.id),
      supabase.from('suppliers').select('*').eq('client_id',c.id)
    ]);
    setClientDocs((docRows||[]).map(r=>({id:r.id,tipo:r.tipo,label:r.label,contenuto:r.contenuto,createdAt:r.created_at})));
    setClientAssets((assetRows||[]).map(r=>({...r.data,id:r.id})));
    setClientSuppliers((supplierRows||[]).map(r=>({...r.data,id:r.id})));
  };
  const saveDocs=async(arr,cid=selClient.id)=>{
    setClientDocs(arr);
    await supabase.from('documents').delete().eq('client_id',cid);
    if(arr.length>0) await supabase.from('documents').insert(arr.map(doc=>({id:doc.id,client_id:cid,tipo:doc.tipo,label:doc.label,contenuto:doc.contenuto,created_at:doc.createdAt})));
    const cnt=arr.length;
    const upd=clients.map(c=>c.id===cid?{...c,_docCount:cnt}:c);
    setClients(upd); setSelClient(s=>s?.id===cid?{...s,_docCount:cnt}:s);
    const updClient=upd.find(c=>c.id===cid);
    if(updClient) await supabase.from('clients').upsert({id:cid,data:updClient});
  };
  const saveAssets=async arr=>{
    setClientAssets(arr);
    await supabase.from('assets').delete().eq('client_id',selClient.id);
    if(arr.length>0) await supabase.from('assets').insert(arr.map(a=>({id:a.id||Date.now().toString(),client_id:selClient.id,data:a})));
  };
  const saveSuppliers=async arr=>{
    setClientSuppliers(arr);
    await supabase.from('suppliers').delete().eq('client_id',selClient.id);
    if(arr.length>0) await supabase.from('suppliers').insert(arr.map(s=>({id:s.id||Date.now().toString(),client_id:selClient.id,data:s})));
  };

  async function handleSaveClient(form) {
    let arr,ns;
    if(editClient){arr=clients.map(c=>c.id===editClient.id?{...form,id:editClient.id,_docCount:c._docCount||0}:c);ns=selClient?.id===editClient.id?{...form,id:editClient.id,_docCount:selClient._docCount||0}:selClient;}
    else{const nc={...form,id:Date.now().toString(),_docCount:0};arr=[...clients,nc];ns=selClient;}
    await saveClients(arr);setSelClient(ns);setEditClient(null);
    setPage(editClient&&selClient?'client':'dashboard');
  }

  async function handleDeleteClient(id){await saveClients(clients.filter(c=>c.id!==id));if(selClient?.id===id)setSelClient(null);setPage('dashboard');}
  async function openClient(c){setSelClient(c);await loadClient(c);setPage('client');}

  async function handleSaveSettings(s) {
    const updated={...docSettings,[settingsDt.id]:s};
    setDocSettings(updated);
    await supabase.from('doc_settings').upsert({id:'global',data:updated});
    setSettingsDt(null);
  }

  function handleSaveApiKey(key) {
    setApiKey(key);
    if(key) localStorage.setItem('gdpr:groqKey', key);
    else localStorage.removeItem('gdpr:groqKey');
    setShowApiKey(false);
  }

  async function handleGenerate() {
    if(!apiKey) { setError('API Key Groq mancante. Configurala tramite il pulsante "🔑 API Key" in alto a destra.'); return; }
    setGenerating(true); setError(null); setAutoSaved(false);
    const s=docSettings[selDt.id]||{};
    const systemPrompt = s.systemPrompt || DEFAULT_SYSTEM(selDt.label);
    const temperature = s.temperature ?? DEFAULT_PARAMS.temperature;
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 4000,
          temperature,
          messages: [
            {role:"system", content: systemPrompt},
            {role:"user", content: buildPrompt(selDt.id, selClient, inputs, s, clientAssets, clientSuppliers)}
          ]
        })
      });
      const data=await r.json();
      if(!r.ok||data.error) throw new Error(`Errore API (${r.status}): ${data.error?.message||JSON.stringify(data.error||data)}`);
      const text=data.choices?.[0]?.message?.content?.trim();
      if(!text) throw new Error('Risposta vuota. Riprova.');
      setGenDoc(text);
      const doc={id:Date.now().toString(),tipo:selDt.id,label:selDt.label,contenuto:text,createdAt:new Date().toISOString()};
      await saveDocs([...clientDocs.filter(d=>d.tipo!==selDt.id),doc]);
      setAutoSaved(true);
    } catch(e){ setError(e.message); }
    setGenerating(false);
  }

  async function handleDeleteDoc(doc){await saveDocs(clientDocs.filter(d=>d.id!==doc.id));}
  function copy(text){navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2200);}

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter, system-ui, sans-serif',color:'#64748b',fontSize:16}}>⏳ Caricamento...</div>;

  const NavBtn=({label,pg,onClick})=>(
    <button onClick={onClick||(()=>setPage(pg))} style={{background:'none',border:'none',borderBottom:page===pg?'2px solid #fff':'2px solid transparent',color:page===pg?'#fff':'rgba(255,255,255,.65)',fontWeight:page===pg?700:400,fontSize:13,cursor:'pointer',padding:'18px 10px',fontFamily:'inherit',whiteSpace:'nowrap'}}>
      {label}
    </button>
  );

  return (
    <div style={{fontFamily:'"Inter", system-ui, sans-serif', minHeight:'100vh', background:'#f8fafc'}}>
      {/* NAV */}
      <nav style={{background:PRIMARY,padding:'0 24px',display:'flex',gap:2,alignItems:'center',flexWrap:'wrap',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
        <div style={{fontWeight:800,color:'#fff',fontSize:15,marginRight:12,padding:'16px 0',whiteSpace:'nowrap'}}>🔐 GDPR Manager</div>
        <NavBtn label="📊 Dashboard" pg="dashboard" onClick={()=>setPage('dashboard')}/>
        {selClient&&(
          <>
            <span style={{color:'rgba(255,255,255,.3)',padding:'0 2px',fontSize:12}}>›</span>
            <NavBtn label={`🏢 ${selClient.ragioneSociale}`} pg="client" onClick={()=>setPage('client')}/>
          </>
        )}
        {page==='generate'&&selDt&&(
          <>
            <span style={{color:'rgba(255,255,255,.3)',padding:'0 2px',fontSize:12}}>›</span>
            <NavBtn label={`${selDt.icon} ${selDt.label}`} pg="generate"/>
          </>
        )}
        {page==='view'&&viewDoc&&(
          <>
            <span style={{color:'rgba(255,255,255,.3)',padding:'0 2px',fontSize:12}}>›</span>
            <span style={{color:'rgba(255,255,255,.65)',fontSize:13,padding:'18px 10px'}}>{viewDoc.label}</span>
          </>
        )}
        <div style={{flex:1}}/>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 0'}}>
          {apiKey
            ? <span style={{color:'rgba(255,255,255,.55)',fontSize:11,fontWeight:500}}>🔑 Key attiva</span>
            : <span style={{color:'#fbbf24',fontSize:11,fontWeight:700}}>⚠️ API Key mancante</span>
          }
          <button
            style={{...C.btn('rgba(255,255,255,.15)','#fff',true),fontSize:12}}
            onClick={()=>setShowApiKey(true)}
          >
            ⚙️ API Key
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'28px 20px'}}>
        {page==='dashboard'&&(
          <Dashboard
            clients={clients}
            onOpen={openClient}
            onNew={()=>{setEditClient(null);setPage('new-client');}}
            onEdit={c=>{setEditClient(c);setPage('edit-client');}}
            onDelete={handleDeleteClient}
          />
        )}
        {(page==='new-client'||page==='edit-client')&&(
          <ClientForm
            initial={editClient}
            onSave={handleSaveClient}
            onCancel={()=>setPage(selClient?'client':'dashboard')}
          />
        )}
        {page==='client'&&selClient&&(
          <ClientDetail
            client={selClient}
            docs={clientDocs}
            assets={clientAssets}
            suppliers={clientSuppliers}
            docSettings={docSettings}
            onGenerate={dt=>{setSelDt(dt);setInputs({});setGenDoc(null);setPrev('client');setPage('generate');}}
            onView={doc=>{setViewDoc(doc);setPrev('client');setPage('view');}}
            onDeleteDoc={handleDeleteDoc}
            onExport={exportToDoc}
            onChangeAssets={saveAssets}
            onChangeSuppliers={saveSuppliers}
            onOpenSettings={dt=>setSettingsDt(dt)}
          />
        )}
        {page==='generate'&&selDt&&selClient&&(
          <GeneratePage
            client={selClient}
            dt={selDt}
            inputs={inputs}
            setInputs={setInputs}
            onGenerate={handleGenerate}
            generating={generating}
            genDoc={genDoc}
            error={error}
            onCopy={copy}
            copied={copied}
            onBack={()=>setPage(prevPage)}
            onExport={exportToDoc}
            autoSaved={autoSaved}
            docSettings={docSettings}
            onOpenSettings={dt=>setSettingsDt(dt)}
          />
        )}
        {page==='view'&&viewDoc&&(
          <ViewDoc
            doc={viewDoc}
            onCopy={copy}
            copied={copied}
            onBack={()=>setPage(prevPage)}
            onExport={exportToDoc}
          />
        )}
      </div>

      {/* MODALS */}
      {settingsDt&&(
        <DocSettingsModal
          dt={settingsDt}
          settings={docSettings[settingsDt.id]}
          onSave={handleSaveSettings}
          onClose={()=>setSettingsDt(null)}
        />
      )}
      {showApiKey&&(
        <ApiKeyModal
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={()=>setShowApiKey(false)}
        />
      )}
    </div>
  );
}
