import { useState } from 'react';
import { C, Fld, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import { ScenarioForm, TrattamentoSelector } from './AnalisiRischi';

const STATI = ['Bozza','Approvata','Da rivedere'];
const STATO_COLOR = { Bozza:'#d97706', Approvata:'#16a34a', 'Da rivedere':'#dc2626' };

const EMPTY = {
  necessita:'', proporzionalita:'', finalitaLecita:'',
  scenarios:[],
  misure:'',
  dpoConsultato:false, dpoData:'', dpoNote:'',
  stato:'Bozza', dataApprovazione:'', dataRevisione:'', note:''
};

export default function DPIA({ trattamenti, dpia, misure, onSave }) {
  const [selId, setSelId] = useState(trattamenti[0]?.id||null);
  const [showScenario, setShowScenario] = useState(false);
  const [editScenario, setEditScenario] = useState(null);

  const record = dpia.find(d=>d.trattamentoId===selId);
  const f = record?.data || EMPTY;
  const tratt = trattamenti.find(t=>t.id===selId);

  const persist = (data) => {
    onSave({
      id: record?.id||Date.now().toString(),
      trattamentoId: selId,
      data,
      createdAt: record?.createdAt||new Date().toISOString(),
      label: tratt?.nome||''
    });
  };

  const u = (k,v) => persist({...f,[k]:v});

  const handleSaveScenario = s => {
    const updated = editScenario ? f.scenarios.map(x=>x.id===s.id?s:x) : [...(f.scenarios||[]),s];
    persist({...f,scenarios:updated});
    setShowScenario(false); setEditScenario(null);
  };

  const handleDelScenario = id => persist({...f,scenarios:(f.scenarios||[]).filter(s=>s.id!==id)});

  const [confirmDel, setConfirmDel] = useState(null);

  if(!selId || !tratt) return (
    <div>
      <h3 style={{margin:'0 0 16px',color:'#0f172a',fontSize:16}}>🔍 DPIA — Data Protection Impact Assessment</h3>
      {trattamenti.length===0
        ? <EmptyState icon='🔍' title='Nessun trattamento' sub='Crea prima un trattamento nel tab Registro.'/>
        : <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20}}>
            <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId}/>
            <EmptyState icon='👈' title='Seleziona un trattamento'/>
          </div>}
    </div>
  );

  return (
    <div>
      {(showScenario||editScenario) && (
        <ScenarioForm initial={editScenario} onSave={handleSaveScenario} onCancel={()=>{setShowScenario(false);setEditScenario(null);}}/>
      )}
      <h3 style={{margin:'0 0 16px',color:'#0f172a',fontSize:16}}>🔍 DPIA — Data Protection Impact Assessment</h3>
      <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20,alignItems:'start'}}>
        <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId}/>
        <div>
          {/* Header */}
          <div style={{...C.card,marginBottom:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:'#0f172a'}}>{tratt.nome}</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:2}}>DPIA</div>
            </div>
            <StatusBadge label={f.stato} color={STATO_COLOR[f.stato]||'#64748b'}/>
            <select value={f.stato} onChange={e=>u('stato',e.target.value)} style={{...C.inp,width:'auto',minWidth:140}}>
              {STATI.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Necessità e proporzionalità */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>1. Necessità e Proporzionalità</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
              <Fld id='finalitaLecita' label='Finalità lecita e determinata' type='textarea' val={f.finalitaLecita} onChange={u} ph='Descrivere perché la finalità è lecita, specificata ed esplicita...'/>
              <Fld id='necessita' label='Necessità del trattamento' type='textarea' val={f.necessita} onChange={u} ph='Il trattamento è necessario? Non esistono mezzi meno invasivi?'/>
              <div style={{gridColumn:'1/-1'}}>
                <Fld id='proporzionalita' label='Proporzionalità' type='textarea' val={f.proporzionalita} onChange={u} ph='Il trattamento è proporzionato rispetto alle finalità perseguite?'/>
              </div>
            </div>
          </div>

          {/* Scenari di rischio */}
          <div style={{...C.card,marginBottom:16}}>
            <div style={{...C.row,justifyContent:'space-between',marginBottom:12}}>
              <SectionTitle>2. Scenari di Rischio</SectionTitle>
              <button style={C.btn(ACCENT,'#fff',true)} onClick={()=>{setEditScenario(null);setShowScenario(true);}}>+ Aggiungi</button>
            </div>
            {(f.scenarios||[]).length===0
              ? <div style={{textAlign:'center',padding:16,color:'#94a3b8',fontSize:13}}>Nessuno scenario ancora.</div>
              : (f.scenarios||[]).map(s=>{
                  const r=s.probabilita*s.impatto;
                  const rc=r<=4?'#16a34a':r<=8?'#d97706':r<=12?'#ea580c':'#dc2626';
                  return (
                    <div key={s.id} style={{...C.card,padding:'10px 14px',marginBottom:8,borderLeft:`3px solid ${rc}`,display:'flex',gap:10,alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{s.minaccia}</div>
                        <div style={{fontSize:11,color:'#94a3b8'}}>P:{s.probabilita} × I:{s.impatto} = {r} | Residuo: {s.rischioResiduo}</div>
                        {s.misureMitigazione&&<div style={{fontSize:12,color:'#374151',marginTop:2}}>🛡️ {s.misureMitigazione}</div>}
                      </div>
                      <div style={C.row}>
                        <button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>{setEditScenario(s);setShowScenario(true);}}>✏️</button>
                        {confirmDel===s.id
                          ?<><button style={C.btn('#dc2626','#fff',true)} onClick={()=>{handleDelScenario(s.id);setConfirmDel(null);}}>Conferma</button><button style={C.btn('#f1f5f9','#374151',true)} onClick={()=>setConfirmDel(null)}>✕</button></>
                          :<button style={C.btn('#fff5f5','#dc2626',true)} onClick={()=>setConfirmDel(s.id)}>🗑️</button>}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Misure */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>3. Misure per Affrontare i Rischi</SectionTitle>
            <Fld id='misure' label='Misure previste / adottate' type='textarea' val={f.misure} onChange={u} ph='Descrivere le misure tecniche e organizzative adottate per ridurre i rischi identificati...'/>
            {misure.length>0&&(
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'#475569',marginBottom:6,textTransform:'uppercase',letterSpacing:'.4px'}}>Misure dalla libreria</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {misure.map(m=>(
                    <span key={m.id} style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>{m.nome} ({m.stato})</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Consultazione DPO */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>4. Consultazione DPO</SectionTitle>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <input type='checkbox' id='dpoCheck' checked={!!f.dpoConsultato} onChange={e=>u('dpoConsultato',e.target.checked)} style={{width:16,height:16,accentColor:ACCENT}}/>
              <label htmlFor='dpoCheck' style={{fontSize:13,color:'#374151',cursor:'pointer'}}>DPO consultato</label>
            </div>
            {f.dpoConsultato&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
                <Fld id='dpoData' label='Data consultazione' type='date' val={f.dpoData} onChange={u} ph=''/>
                <div/>
                <div style={{gridColumn:'1/-1'}}><Fld id='dpoNote' label='Note DPO' type='textarea' val={f.dpoNote} onChange={u} ph='Parere del DPO, eventuali raccomandazioni...'/></div>
              </div>
            )}
          </div>

          {/* Date e stato finale */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>5. Stato e Date</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 16px'}}>
              <Fld id='dataApprovazione' label='Data approvazione' type='date' val={f.dataApprovazione} onChange={u} ph=''/>
              <Fld id='dataRevisione' label='Data prossima revisione' type='date' val={f.dataRevisione} onChange={u} ph=''/>
              <div/>
              <div style={{gridColumn:'1/-1'}}><Fld id='note' label='Note finali' type='textarea' val={f.note} onChange={u} ph='Eventuali note conclusive...'/></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
