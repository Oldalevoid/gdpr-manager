import { useState } from 'react';
import { C, Fld, Modal, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';

const PROB_LABELS = ['','Bassa','Media','Alta','Molto Alta'];
const IMP_LABELS  = ['','Trascurabile','Moderato','Significativo','Grave'];
const riskColor = r => r<=4?'#16a34a':r<=8?'#d97706':r<=12?'#ea580c':'#dc2626';
const riskLabel = r => r<=4?'Basso':r<=8?'Medio':r<=12?'Alto':'Critico';

export function ScenarioForm({ initial, onSave, onCancel }) {
  const empty = { minaccia:'', vulnerabilita:'', probabilita:1, impatto:1, misureMitigazione:'', rischioResiduo:1 };
  const [f, setF] = useState(initial || empty);
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  const rischio = f.probabilita * f.impatto;
  return (
    <Modal onClose={onCancel} maxWidth={600}>
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
      <Fld id='misureMitigazione' label='Misure di mitigazione' type='textarea' val={f.misureMitigazione} onChange={u} ph='es. Implementare 2FA, cifratura dati a riposo...'/>
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

function ScenarioList({ scenarios, onAdd, onEdit, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(null);
  return (
    <div>
      <div style={{...C.row,justifyContent:'space-between',marginBottom:12}}>
        <SectionTitle>⚠️ Scenari di Rischio</SectionTitle>
        <button style={C.btn(ACCENT,'#fff',true)} onClick={onAdd}>+ Aggiungi scenario</button>
      </div>
      {scenarios.length===0
        ? <div style={{textAlign:'center',padding:24,color:'#94a3b8',fontSize:13}}>Nessuno scenario ancora.</div>
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {scenarios.map(s=>{
              const rischio = s.probabilita*s.impatto;
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
                    {s.misureMitigazione&&<div style={{fontSize:12,color:'#374151',marginTop:4}}>🛡️ {s.misureMitigazione}</div>}
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

export default function AnalisiRischi({ trattamenti, analisi, onSave, initialSelId }) {
  const [selId, setSelId] = useState(initialSelId||trattamenti[0]?.id||null);
  const [showForm, setShowForm] = useState(false);
  const [editScenario, setEditScenario] = useState(null);

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

  return (
    <div>
      {(showForm||editScenario) && (
        <ScenarioForm
          initial={editScenario}
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
                    onAdd={()=>{setEditScenario(null);setShowForm(true);}}
                    onEdit={s=>{setEditScenario(s);setShowForm(true);}}
                    onDelete={handleDelete}
                  />
                </div>
              : <EmptyState icon='👈' title='Seleziona un trattamento'/>}
          </div>}
    </div>
  );
}
