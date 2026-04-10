import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT, BASI_GIURIDICHE, BASI_GIURIDICHE_ART9, STATI_TRATTAMENTO, TIPI_MISURA, STATI_MISURA, ART32_RIFERIMENTI } from './shared';
import { AICtx, useAIRecord } from './AIContext';

const STATO_COLOR = { Attivo:'#16a34a', Sospeso:'#d97706', Cessato:'#64748b' };
const MISURA_COLOR = { Implementata:'#16a34a', 'In corso':'#d97706', Pianificata:'#2563eb' };
const TIPO_COLOR   = { Tecnica:'#0891b2', Organizzativa:'#7c3aed', Fisica:'#b45309', Logica:'#4f46e5' };

// ---- EXPORT EXCEL ----
function exportExcel(trattamenti, assets, suppliers, misure, clientName) {
  const assetObj = Object.fromEntries(assets.map(a=>[a.id,a]));
  const suppObj  = Object.fromEntries(suppliers.map(s=>[s.id,s]));
  const misuraObj = Object.fromEntries(misure.map(m=>[m.id,m]));

  // Sheet 1: Registro riepilogativo
  const registroRows = trattamenti.map(t=>({
    'Nome Trattamento': t.nome||'',
    'Funzione Aziendale': t.funzioneAziendale||'',
    'Finalità': t.finalita||'',
    'Base Giuridica': t.baseGiuridica||'',
    'Categorie di Dati': t.categorieDati||'',
    'Categorie Interessati': t.categorieInteressati||'',
    'Destinatari Interni': t.destinatariInterni||'',
    'Destinatari Esterni (Art.28)': t.destinatariEsterni||'',
    'Paesi Terzi': t.paesiTerzi||'',
    'Retention': t.retention||'',
    'Stato': t.stato||'',
    'Asset Associati': (t.assetIds||[]).map(id=>assetObj[id]?.nome).filter(Boolean).join(', '),
    'Fornitori Associati': (t.supplierIds||[]).map(id=>suppObj[id]?.nome).filter(Boolean).join(', '),
    'N° Misure Sicurezza': Object.values(t.misurePerAsset||{}).reduce((s,a)=>s+a.length,0),
    'Note': t.note||'',
  }));

  // Sheet 2: Asset per trattamento
  const assetRows = [];
  trattamenti.forEach(t=>{
    (t.assetIds||[]).forEach(aid=>{
      const asset = assetObj[aid]; if(!asset) return;
      const mIds = (t.misurePerAsset||{})[aid]||[];
      assetRows.push({
        'Trattamento': t.nome||'',
        'Asset': asset.nome||'',
        'Categoria Asset': asset.categoria||'',
        'Note Asset': asset.note||'',
        'Misure di Sicurezza': mIds.map(mid=>misuraObj[mid]?.nome).filter(Boolean).join(', '),
        'Tipi Misure': mIds.map(mid=>misuraObj[mid]?.tipo).filter(Boolean).join(', '),
        'Stato Misure': mIds.map(mid=>misuraObj[mid]?.stato).filter(Boolean).join(', '),
      });
    });
  });

  // Sheet 3: Fornitori per trattamento
  const suppRows = [];
  trattamenti.forEach(t=>{
    (t.supplierIds||[]).forEach(sid=>{
      const s = suppObj[sid]; if(!s) return;
      suppRows.push({
        'Trattamento': t.nome||'',
        'Fornitore': s.nome||'',
        'Ruolo GDPR': s.ruolo||'',
        'Servizio': s.servizio||'',
        'Paese Sede': s.paeseSede||'',
        'Referente': s.contatto||'',
      });
    });
  });

  // Sheet 4: Libreria misure
  const misureRows = misure.map(m=>({
    'Nome Misura': m.nome||'',
    'Tipo': m.tipo||'',
    'Stato': m.stato||'',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(registroRows), 'Registro Trattamenti');
  if(assetRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetRows), 'Asset e Misure');
  if(suppRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppRows), 'Fornitori');
  if(misureRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(misureRows), 'Libreria Misure');

  XLSX.writeFile(wb, `Registro_Trattamenti_${(clientName||'export').replace(/[^a-z0-9]/gi,'_')}.xlsx`);
}

