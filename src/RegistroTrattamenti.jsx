import { useState } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT, BASI_GIURIDICHE, STATI_TRATTAMENTO, TIPI_MISURA, STATI_MISURA } from './shared';

const STATO_COLOR = { Attivo:'#16a34a', Sospeso:'#d97706', Cessato:'#64748b' };
const MISURA_COLOR = { Implementata:'#16a34a', 'In corso':'#d97706', Pianificata:'#2563eb' };
const TIPO_COLOR   = { Tecnica:'#0891b2', Organizzativa:'#7c3aed', Fisica:'#b45309', Logica:'#4f46e5' };

// ---- MISURE LIBRARY ----
function MisureLibrary({ misure, onChange }) {
  const [form, setForm] = useState({ nome:'', tipo:'Tecnica', stato:'Implementata' });
  const [editing, setEditing] = useState(null);
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = () => {
    if(!form.nome.trim()) return;
    if(editing!==null) { onChange(misure.map((m,i)=>i===editing?{...m,...form}:m)); setEditing(null); }
    else onChange([...misure,{...form,id:Date.now().toString()}]);
    setForm({nome:'',tipo:'Tecnica',stato:'Implementata'});
  };
  return (
    <div style={{...C.card,marginBottom:20}}>
      <SectionTitle>📚 Libreria Misure di Sicurezza</SectionTitle>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:'0 10px',alignItems:'end'}}>
        <Fld id='nome' label='Nome misura *' val={form.nome} onChange={u} ph='es. Backup giornaliero, Crittografia...'/>
        <Fld id='tipo' label='Tipo' val={form.tipo} onChange={u} options={TIPI_MISURA}/>
        <Fld id='stato' label='Stato' val={form.stato} onChange={u} options={STATI_MISURA}/>
        <div style={{marginBottom:14}}>
          <div style={{...C.lbl,opacity:0}}>X</div>
          <button style={C.btn(ACCENT,'#fff',true)} onClick={save}>{editing!==null?'✓ Aggiorna':'+ Aggiungi'}</button>
        </div>
      </div>
      {editing!==null && <button style={{...C.btn('#f1f5f9','#374151',true),marginBottom:12}} onClick={()=>{setEditing(null);setForm({nome:'',tipo:'Tecnica',stato:'Implementata'});}}>✕ Annulla</button>}
      {misure.length===0
        ? <div style={{textAlign:'center',padding:'16px',color:'#94a3b8',fontSize:13}}>Nessuna misura ancora. Aggiungile qui per poi associarle ai trattamenti.</div>
        : <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {misure.map((m,i)=>(
              <div key={m.id||i} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px 4px 8px',borderRadius:20,background:'#f8fafc',border:'1px solid #e2e8f0'}}>
                <StatusBadge label={m.tipo} color={TIPO_COLOR[m.tipo]||'#64748b'}/>
                <span style={{fontSize:13,color:'#0f172a',fontWeight:500}}>{m.nome}</span>
                <StatusBadge label={m.stato} color={MISURA_COLOR[m.stato]||'#64748b'}/>
                <button style={{...C.btn('#f1f5f9','#374151',true),padding:'2px 6px',fontSize:11}} onClick={()=>{setForm({nome:m.nome,tipo:m.tipo,stato:m.stato});setEditing(i);}}>✏️</button>
                <button style={{...C.btn('#fff5f5','#dc2626',true),padding:'2px 6px',fontSize:11}} onClick={()=>onChange(misure.filter((_,idx)=>idx!==i))}>🗑️</button>
              </div>
            ))}
          </div>}
    </div>
  );
}

// ---- TRATTAMENTO FORM ----
const EMPTY_T = { nome:'',finalita:'',baseGiuridica:'',categorieDati:'',categorieInteressati:'',destinatariInterni:'',destinatariEsterni:'',paesiTerzi:'',retention:'',stato:'Attivo',note:'',assetIds:[],misurePerAsset:{} };

