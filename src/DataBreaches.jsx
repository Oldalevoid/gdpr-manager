import { useState } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';

const STATI = ['Aperto','In corso','Chiuso'];
const STATO_COLOR = { Aperto:'#dc2626', 'In corso':'#d97706', Chiuso:'#16a34a' };
const TIPI = ['Riservatezza','Integrità','Disponibilità','Riservatezza + Integrità','Riservatezza + Disponibilità','Integrità + Disponibilità','Tutte e tre'];

const EMPTY = {
  protocollo:'', dataRilevazione:'', descrizione:'', tipoViolazione:'Riservatezza',
  categorieDati:'', categorieInteressati:'', numeroInteressati:'', impatto:'',
  notificaGarante:false, dataNotificaGarante:'', notificaGaranteNote:'',
  notificaInteressati:false, dataNotificaInteressati:'', notificaInteressatiNote:'',
  misureContenimento:'', stato:'Aperto', note:''
};

function BreachForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { ...EMPTY, protocollo:`DB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` });
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  const h72 = () => {
    if(!f.dataRilevazione) return null;
    const d = new Date(f.dataRilevazione);
    d.setHours(d.getHours()+72);
    return d.toLocaleString('it-IT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  };
  return (
    <Modal onClose={onCancel} maxWidth={760}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:14,borderBottom:'1px solid #f1f5f9'}}>
        <span style={{fontSize:24}}>🚨</span>
        <div style={{flex:1}}>
          <h2 style={{margin:0,fontSize:17,color:'#0f172a'}}>{initial?'✏️ Modifica Data Breach':'🚨 Nuovo Data Breach'}</h2>
          <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{f.protocollo}</div>
        </div>
        <button style={C.btn('#f1f5f9','#374151',true)} onClick={onCancel}>✕</button>
      </div>

      {/* Dati generali */}
      <div style={{...C.card,marginBottom:14,padding:16,background:'#f8fafc'}}>
        <SectionTitle>📋 Dati dell'Incidente</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 16px'}}>
          <Fld id='protocollo' label='N° Protocollo' val={f.protocollo} onChange={u} ph='es. DB-2025-001'/>
          <Fld id='dataRilevazione' label='Data rilevazione *' type='date' val={f.dataRilevazione} onChange={u}/>
          <Fld id='tipoViolazione' label='Tipo di violazione' val={f.tipoViolazione} onChange={u} options={TIPI}/>
          <div style={{gridColumn:'1/-1'}}><Fld id='descrizione' label="Descrizione dell'incidente *" type='textarea' val={f.descrizione} onChange={u} ph='Descrivere cosa è successo, come è stato scoperto, quali sistemi sono coinvolti...'/></div>
          <Fld id='categorieDati' label='Categorie di dati coinvolti' type='textarea' val={f.categorieDati} onChange={u} ph='es. Dati anagrafici, bancari, sanitari...'/>
          <Fld id='categorieInteressati' label='Categorie di interessati' type='textarea' val={f.categorieInteressati} onChange={u} ph='es. Clienti, dipendenti...'/>
          <Fld id='numeroInteressati' label='N° interessati (stima)' val={f.numeroInteressati} onChange={u} ph='es. circa 150'/>
          <div style={{gridColumn:'1/-1'}}><Fld id='impatto' label='Impatto potenziale' type='textarea' val={f.impatto} onChange={u} ph="es. Rischio di furto d'identità, danno reputazionale, perdita economica..."/></div>
          <div style={{gridColumn:'1/-1'}}><Fld id='misureContenimento' label='Misure di contenimento adottate' type='textarea' val={f.misureContenimento} onChange={u} ph='es. Blocco accessi, cambio credenziali, restore backup, isolamento sistema...'/></div>
        </div>
      </div>

      {/* Notifica Garante */}
      <div style={{...C.card,marginBottom:14,padding:16,background: f.notificaGarante ? '#fefce8':'#f8fafc',border:`1px solid ${f.notificaGarante?'#fde68a':'#e5eaf0'}`}}>
        <SectionTitle>🏛️ Notifica al Garante (Art. 33 GDPR — entro 72h)</SectionTitle>
        {f.dataRilevazione&&(
          <div style={{marginBottom:10,padding:'8px 12px',background:'#fef3c7',borderRadius:8,fontSize:12,color:'#92400e',fontWeight:600}}>
            ⏰ Scadenza 72h: {h72()}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <input type='checkbox' id='notGar' checked={!!f.notificaGarante} onChange={e=>u('notificaGarante',e.target.checked)} style={{width:16,height:16,accentColor:ACCENT}}/>
          <label htmlFor='notGar' style={{fontSize:13,color:'#374151',cursor:'pointer'}}>Notifica inviata al Garante</label>
        </div>
        {f.notificaGarante&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Fld id='dataNotificaGarante' label='Data notifica' type='date' val={f.dataNotificaGarante} onChange={u}/>
            <div/>
            <div style={{gridColumn:'1/-1'}}><Fld id='notificaGaranteNote' label='Note' type='textarea' val={f.notificaGaranteNote} onChange={u} ph='Riferimento protocollo Garante, modalità invio...'/></div>
          </div>
        )}
      </div>

      {/* Notifica Interessati */}
      <div style={{...C.card,marginBottom:14,padding:16,background: f.notificaInteressati ? '#f0fdf4':'#f8fafc',border:`1px solid ${f.notificaInteressati?'#bbf7d0':'#e5eaf0'}`}}>
        <SectionTitle>👥 Comunicazione agli Interessati (Art. 34 GDPR)</SectionTitle>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <input type='checkbox' id='notInt' checked={!!f.notificaInteressati} onChange={e=>u('notificaInteressati',e.target.checked)} style={{width:16,height:16,accentColor:ACCENT}}/>
          <label htmlFor='notInt' style={{fontSize:13,color:'#374151',cursor:'pointer'}}>Comunicazione inviata agli interessati</label>
        </div>
        {f.notificaInteressati&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Fld id='dataNotificaInteressati' label='Data comunicazione' type='date' val={f.dataNotificaInteressati} onChange={u}/>
            <div/>
            <div style={{gridColumn:'1/-1'}}><Fld id='notificaInteressatiNote' label='Note' type='textarea' val={f.notificaInteressatiNote} onChange={u} ph='Canale usato (email, PEC, ecc.), contenuto della comunicazione...'/></div>
          </div>
        )}
      </div>

      {/* Stato */}
      <div style={{...C.card,marginBottom:20,padding:16,background:'#f8fafc'}}>
        <SectionTitle>📊 Stato e Note Finali</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'0 16px'}}>
          <Fld id='stato' label='Stato' val={f.stato} onChange={u} options={STATI}/>
          <Fld id='note' label='Note finali' type='textarea' val={f.note} onChange={u} ph='Lezioni apprese, azioni correttive intraprese...'/>
        </div>
      </div>

      <div style={C.row}>
        <button style={C.btn('#dc2626')} onClick={()=>{if(!f.descrizione||!f.dataRilevazione){alert('Compila i campi obbligatori (*)');return;}onSave({...f,id:initial?.id||Date.now().toString(),createdAt:initial?.createdAt||new Date().toISOString()});}}>
          💾 Salva Data Breach
        </button>
        <button style={C.btn('#f1f5f9','#374151')} onClick={onCancel}>Annulla</button>
      </div>
    </Modal>
  );
}