// ---- EXPORT DOCX ----
async function exportDocx(trattamenti, assets, suppliers, misure, client) {
  const assetObj  = Object.fromEntries(assets.map(a=>[a.id,a]));
  const suppObj   = Object.fromEntries(suppliers.map(s=>[s.id,s]));
  const misuraObj = Object.fromEntries(misure.map(m=>[m.id,m]));

  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const cellBorders = { top:border, bottom:border, left:border, right:border };

  const cell = (text, bold=false, shade=false) => new TableCell({
    shading: shade ? { fill:'EFF6FF' } : undefined,
    borders: cellBorders,
    children: [new Paragraph({ children:[new TextRun({text:String(text||'—'), bold, size:20})] })],
  });

  const tableRow = (label, value) => new TableRow({ children:[
    cell(label, true, true),
    cell(value, false, false),
  ]});

  const sections = [];

  // Cover
  sections.push(new Paragraph({ text: 'Registro delle Attività di Trattamento', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
  sections.push(new Paragraph({ text: `Titolare: ${client.ragioneSociale||''}`, alignment: AlignmentType.CENTER, spacing:{after:200} }));
  sections.push(new Paragraph({ text: `P.IVA: ${client.piva||''} | Titolare del trattamento: ${client.titolare||''}`, alignment: AlignmentType.CENTER }));
  sections.push(new Paragraph({ text: `Sede: ${client.sede||''}`, alignment: AlignmentType.CENTER }));
  if(client.dpo) sections.push(new Paragraph({ text: `DPO: ${client.dpo}`, alignment: AlignmentType.CENTER }));
  sections.push(new Paragraph({ text: `Data generazione: ${new Date().toLocaleDateString('it-IT')}`, alignment: AlignmentType.CENTER, spacing:{after:600} }));
  sections.push(new Paragraph({ text: `Ai sensi dell'art. 30 del Regolamento (UE) 2016/679 (GDPR)`, alignment: AlignmentType.CENTER, spacing:{after:800} }));

  // One section per trattamento
  trattamenti.forEach((t, idx) => {
    sections.push(new Paragraph({ text: `${idx+1}. ${t.nome||'Trattamento senza nome'}`, heading: HeadingLevel.HEADING_1, spacing:{before:400,after:200} }));

    sections.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ...(t.funzioneAziendale ? [tableRow('Funzione Aziendale', t.funzioneAziendale)] : []),
        tableRow('Finalità', t.finalita),
        tableRow('Base Giuridica', t.baseGiuridica),
        tableRow('Categorie di Dati Personali', t.categorieDati),
        tableRow('Categorie di Interessati', t.categorieInteressati),
        tableRow('Destinatari Interni', t.destinatariInterni),
        tableRow('Responsabili del Trattamento (Art. 28)', t.destinatariEsterni),
        tableRow('Trasferimenti verso Paesi Terzi', t.paesiTerzi||'Nessuno'),
        tableRow('Termini di Conservazione', t.retention),
        tableRow('Stato', t.stato),
        ...(t.note ? [tableRow('Note', t.note)] : []),
      ],
    }));

    // Asset
    const assetIds = t.assetIds||[];
    if(assetIds.length>0) {
      sections.push(new Paragraph({ text: 'Asset Associati e Misure di Sicurezza', heading: HeadingLevel.HEADING_2, spacing:{before:300,after:100} }));
      assetIds.forEach(aid=>{
        const asset = assetObj[aid]; if(!asset) return;
        const mIds = (t.misurePerAsset||{})[aid]||[];
        const misureText = mIds.length>0
          ? mIds.map(mid=>{ const m=misuraObj[mid]; return m?`${m.nome} (${m.tipo} — ${m.stato})`:''; }).filter(Boolean).join('; ')
          : 'Nessuna misura associata';
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableRow(`🖥 ${asset.nome} (${asset.categoria})`, asset.note||'', ),
            tableRow('Misure di sicurezza', misureText),
          ],
        }));
        sections.push(new Paragraph({ text:'', spacing:{after:100} }));
      });
    }

    // Suppliers
    const suppIds = t.supplierIds||[];
    if(suppIds.length>0) {
      sections.push(new Paragraph({ text: 'Fornitori Associati', heading: HeadingLevel.HEADING_2, spacing:{before:300,after:100} }));
      const suppRows2 = suppIds.map(sid=>{
        const s=suppObj[sid]; if(!s) return null;
        return new TableRow({ children:[
          cell(s.nome||'', true, true),
          cell(s.ruolo||'', false),
          cell(s.servizio||'', false),
          cell(s.paeseSede||'', false),
        ]});
      }).filter(Boolean);
      if(suppRows2.length) {
        sections.push(new Table({
          width: { size:100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children:[cell('Fornitore',true,true),cell('Ruolo GDPR',true,true),cell('Servizio',true,true),cell('Paese',true,true)] }),
            ...suppRows2,
          ],
        }));
      }
    }

    sections.push(new Paragraph({ text:'', spacing:{after:400} }));
  });

  // Signature page
  sections.push(new Paragraph({ text: 'Firme', heading: HeadingLevel.HEADING_1, spacing:{before:600,after:200} }));
  sections.push(new Table({
    width: { size:100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow('Il Titolare del Trattamento', `${client.titolare||''}                    Firma: _________________________`),
      ...(client.dpo ? [tableRow('Il DPO', `${client.dpo}                    Firma: _________________________`)] : []),
      tableRow('Data', new Date().toLocaleDateString('it-IT')),
    ],
  }));

  const doc = new Document({ sections:[{ children: sections }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'),{href:url,download:`Registro_Trattamenti_${(client.ragioneSociale||'export').replace(/[^a-z0-9]/gi,'_')}.docx`});
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ---- MISURE LIBRARY ----
const EMPTY_MISURA = { nome:'', tipo:'Tecnica', stato:'Implementata', riferimentoArt32:'', descrizione:'', responsabile:'', dataVerifica:'' };

function MisuraForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || EMPTY_MISURA);
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal onClose={onClose} maxWidth={580}>
      <h3 style={{margin:'0 0 18px',color:'#0f172a',fontSize:15}}>{initial?'✏️ Modifica misura':'➕ Nuova misura di sicurezza Art.32'}</h3>
      <Fld id='nome' label='Nome misura *' val={f.nome} onChange={u} ph='es. Crittografia dati a riposo, Autenticazione a due fattori...'/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
        <Fld id='tipo' label='Tipo' val={f.tipo} onChange={u} options={TIPI_MISURA}/>
        <Fld id='stato' label='Stato' val={f.stato} onChange={u} options={STATI_MISURA}/>
        <Fld id='riferimentoArt32' label='Riferimento Art.32' val={f.riferimentoArt32} onChange={u} options={ART32_RIFERIMENTI}/>
        <Fld id='responsabile' label='Responsabile' val={f.responsabile} onChange={u} ph='es. IT Manager, DPO...'/>
        <Fld id='dataVerifica' label='Data verifica / scadenza' type='date' val={f.dataVerifica} onChange={u}/>
      </div>
      <Fld id='descrizione' label='Descrizione' type='textarea' val={f.descrizione} onChange={u} ph='es. Tutti i dati sensibili vengono cifrati con AES-256 sia a riposo che in transito...'/>
      <div style={C.row}>
        <button style={C.btn()} onClick={()=>{if(!f.nome.trim()){alert('Inserisci il nome');return;}onSave({...f,id:initial?.id||Date.now().toString()});}}>💾 Salva</button>
        <button style={C.btn('#f1f5f9','#374151')} onClick={onClose}>Annulla</button>
      </div>
    </Modal>
  );
}