function TrattamentoForm({ initial, assets, misure, onSave, onCancel }) {
  const [f, setF] = useState(initial || EMPTY_T);
  const u = (k,v) => setF(p=>({...p,[k]:v}));

  const toggleAsset = id => {
    const cur = f.assetIds||[];
    const next = cur.includes(id) ? cur.filter(x=>x!==id) : [...cur,id];
    const misurePerAsset = {...(f.misurePerAsset||{})};
    if(!next.includes(id)) delete misurePerAsset[id];
    setF(p=>({...p,assetIds:next,misurePerAsset}));
  };

  const toggleMisuraAsset = (assetId, misuraId) => {
    const cur = (f.misurePerAsset||{})[assetId]||[];
    const next = cur.includes(misuraId) ? cur.filter(x=>x!==misuraId) : [...cur,misuraId];
    setF(p=>({...p,misurePerAsset:{...(p.misurePerAsset||{}),[assetId]:next}}));
  };

  return (
    <div>
      <div style={{...C.card,marginBottom:16}}>
        <SectionTitle>📋 Dati del Trattamento</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
          <div style={{gridColumn:'1/-1'}}><Fld id='nome' label='Nome trattamento *' val={f.nome} onChange={u} ph='es. Gestione clienti, Elaborazione paghe...'/></div>
          <div style={{gridColumn:'1/-1'}}><Fld id='finalita' label='Finalità *' type='textarea' val={f.finalita} onChange={u} ph='es. Gestione del rapporto contrattuale con i clienti...'/></div>
          <Fld id='baseGiuridica' label='Base giuridica *' val={f.baseGiuridica} onChange={u} options={BASI_GIURIDICHE}/>
          <Fld id='stato' label='Stato' val={f.stato} onChange={u} options={STATI_TRATTAMENTO}/>
          <Fld id='categorieDati' label='Categorie di dati' type='textarea' val={f.categorieDati} onChange={u} ph='es. Dati anagrafici, contrattuali, bancari...'/>
          <Fld id='categorieInteressati' label='Categorie di interessati' type='textarea' val={f.categorieInteressati} onChange={u} ph='es. Clienti, dipendenti, fornitori...'/>
          <Fld id='destinatariInterni' label='Destinatari interni' type='textarea' val={f.destinatariInterni} onChange={u} ph='es. Ufficio amministrativo, reparto IT...'/>
          <Fld id='destinatariEsterni' label='Destinatari esterni (Resp. Art.28)' type='textarea' val={f.destinatariEsterni} onChange={u} ph='es. Studio commercialista, provider hosting...'/>
          <Fld id='paesiTerzi' label='Trasferimenti paesi terzi' val={f.paesiTerzi} onChange={u} ph='es. Nessuno / USA tramite SCC'/>
          <Fld id='retention' label='Termini di conservazione' val={f.retention} onChange={u} ph='es. 10 anni (obbligo fiscale), 2 anni (marketing)'/>
          <div style={{gridColumn:'1/-1'}}><Fld id='note' label='Note' type='textarea' val={f.note} onChange={u} ph='Altre informazioni rilevanti...'/></div>
        </div>
      </div>

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

      <div style={C.row}>
        <button style={C.btn()} onClick={()=>{if(!f.nome||!f.finalita||!f.baseGiuridica){alert('Compila i campi obbligatori (*)');return;}onSave(f);}}>💾 Salva Trattamento</button>
        <button style={C.btn('#f1f5f9','#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
}

// ---- TRATTAMENTO CARD ----
function TrattamentoCard({ t, assets, misure, onEdit, onDelete, onOpen }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const assetNames = (t.assetIds||[]).map(id=>assets.find(a=>a.id===id)?.nome).filter(Boolean);
  const totMisure = Object.values(t.misurePerAsset||{}).reduce((s,arr)=>s+arr.length,0);
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
            <span>⚖️ {t.baseGiuridica}</span>
            {assetNames.length>0 && <span>🖥️ {assetNames.length} asset</span>}
            {totMisure>0 && <span>🔒 {totMisure} misure</span>}
          </div>
        </div>
        <div style={C.row}>
          <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onEdit(t)}>✏️</button>
          {confirmDel
            ? <><button style={C.btn('#dc2626','#fff',true)} onClick={()=>onDelete(t.id)}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setConfirmDel(false)}>✕</button></>
            : <button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setConfirmDel(true)}>🗑️</button>}
        </div>
      </div>
    </div>
  );
}