function BreachCard({ b, onEdit, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const s = b.stato||'Aperto';
  return (
    <div style={{...C.card,borderLeft:`4px solid ${STATO_COLOR[s]||'#64748b'}`}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
        <div style={{flex:1,cursor:'pointer'}} onClick={()=>setExpanded(e=>!e)}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontWeight:700,color:'#0f172a'}}>{b.protocollo||'—'}</span>
            <StatusBadge label={s} color={STATO_COLOR[s]||'#64748b'}/>
            {b.tipoViolazione&&<StatusBadge label={b.tipoViolazione} color='#4f46e5'/>}
            {b.notificaGarante&&<StatusBadge label='🏛️ Garante notificato' color='#059669'/>}
            {!b.notificaGarante&&<StatusBadge label='⚠️ Garante non notificato' color='#d97706'/>}
          </div>
          <div style={{fontSize:13,color:'#374155',marginBottom:4,lineHeight:1.5}}>{b.descrizione}</div>
          <div style={{fontSize:11,color:'#94a3b8'}}>
            Rilevato: {b.dataRilevazione ? new Date(b.dataRilevazione).toLocaleDateString('it-IT') : '—'}
            {b.numeroInteressati&&` · ~${b.numeroInteressati} interessati`}
          </div>
        </div>
        <div style={C.row}>
          <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>onEdit(b)}>✏️</button>
          {confirmDel
            ?<><button style={C.btn('#dc2626','#fff',true)} onClick={()=>onDelete(b.id)}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setConfirmDel(false)}>✕</button></>
            :<button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setConfirmDel(true)}>🗑️</button>}
        </div>
      </div>
      {expanded&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid #f1f5f9',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 24px'}}>
          {b.categorieDati&&<div><div style={C.lbl}>Categorie dati</div><div style={{fontSize:13,color:'#334155'}}>{b.categorieDati}</div></div>}
          {b.categorieInteressati&&<div><div style={C.lbl}>Categorie interessati</div><div style={{fontSize:13,color:'#334155'}}>{b.categorieInteressati}</div></div>}
          {b.impatto&&<div style={{gridColumn:'1/-1'}}><div style={C.lbl}>Impatto potenziale</div><div style={{fontSize:13,color:'#334155'}}>{b.impatto}</div></div>}
          {b.misureContenimento&&<div style={{gridColumn:'1/-1'}}><div style={C.lbl}>Misure di contenimento</div><div style={{fontSize:13,color:'#334155'}}>{b.misureContenimento}</div></div>}
          {b.notificaGarante&&b.dataNotificaGarante&&<div><div style={C.lbl}>Data notifica Garante</div><div style={{fontSize:13,color:'#334155'}}>{new Date(b.dataNotificaGarante).toLocaleDateString('it-IT')}</div></div>}
          {b.notificaInteressati&&b.dataNotificaInteressati&&<div><div style={C.lbl}>Data comunicazione interessati</div><div style={{fontSize:13,color:'#334155'}}>{new Date(b.dataNotificaInteressati).toLocaleDateString('it-IT')}</div></div>}
          {b.note&&<div style={{gridColumn:'1/-1'}}><div style={C.lbl}>Note</div><div style={{fontSize:13,color:'#334155'}}>{b.note}</div></div>}
        </div>
      )}
    </div>
  );
}