function MisureLibrary({ misure, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editMisura, setEditMisura] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const handleSave = m => {
    const updated = editMisura
      ? misure.map(x => x.id === m.id ? m : x)
      : [...misure, m];
    onChange(updated);
    setShowForm(false); setEditMisura(null);
  };

  const implCount = misure.filter(m => m.stato === 'Implementata').length;

  return (
    <div style={{...C.card, marginBottom: 20}}>
      {(showForm || editMisura) && (
        <MisuraForm
          initial={editMisura}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditMisura(null); }}
        />
      )}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: collapsed ? 0 : 14}}>
        <div style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={()=>setCollapsed(c=>!c)}>
          <span style={{fontWeight:700, fontSize:13, color:'#0f172a'}}>🔒 Libreria Misure di Sicurezza — Art.32 GDPR</span>
          {misure.length > 0 && (
            <span style={{fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:12, background:'#eff6ff', color:ACCENT}}>
              {implCount}/{misure.length} implementate
            </span>
          )}
          <span style={{color:'#94a3b8', fontSize:12}}>{collapsed ? '▼' : '▲'}</span>
        </div>
        <button style={C.btn(ACCENT,'#fff',true)} onClick={()=>{setEditMisura(null);setShowForm(true);}}>+ Aggiungi misura</button>
      </div>

      {!collapsed && (
        misure.length === 0
          ? <div style={{textAlign:'center', padding:'16px', color:'#94a3b8', fontSize:13}}>Nessuna misura. Aggiungile per associarle ai trattamenti e agli asset.</div>
          : <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {misure.map(m => {
                const statCol = m.stato==='Implementata'?'#16a34a':m.stato==='In corso'?'#d97706':m.stato==='Pianificata'?'#2563eb':'#94a3b8';
                return (
                  <div key={m.id} style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'#f8fafc', border:'1px solid #e5eaf0', borderLeft:`3px solid ${statCol}`}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                        <span style={{fontWeight:600, fontSize:13, color:'#0f172a'}}>{m.nome}</span>
                        <StatusBadge label={m.tipo} color={TIPO_COLOR[m.tipo]||'#64748b'}/>
                        <StatusBadge label={m.stato} color={statCol}/>
                        {m.riferimentoArt32 && <span style={{fontSize:10, color:'#64748b', background:'#f1f5f9', padding:'1px 6px', borderRadius:8}}>{m.riferimentoArt32.split('—')[0].trim()}</span>}
                      </div>
                      {m.descrizione && <div style={{fontSize:11, color:'#64748b', marginTop:2}}>{m.descrizione}</div>}
                      <div style={{display:'flex', gap:10, marginTop:2}}>
                        {m.responsabile && <span style={{fontSize:11, color:'#94a3b8'}}>👤 {m.responsabile}</span>}
                        {m.dataVerifica && <span style={{fontSize:11, color:'#94a3b8'}}>📅 {new Date(m.dataVerifica).toLocaleDateString('it-IT')}</span>}
                      </div>
                    </div>
                    <div style={C.row}>
                      <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>{setEditMisura(m);setShowForm(true);}}>✏️</button>
                      {confirmDel === m.id
                        ? <>
                            <button style={C.btn('#dc2626','#fff',true)} onClick={()=>{onChange(misure.filter(x=>x.id!==m.id));setConfirmDel(null);}}>Conferma</button>
                            <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setConfirmDel(null)}>✕</button>
                          </>
                        : <button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setConfirmDel(m.id)}>🗑️</button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}

// ---- TRATTAMENTO FORM ----
const EMPTY_T = { nome:'',funzioneAziendale:'',finalita:'',baseGiuridica:'',categorieDati:'',categorieInteressati:'',destinatariInterni:'',destinatariEsterni:'',paesiTerzi:'',retention:'',stato:'Attivo',note:'',assetIds:[],supplierIds:[],misureIds:[],misurePerAsset:{} };

function TrattamentoForm({ initial, assets, suppliers, misure, funzioni, onSaveFunzioni, onSave, onCancel }) {
  const [f, setF] = useState(initial || EMPTY_T);
  const [newFunz, setNewFunz] = useState('');
  const aiCtx = useAIRecord({ recordName: f.nome, sectionLabel: 'Registro Trattamenti GDPR' });
  const [showAddFunz, setShowAddFunz] = useState(false);
  const u = (k,v) => setF(p=>({...p,[k]:v}));

  const addFunzione = () => {
    const v = newFunz.trim();
    if(!v) return;
    onSaveFunzioni([...funzioni, v]);
    u('funzioneAziendale', v);
    setNewFunz(''); setShowAddFunz(false);
  };

  const toggleAsset = id => {
    const cur = f.assetIds||[];
    const next = cur.includes(id) ? cur.filter(x=>x!==id) : [...cur,id];
    const misurePerAsset = {...(f.misurePerAsset||{})};
    if(!next.includes(id)) delete misurePerAsset[id];
    setF(p=>({...p,assetIds:next,misurePerAsset}));
  };

  const toggleSupplier = id => {
    const cur = f.supplierIds||[];
    const next = cur.includes(id) ? cur.filter(x=>x!==id) : [...cur,id];
    setF(p=>({...p,supplierIds:next}));
  };

  const toggleMisuraAsset = (assetId, misuraId) => {
    const cur = (f.misurePerAsset||{})[assetId]||[];
    const next = cur.includes(misuraId) ? cur.filter(x=>x!==misuraId) : [...cur,misuraId];
    setF(p=>({...p,misurePerAsset:{...(p.misurePerAsset||{}),[assetId]:next}}));
  };

  return (
    <AICtx.Provider value={aiCtx}>
    <div>
      <div style={{...C.card,marginBottom:16}}>
        <SectionTitle>📋 Dati del Trattamento</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
          <div style={{gridColumn:'1/-1'}}><Fld id='nome' label='Nome trattamento *' val={f.nome} onChange={u} ph='es. Gestione clienti, Elaborazione paghe...'/></div>

          {/* Funzione aziendale */}
          <div style={{gridColumn:'1/-1',marginBottom:14}}>
            <label style={C.lbl}>🏢 Funzione aziendale</label>
            <div style={{display:'flex',gap:6}}>
              <select value={f.funzioneAziendale||''} onChange={e=>u('funzioneAziendale',e.target.value)} style={{...C.inp,flex:1}}>
                <option value=''>Nessuna / Non assegnata</option>
                {funzioni.map(fn=><option key={fn} value={fn}>{fn}</option>)}
              </select>
              <button style={C.btn('#f0fdf4','#16a34a',true)} onClick={()=>setShowAddFunz(v=>!v)} title="Nuova funzione">+ Nuova</button>
            </div>
            {showAddFunz && (
              <div style={{display:'flex',gap:6,marginTop:6}}>
                <input value={newFunz} onChange={e=>setNewFunz(e.target.value)}
                  placeholder="es. Ufficio Commerciale, HR, Amministrazione..."
                  style={{...C.inp,flex:1}}
                  onKeyDown={e=>{if(e.key==='Enter')addFunzione();}}
                />
                <button style={C.btn('#16a34a')} onClick={addFunzione}>✓ Crea</button>
                <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>{setShowAddFunz(false);setNewFunz('');}}>✕</button>
              </div>
            )}
          </div>

          <div style={{gridColumn:'1/-1'}}><Fld id='finalita' label='Finalità *' type='textarea' val={f.finalita} onChange={u} ph='es. Gestione del rapporto contrattuale con i clienti...'/></div>
          <Fld id='baseGiuridica' label='Base giuridica Art.6 *' val={f.baseGiuridica} onChange={u} options={BASI_GIURIDICHE}/>
          <Fld id='stato' label='Stato' val={f.stato} onChange={u} options={STATI_TRATTAMENTO}/>
          <div style={{gridColumn:'1/-1'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,marginTop:2}}>
              <input type='checkbox' id='hasDatiParticolari' checked={!!f.hasDatiParticolari}
                onChange={e=>u('hasDatiParticolari',e.target.checked)}
                style={{width:16,height:16,accentColor:'#dc2626',flexShrink:0,cursor:'pointer'}}/>
              <label htmlFor='hasDatiParticolari' style={{fontSize:13,color:'#374151',cursor:'pointer',fontWeight:600}}>
                Il trattamento riguarda <strong>dati di categoria particolare</strong> (art.9 GDPR) — dati sanitari, biometrici, genetici, etnici, religiosi, politici, sindacali, orientamento sessuale
              </label>
            </div>
            {f.hasDatiParticolari && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'12px 14px',marginBottom:4}}>
                <div style={{fontSize:11,fontWeight:700,color:'#dc2626',marginBottom:8,textTransform:'uppercase',letterSpacing:'.4px'}}>
                  ⚠️ Base giuridica Art.9 par.2 (dati particolari)
                </div>
                <select value={f.baseGiuridicaArt9||''} onChange={e=>u('baseGiuridicaArt9',e.target.value)}
                  style={{...C.inp,borderColor:'#fca5a5'}}
                  onFocus={e=>e.target.style.borderColor='#dc2626'}
                  onBlur={e=>e.target.style.borderColor='#fca5a5'}>
                  <option value=''>Seleziona base giuridica art.9...</option>
                  {BASI_GIURIDICHE_ART9.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
          </div>
          <Fld id='categorieDati' label='Categorie di dati' type='textarea' val={f.categorieDati} onChange={u} ph='es. Dati anagrafici, contrattuali, bancari...'/>
          <Fld id='categorieInteressati' label='Categorie di interessati' type='textarea' val={f.categorieInteressati} onChange={u} ph='es. Clienti, dipendenti, fornitori...'/>
          <Fld id='destinatariInterni' label='Destinatari interni' type='textarea' val={f.destinatariInterni} onChange={u} ph='es. Ufficio amministrativo, reparto IT...'/>
          <Fld id='destinatariEsterni' label='Responsabili del trattamento (Art.28)' type='textarea' val={f.destinatariEsterni} onChange={u} ph='es. Studio commercialista, provider hosting...'/>
          <Fld id='paesiTerzi' label='Trasferimenti paesi terzi' val={f.paesiTerzi} onChange={u} ph='es. Nessuno / USA tramite SCC'/>
          <Fld id='retention' label='Termini di conservazione' val={f.retention} onChange={u} ph='es. 10 anni (obbligo fiscale), 2 anni (marketing)'/>
          <div style={{gridColumn:'1/-1'}}><Fld id='note' label='Note' type='textarea' val={f.note} onChange={u} ph='Altre informazioni rilevanti...'/></div>
        </div>
      </div>

      {/* Asset */}
      {assets.length>0 && (
        <div style={{...C.card,marginBottom:16}}>
          <SectionTitle>🖥️ Asset Associati</SectionTitle>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
            {assets.map(a=>{
              const checked = (f.assetIds||[]).includes(a.id);
              return (
                <button key={a.id} onClick={()=>toggleAsset(a.id)}
                  style={{...C.btn(checked?ACCENT:'#f1f5f9',checked?'#fff':'#374151',true),border:`1.5px solid ${checked?ACCENT:'#e2e8f0'}`}}>
                  {checked?'✓ ':''}{a.nome} <span style={{opacity:.6,fontSize:11}}>({a.categoria})</span>
                </button>
              );
            })}
          </div>
          {(f.assetIds||[]).length>0 && misure.length>0 && (
            <>
              <SectionTitle>🔒 Misure di Sicurezza per Asset</SectionTitle>
              {(f.assetIds||[]).map(aid=>{
                const asset = assets.find(a=>a.id===aid);
                if(!asset) return null;
                const sel = (f.misurePerAsset||{})[aid]||[];
                return (
                  <div key={aid} style={{marginBottom:14}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:6}}>🖥️ {asset.nome}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {misure.map(m=>{
                        const on = sel.includes(m.id);
                        return (
                          <button key={m.id} onClick={()=>toggleMisuraAsset(aid,m.id)}
                            style={{...C.btn(on?TIPO_COLOR[m.tipo]||ACCENT:'#f8fafc',on?'#fff':'#374151',true),fontSize:11,border:`1px solid ${on?TIPO_COLOR[m.tipo]||ACCENT:'#e2e8f0'}`}}>
                            {on?'✓ ':''}{m.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Fornitori */}
      {suppliers.length>0 && (
        <div style={{...C.card,marginBottom:16}}>
          <SectionTitle>🏭 Fornitori Associati</SectionTitle>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {suppliers.map(s=>{
              const checked = (f.supplierIds||[]).includes(s.id);
              const roleColor = {'Responsabile del trattamento (Art.28)':'#2563eb','Contitolare':'#7c3aed','Fornitore IT':'#059669','Consulente':'#d97706','Terzo':'#64748b'};
              return (
                <button key={s.id} onClick={()=>toggleSupplier(s.id)}
                  style={{...C.btn(checked?roleColor[s.ruolo]||ACCENT:'#f1f5f9',checked?'#fff':'#374151',true),border:`1.5px solid ${checked?roleColor[s.ruolo]||ACCENT:'#e2e8f0'}`}}>
                  {checked?'✓ ':''}{s.nome} <span style={{opacity:.6,fontSize:11}}>({s.servizio})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Misure Art.32 dirette sul trattamento */}
      {misure.length>0 && (
        <div style={{...C.card,marginBottom:16}}>
          <SectionTitle>🔒 Misure di Sicurezza Art.32 (associate al trattamento)</SectionTitle>
          <div style={{fontSize:12,color:'#64748b',marginBottom:10}}>Seleziona le misure di sicurezza applicabili a questo trattamento nel suo complesso.</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {misure.map(m=>{
              const checked = (f.misureIds||[]).includes(m.id);
              const statCol = m.stato==='Implementata'?'#16a34a':m.stato==='In corso'?'#d97706':m.stato==='Pianificata'?'#2563eb':'#94a3b8';
              return (
                <button key={m.id} onClick={()=>{
                  const cur = f.misureIds||[];
                  setF(p=>({...p,misureIds:cur.includes(m.id)?cur.filter(x=>x!==m.id):[...cur,m.id]}));
                }}
                  style={{...C.btn(checked?statCol:'#f1f5f9',checked?'#fff':'#374151',true),border:`1.5px solid ${checked?statCol:'#e2e8f0'}`}}>
                  {checked?'✓ ':''}{m.nome} <span style={{opacity:.6,fontSize:10}}>({m.tipo})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={C.row}>
        <button style={C.btn()} onClick={()=>{if(!f.nome||!f.finalita||!f.baseGiuridica){alert('Compila i campi obbligatori (*)');return;}onSave(f);}}>💾 Salva Trattamento</button>
        <button style={C.btn('#f1f5f9','#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </div>
    </AICtx.Provider>
  );
}

// ---- TRATTAMENTO CARD ----
function TrattamentoCard({ t, assets, suppliers, misure, onEdit, onDelete, onOpen, onAnalisi }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const assetNames = (t.assetIds||[]).map(id=>assets.find(a=>a.id===id)?.nome).filter(Boolean);
  const suppNames  = (t.supplierIds||[]).map(id=>suppliers.find(s=>s.id===id)?.nome).filter(Boolean);
  const totMisure = (t.misureIds||[]).length + Object.values(t.misurePerAsset||{}).reduce((s,arr)=>s+arr.length,0);
  return (
    <div style={{...C.card,borderLeft:`4px solid ${STATO_COLOR[t.stato]||'#94a3b8'}`}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
        <div style={{flex:1,cursor:'pointer'}} onClick={()=>onOpen(t)}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontWeight:700,fontSize:15,color:'#0f172a'}}>{t.nome}</span>
            <StatusBadge label={t.stato} color={STATO_COLOR[t.stato]||'#64748b'}/>
          </div>
          <div style={{fontSize:12,color:'#64748b',marginBottom:6,lineHeight:1.5}}>{t.finalita}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',fontSize:11,color:'#94a3b8'}}>
            {t.funzioneAziendale && <span style={{background:'#f0fdf4',color:'#16a34a',fontWeight:700,padding:'1px 7px',borderRadius:20,fontSize:10}}>🏢 {t.funzioneAziendale}</span>}
            <span>⚖️ {t.baseGiuridica}</span>
            {t.hasDatiParticolari && <span style={{background:'#fef2f2',color:'#dc2626',fontWeight:700,padding:'1px 7px',borderRadius:20,fontSize:10}}>🔴 Dati particolari art.9</span>}
            {assetNames.length>0 && <span>🖥️ {assetNames.length} asset</span>}
            {suppNames.length>0  && <span>🏭 {suppNames.length} fornitor{suppNames.length===1?'e':'i'}</span>}
            {totMisure>0 && <span>🔒 {totMisure} misure</span>}
          </div>
        </div>
        <div style={C.row}>
          <button style={{...C.btn('#fef3c7','#d97706',true),fontSize:11}} onClick={()=>onAnalisi(t.id)} title="Analisi dei rischi">⚠️ Rischi</button>
          <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onEdit(t)}>✏️</button>
          {confirmDel
            ? <><button style={C.btn('#dc2626','#fff',true)} onClick={()=>onDelete(t.id)}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setConfirmDel(false)}>✕</button></>
            : <button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setConfirmDel(true)}>🗑️</button>}
        </div>
      </div>
    </div>
  );
}

// ---- AI GENERA TRATTAMENTI MODAL ----
function AIGeneraTrattamentiModal({ client, funzioni, apiKey, onSave, onClose }) {
  const [settore, setSettore] = useState(client?.settore||'');
  const [extraCtx, setExtraCtx] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null); // array di trattamenti proposti
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);

  const genera = async () => {
    if(!apiKey) { setError('API Key Groq mancante. Configurala in alto a destra.'); return; }
    setGenerating(true); setError(''); setPreview(null);
    const BASI = ['Consenso (art.6.1.a)','Contratto (art.6.1.b)','Obbligo legale (art.6.1.c)','Interesse vitale (art.6.1.d)','Interesse pubblico (art.6.1.e)','Interesse legittimo (art.6.1.f)'];
    const system = `Sei un esperto GDPR. Genera trattamenti di dati personali tipici per l'azienda descritta. Rispondi SOLO con un array JSON valido, nessun testo aggiuntivo. Ogni elemento deve avere esattamente questi campi:
{ "nome": string, "funzioneAziendale": string, "finalita": string, "baseGiuridica": one of ${JSON.stringify(BASI)}, "categorieDati": string, "categorieInteressati": string, "destinatariInterni": string, "destinatariEsterni": string, "paesiTerzi": string, "retention": string, "stato": "Attivo", "note": string }`;
    const user = `Azienda: ${client.ragioneSociale}\nSettore: ${settore||client.settore}\nTitolare: ${client.titolare}${extraCtx?'\nContesto aggiuntivo: '+extraCtx:''}\n${funzioni.length?'Funzioni aziendali esistenti: '+funzioni.join(', '):''}\n\nGenera almeno 8-12 trattamenti tipici per questo settore. Per funzioneAziendale usa le funzioni esistenti dove appropriato o creane di nuove coerenti con il settore.`;
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body: JSON.stringify({ model:'llama-3.3-70b-versatile', max_tokens:4000, temperature:0.2,
          messages:[{role:'system',content:system},{role:'user',content:user}] })
      });
      const data = await r.json();
      if(!r.ok||data.error) throw new Error(data.error?.message||'Errore API');
      const txt = data.choices?.[0]?.message?.content?.trim();
      const match = txt.match(/\[[\s\S]*\]/);
      if(!match) throw new Error('Risposta non valida — formato JSON non trovato');
      const arr = JSON.parse(match[0]);
      if(!Array.isArray(arr)||arr.length===0) throw new Error('Array vuoto o non valido');
      setPreview(arr);
      setSelected(arr.map((_,i)=>i));
    } catch(e) { setError(e.message); }
    setGenerating(false);
  };

  const toggleSel = i => setSelected(s=>s.includes(i)?s.filter(x=>x!==i):[...s,i]);

  const importa = () => {
    const toImport = preview.filter((_,i)=>selected.includes(i)).map(t=>({
      ...t,
      id: Date.now().toString()+Math.random().toString(36).slice(2),
      assetIds:[], supplierIds:[], misurePerAsset:{},
      createdAt: new Date().toISOString(),
    }));
    onSave(toImport);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#fff',borderRadius:12,padding:28,width:'100%',maxWidth:780,maxHeight:'90vh',overflow:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:14,borderBottom:'1px solid #f1f5f9'}}>
          <span style={{fontSize:26}}>🤖</span>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:17,color:'#0f172a'}}>Genera Trattamenti con AI</h2>
            <div style={{fontSize:12,color:'#64748b',marginTop:2}}>L'AI analizza il settore e crea i trattamenti direttamente nel Registro</div>
          </div>
          <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#94a3b8'}} onClick={onClose}>✕</button>
        </div>

        {!preview ? (
          <>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Settore aziendale</label>
              <input value={settore} onChange={e=>setSettore(e.target.value)} placeholder="es. Studio legale, Commercio al dettaglio, Sanità..."
                style={{width:'100%',padding:'8px 11px',border:'1.5px solid #dde3ec',borderRadius:8,fontSize:14,boxSizing:'border-box',outline:'none',fontFamily:'inherit'}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Contesto aggiuntivo (opzionale)</label>
              <textarea value={extraCtx} onChange={e=>setExtraCtx(e.target.value)} rows={3}
                placeholder="es. azienda di 20 dipendenti, gestisce dati sanitari, ha un e-commerce..."
                style={{width:'100%',padding:'8px 11px',border:'1.5px solid #dde3ec',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none',fontFamily:'inherit',resize:'vertical'}}/>
            </div>
            {error&&<div style={{marginBottom:12,padding:12,background:'#fef2f2',color:'#dc2626',borderRadius:8,fontSize:13}}>{error}</div>}
            <button style={{background:ACCENT,color:'#fff',border:'none',borderRadius:8,padding:'11px 24px',cursor:'pointer',fontWeight:700,fontSize:15,fontFamily:'inherit',width:'100%',opacity:generating?.7:1}} onClick={genera} disabled={generating}>
              {generating?'⏳ Generazione in corso...':'✨ Genera Trattamenti'}
            </button>
          </>
        ) : (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>{preview.length} trattamenti generati — seleziona quelli da importare</div>
              <div style={{display:'flex',gap:8}}>
                <button style={{fontSize:12,background:'#f1f5f9',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer'}} onClick={()=>setSelected(preview.map((_,i)=>i))}>Tutti</button>
                <button style={{fontSize:12,background:'#f1f5f9',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer'}} onClick={()=>setSelected([])}>Nessuno</button>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20,maxHeight:400,overflowY:'auto'}}>
              {preview.map((t,i)=>{
                const sel=selected.includes(i);
                return (
                  <div key={i} onClick={()=>toggleSel(i)} style={{padding:'12px 14px',borderRadius:8,border:`2px solid ${sel?ACCENT:'#e2e8f0'}`,background:sel?'#eff6ff':'#fafafa',cursor:'pointer',transition:'all .15s'}}>
                    <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                      <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${sel?ACCENT:'#cbd5e1'}`,background:sel?ACCENT:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        {sel&&<span style={{color:'#fff',fontSize:12,fontWeight:700}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:'#0f172a',marginBottom:2}}>{t.nome}</div>
                        {t.funzioneAziendale&&<span style={{fontSize:10,background:'#f0fdf4',color:'#16a34a',fontWeight:700,padding:'1px 7px',borderRadius:20,display:'inline-block',marginBottom:4}}>🏢 {t.funzioneAziendale}</span>}
                        <div style={{fontSize:12,color:'#64748b',marginBottom:3}}>{t.finalita}</div>
                        <div style={{fontSize:11,color:'#94a3b8'}}>⚖️ {t.baseGiuridica} · 👥 {t.categorieInteressati}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button style={{background:ACCENT,color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit',flex:1,opacity:selected.length===0?.5:1}} onClick={importa} disabled={selected.length===0}>
                ✅ Importa {selected.length} trattament{selected.length===1?'o':'i'}
              </button>
              <button style={{background:'#f1f5f9',color:'#374151',border:'none',borderRadius:8,padding:'10px 16px',cursor:'pointer',fontWeight:600,fontSize:14,fontFamily:'inherit'}} onClick={()=>setPreview(null)}>← Rigenera</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- TRATTAMENTO DETAIL ----
function TrattamentoDetail({ t, assets, suppliers, misure, onClose, onEdit }) {
  const assetObj  = Object.fromEntries(assets.map(a=>[a.id,a]));
  const suppObj   = Object.fromEntries(suppliers.map(s=>[s.id,s]));
  const misuraObj = Object.fromEntries(misure.map(m=>[m.id,m]));
  const Row = ({label,val}) => val ? (
    <div style={{marginBottom:10}}>
      <div style={C.lbl}>{label}</div>
      <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{val}</div>
    </div>
  ) : null;
  const roleColor = {'Responsabile del trattamento (Art.28)':'#2563eb','Contitolare':'#7c3aed','Fornitore IT':'#059669','Consulente':'#d97706','Terzo':'#64748b'};
  return (
    <Modal onClose={onClose} maxWidth={760}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:14,borderBottom:'1px solid #f1f5f9'}}>
        <div style={{flex:1}}>
          <h2 style={{margin:0,fontSize:18,color:'#0f172a'}}>{t.nome}</h2>
          <StatusBadge label={t.stato} color={STATO_COLOR[t.stato]||'#64748b'}/>
        </div>
        <button style={C.btn(ACCENT,'#fff',true)} onClick={onEdit}>✏️ Modifica</button>
        <button style={C.btn('#f1f5f9','#374151',true)} onClick={onClose}>✕</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
        {t.funzioneAziendale && <div style={{gridColumn:'1/-1',marginBottom:10}}><span style={{background:'#f0fdf4',color:'#16a34a',fontWeight:700,padding:'3px 10px',borderRadius:20,fontSize:12}}>🏢 {t.funzioneAziendale}</span></div>}
        <div style={{gridColumn:'1/-1'}}><Row label='Finalità' val={t.finalita}/></div>
        <Row label='Base giuridica Art.6' val={t.baseGiuridica}/>
        <Row label='Stato' val={t.stato}/>
        {t.hasDatiParticolari && (
          <div style={{gridColumn:'1/-1',marginBottom:10}}>
            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#dc2626',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>⚠️ Dati di categoria particolare (art.9 GDPR)</div>
              <div style={{fontSize:13,color:'#374151'}}>{t.baseGiuridicaArt9||'Base art.9 non specificata'}</div>
            </div>
          </div>
        )}
        <Row label='Categorie di dati' val={t.categorieDati}/>
        <Row label='Categorie di interessati' val={t.categorieInteressati}/>
        <Row label='Destinatari interni' val={t.destinatariInterni}/>
        <Row label='Responsabili del trattamento' val={t.destinatariEsterni}/>
        <Row label='Paesi terzi' val={t.paesiTerzi}/>
        <Row label='Termini di conservazione' val={t.retention}/>
        <div style={{gridColumn:'1/-1'}}><Row label='Note' val={t.note}/></div>
      </div>

      {/* Asset + Misure */}
      {(t.assetIds||[]).length>0 && (
        <div style={{marginTop:16}}>
          <SectionTitle>🖥️ Asset Associati e Misure di Sicurezza</SectionTitle>
          {(t.assetIds||[]).map(aid=>{
            const asset = assetObj[aid]; if(!asset) return null;
            const mIds = (t.misurePerAsset||{})[aid]||[];
            return (
              <div key={aid} style={{marginBottom:14,padding:12,background:'#f8fafc',borderRadius:8}}>
                <div style={{fontWeight:600,fontSize:13,color:'#0f172a',marginBottom:6}}>🖥️ {asset.nome} <span style={{fontWeight:400,color:'#64748b'}}>({asset.categoria})</span></div>
                {mIds.length===0
                  ? <span style={{fontSize:12,color:'#94a3b8'}}>Nessuna misura associata</span>
                  : <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {mIds.map(mid=>{
                        const m=misuraObj[mid]; if(!m) return null;
                        return (
                          <div key={mid} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,background:'#fff',border:'1px solid #e2e8f0',fontSize:12}}>
                            <StatusBadge label={m.tipo} color={TIPO_COLOR[m.tipo]||'#64748b'}/>
                            <span>{m.nome}</span>
                            <StatusBadge label={m.stato} color={MISURA_COLOR[m.stato]||'#64748b'}/>
                          </div>
                        );
                      })}
                    </div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Fornitori */}
      {(t.supplierIds||[]).length>0 && (
        <div style={{marginTop:16}}>
          <SectionTitle>🏭 Fornitori Associati</SectionTitle>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {(t.supplierIds||[]).map(sid=>{
              const s=suppObj[sid]; if(!s) return null;
              return (
                <div key={sid} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#f8fafc',borderRadius:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,color:'#0f172a'}}>{s.nome}</div>
                    <div style={{fontSize:12,color:'#64748b'}}>{s.servizio} · {s.paeseSede}</div>
                  </div>
                  <StatusBadge label={s.ruolo} color={roleColor[s.ruolo]||'#64748b'}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Misure Art.32 dirette */}
      {(t.misureIds||[]).length>0 && (
        <div style={{marginTop:16}}>
          <SectionTitle>🔒 Misure di Sicurezza Art.32</SectionTitle>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {(t.misureIds||[]).map(mid=>{
              const m=misuraObj[mid]; if(!m) return null;
              const statCol = m.stato==='Implementata'?'#16a34a':m.stato==='In corso'?'#d97706':m.stato==='Pianificata'?'#2563eb':'#94a3b8';
              return (
                <div key={mid} style={{padding:'8px 12px',background:'#f8fafc',borderRadius:8,borderLeft:`3px solid ${statCol}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontWeight:600,fontSize:13,color:'#0f172a'}}>{m.nome}</span>
                    <StatusBadge label={m.tipo} color={TIPO_COLOR[m.tipo]||'#64748b'}/>
                    <StatusBadge label={m.stato} color={statCol}/>
                    {m.riferimentoArt32&&<span style={{fontSize:10,color:'#64748b',background:'#f1f5f9',padding:'1px 6px',borderRadius:8}}>{m.riferimentoArt32.split('—')[0].trim()}</span>}
                  </div>
                  {m.descrizione&&<div style={{fontSize:11,color:'#64748b',marginTop:3}}>{m.descrizione}</div>}
                  <div style={{display:'flex',gap:12,marginTop:3}}>
                    {m.responsabile&&<span style={{fontSize:11,color:'#94a3b8'}}>👤 {m.responsabile}</span>}
                    {m.dataVerifica&&<span style={{fontSize:11,color:'#94a3b8'}}>📅 {new Date(m.dataVerifica).toLocaleDateString('it-IT')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---- ROOT ----
export default function RegistroTrattamenti({ trattamenti, misure, assets, suppliers, client, funzioni, onSaveFunzioni, onSaveTrattamento, onSaveManyTrattamenti, onDeleteTrattamento, onSaveMisure, onGoToAnalisi, apiKey }) {
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const handleSave = t => {
    const record = editing
      ? {...t, id:editing.id, createdAt:editing.createdAt}
      : {...t, id:Date.now().toString(), createdAt:new Date().toISOString()};
    onSaveTrattamento(record);
    setView('list'); setEditing(null);
  };

  const handleAISave = async (arr) => {
    const nuoveFunzioni = arr.map(t=>t.funzioneAziendale).filter(f=>f&&!funzioni.includes(f));
    const uniche = [...new Set(nuoveFunzioni)];
    if(uniche.length>0) onSaveFunzioni([...funzioni,...uniche]);
    await onSaveManyTrattamenti(arr);
    setShowAI(false);
  };

  const handleExportDocx = async () => {
    setExporting(true);
    try { await exportDocx(trattamenti, assets, suppliers, misure, client); }
    catch(e){ alert('Errore export DOCX: '+e.message); }
    setExporting(false);
  };

  if(view==='form') return (
    <div>
      <button style={{...C.btn('#f1f5f9','#374151',true),marginBottom:16}} onClick={()=>{setView('list');setEditing(null);}}>← Indietro</button>
      <div style={{...C.card,marginBottom:16,borderLeft:`4px solid ${ACCENT}`}}>
        <h2 style={{margin:'0 0 2px',fontSize:16,color:'#0f172a'}}>{editing?'✏️ Modifica Trattamento':'➕ Nuovo Trattamento'}</h2>
      </div>
      <MisureLibrary misure={misure} onChange={onSaveMisure}/>
      <TrattamentoForm initial={editing} assets={assets} suppliers={suppliers} misure={misure} funzioni={funzioni||[]} onSaveFunzioni={onSaveFunzioni} onSave={handleSave} onCancel={()=>{setView('list');setEditing(null);}}/>
    </div>
  );

  return (
    <div>
      {detail && (
        <TrattamentoDetail
          t={detail} assets={assets} suppliers={suppliers} misure={misure}
          onClose={()=>setDetail(null)}
          onEdit={()=>{setEditing(detail);setDetail(null);setView('form');}}
        />
      )}

      {showAI&&(
        <AIGeneraTrattamentiModal
          client={client} funzioni={funzioni||[]} apiKey={apiKey}
          onSave={handleAISave} onClose={()=>setShowAI(false)}
        />
      )}

      <div style={{...C.row,justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <h3 style={{margin:'0 0 2px',color:'#0f172a',fontSize:16}}>✍️ Registro dei Trattamenti</h3>
          <div style={{fontSize:12,color:'#64748b'}}>{trattamenti.length} trattamento{trattamenti.length!==1?'i':''}</div>
        </div>
        <div style={C.row}>
          {trattamenti.length>0 && <>
            <button style={C.btn('#16a34a','#fff',true)} onClick={()=>exportExcel(trattamenti,assets,suppliers,misure,client?.ragioneSociale)}>📊 Excel</button>
            <button style={C.btn('#1e40af','#fff',true)} onClick={handleExportDocx} disabled={exporting}>{exporting?'⏳':'📄'} DOCX</button>
          </>}
          <button style={C.btn('#7c3aed','#fff',true)} onClick={()=>setShowAI(true)}>🤖 Genera con AI</button>
          <button style={C.btn()} onClick={()=>{setEditing(null);setView('form');}}>+ Nuovo Trattamento</button>
        </div>
      </div>

      <MisureLibrary misure={misure} onChange={onSaveMisure}/>

      {trattamenti.length===0
        ? <EmptyState icon='📋' title='Nessun trattamento' sub='Aggiungi il primo trattamento per iniziare.' onAction={()=>{setEditing(null);setView('form');}} actionLabel='+ Nuovo Trattamento'/>
        : <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {trattamenti.map(t=>(
              <TrattamentoCard key={t.id} t={t} assets={assets} suppliers={suppliers} misure={misure}
                onEdit={t=>{setEditing(t);setView('form');}}
                onDelete={id=>onDeleteTrattamento(id)}
                onOpen={setDetail}
                onAnalisi={id=>onGoToAnalisi&&onGoToAnalisi(id)}
              />
            ))}
          </div>}
    </div>
  );
}