// ---- TRATTAMENTO DETAIL (read-only view) ----
function TrattamentoDetail({ t, assets, misure, onClose, onEdit }) {
  const assetObj = Object.fromEntries(assets.map(a=>[a.id,a]));
  const misuraObj = Object.fromEntries(misure.map(m=>[m.id,m]));
  const Row = ({label,val}) => val ? (
    <div style={{marginBottom:10}}>
      <div style={{...C.lbl}}>{label}</div>
      <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{val}</div>
    </div>
  ) : null;
  return (
    <Modal onClose={onClose} maxWidth={720}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:14,borderBottom:'1px solid #f1f5f9'}}>
        <div style={{flex:1}}>
          <h2 style={{margin:0,fontSize:18,color:'#0f172a'}}>{t.nome}</h2>
          <StatusBadge label={t.stato} color={STATO_COLOR[t.stato]||'#64748b'}/>
        </div>
        <button style={C.btn(ACCENT,'#fff',true)} onClick={onEdit}>✏️ Modifica</button>
        <button style={C.btn('#f1f5f9','#374151',true)} onClick={onClose}>✕</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
        <div style={{gridColumn:'1/-1'}}><Row label='Finalità' val={t.finalita}/></div>
        <Row label='Base giuridica' val={t.baseGiuridica}/>
        <Row label='Stato' val={t.stato}/>
        <Row label='Categorie di dati' val={t.categorieDati}/>
        <Row label='Categorie di interessati' val={t.categorieInteressati}/>
        <Row label='Destinatari interni' val={t.destinatariInterni}/>
        <Row label='Destinatari esterni' val={t.destinatariEsterni}/>
        <Row label='Paesi terzi' val={t.paesiTerzi}/>
        <Row label='Termini di conservazione' val={t.retention}/>
        <div style={{gridColumn:'1/-1'}}><Row label='Note' val={t.note}/></div>
      </div>
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
    </Modal>
  );
}

// ---- ROOT ----
export default function RegistroTrattamenti({ trattamenti, misure, assets, onSaveTrattamento, onDeleteTrattamento, onSaveMisure }) {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const handleSave = t => {
    const record = editing ? {...t, id:editing.id, createdAt:editing.createdAt} : {...t, id:Date.now().toString(), createdAt:new Date().toISOString()};
    onSaveTrattamento(record);
    setView('list'); setEditing(null);
  };

  if(view==='form') return (
    <div>
      <button style={{...C.btn('#f1f5f9','#374151',true),marginBottom:16}} onClick={()=>{setView('list');setEditing(null);}}>← Indietro</button>
      <div style={{...C.card,marginBottom:16,borderLeft:`4px solid ${ACCENT}`}}>
        <h2 style={{margin:'0 0 2px',fontSize:16,color:'#0f172a'}}>{editing?'✏️ Modifica Trattamento':'➕ Nuovo Trattamento'}</h2>
      </div>
      <MisureLibrary misure={misure} onChange={onSaveMisure}/>
      <TrattamentoForm initial={editing} assets={assets} misure={misure} onSave={handleSave} onCancel={()=>{setView('list');setEditing(null);}}/>
    </div>
  );

  return (
    <div>
      {detail && (
        <TrattamentoDetail
          t={detail} assets={assets} misure={misure}
          onClose={()=>setDetail(null)}
          onEdit={()=>{setEditing(detail);setDetail(null);setView('form');}}
        />
      )}
      <div style={{...C.row,justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h3 style={{margin:'0 0 2px',color:'#0f172a',fontSize:16}}>✍️ Registro dei Trattamenti</h3>
          <div style={{fontSize:12,color:'#64748b'}}>{trattamenti.length} trattamento{trattamenti.length!==1?'i':''}</div>
        </div>
        <button style={C.btn()} onClick={()=>{setEditing(null);setView('form');}}>+ Nuovo Trattamento</button>
      </div>
      <MisureLibrary misure={misure} onChange={onSaveMisure}/>
      {trattamenti.length===0
        ? <EmptyState icon='📋' title='Nessun trattamento' sub='Aggiungi il primo trattamento per iniziare.' onAction={()=>{setEditing(null);setView('form');}} actionLabel='+ Nuovo Trattamento'/>
        : <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {trattamenti.map(t=>(
              <TrattamentoCard key={t.id} t={t} assets={assets} misure={misure}
                onEdit={t=>{setEditing(t);setView('form');}}
                onDelete={id=>onDeleteTrattamento(id)}
                onOpen={setDetail}
              />
            ))}
          </div>}
    </div>
  );
}