export default function DataBreaches({ breaches, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const aperti = breaches.filter(b=>b.stato==='Aperto').length;
  const inCorso = breaches.filter(b=>b.stato==='In corso').length;

  return (
    <div>
      {(showForm||editing) && (
        <BreachForm
          initial={editing}
          onSave={b=>{onSave(b);setShowForm(false);setEditing(null);}}
          onCancel={()=>{setShowForm(false);setEditing(null);}}
        />
      )}
      <div style={{...C.row,justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={C.row}>
          <h3 style={{margin:0,color:'#0f172a',fontSize:16}}>🚨 Registro Data Breach</h3>
          {aperti>0&&<StatusBadge label={`${aperti} aperti`} color='#dc2626'/>}
          {inCorso>0&&<StatusBadge label={`${inCorso} in corso`} color='#d97706'/>}
        </div>
        <button style={C.btn('#dc2626')} onClick={()=>{setEditing(null);setShowForm(true);}}>+ Nuovo Breach</button>
      </div>

      {/* Stats */}
      {breaches.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10,marginBottom:20}}>
          {[['🚨','Aperti',aperti,'#dc2626'],['⚠️','In corso',inCorso,'#d97706'],['✅','Chiusi',breaches.filter(b=>b.stato==='Chiuso').length,'#16a34a'],['📋','Totale',breaches.length,'#2563eb']].map(([ic,lb,n,c])=>(
            <div key={lb} style={{...C.card,textAlign:'center',padding:'14px 8px',borderTop:`3px solid ${c}`}}>
              <div style={{fontSize:22,marginBottom:4}}>{ic}</div>
              <div style={{fontWeight:800,fontSize:20,color:c}}>{n}</div>
              <div style={{fontSize:11,color:'#64748b'}}>{lb}</div>
            </div>
          ))}
        </div>
      )}

      {breaches.length===0
        ? <EmptyState icon='🚨' title='Nessun data breach registrato' sub='Buona notizia! Registra qui eventuali violazioni di dati personali.' onAction={()=>{setEditing(null);setShowForm(true);}} actionLabel='+ Nuovo Breach'/>
        : <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[...breaches].sort((a,b)=>new Date(b.dataRilevazione||0)-new Date(a.dataRilevazione||0)).map(b=>(
              <BreachCard key={b.id} b={b}
                onEdit={b=>{setEditing(b);setShowForm(true);}}
                onDelete={onDelete}
              />
            ))}
          </div>}
    </div>
  );
}
