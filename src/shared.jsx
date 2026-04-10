export const PRIMARY = '#1a3a5c';
export const ACCENT  = '#2563eb';

export const C = {
  card: {background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #e5eaf0'},
  btn:  (bg=ACCENT,col='#fff',sm=false)=>({background:bg,color:col,border:'none',borderRadius:8,padding:sm?'6px 12px':'9px 18px',cursor:'pointer',fontWeight:600,fontSize:sm?12:14,fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}),
  inp:  {width:'100%',padding:'8px 11px',border:'1.5px solid #dde3ec',borderRadius:8,fontSize:14,boxSizing:'border-box',outline:'none',fontFamily:'inherit',background:'#fff'},
  lbl:  {display:'block',fontSize:11,fontWeight:700,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'},
  row:  {display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'},
};

export function Fld({id,label,type='text',val,onChange,ph,options,cols}) {
  const fo = e=>e.target.style.borderColor=ACCENT;
  const bl = e=>e.target.style.borderColor='#dde3ec';
  const wrap = child => (
    <div style={{marginBottom:14,gridColumn:cols?`span ${cols}`:undefined}}>{child}</div>
  );
  if(options) return wrap(<>
    <label style={C.lbl}>{label}</label>
    <select value={val||''} onChange={e=>onChange(id,e.target.value)} style={C.inp} onFocus={fo} onBlur={bl}>
      <option value=''>Seleziona...</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </>);
  const Tag = type==='textarea' ? 'textarea' : 'input';
  return wrap(<>
    <label style={C.lbl}>{label}</label>
    <Tag value={val||''} onChange={e=>onChange(id,e.target.value)} placeholder={ph}
      rows={type==='textarea'?3:undefined} type={type==='date'?'date':undefined}
      style={{...C.inp,resize:type==='textarea'?'vertical':undefined,minHeight:type==='textarea'?68:undefined}}
      onFocus={fo} onBlur={bl}/>
  </>);
}

export function Modal({children,onClose,maxWidth=640}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{...C.card,width:'100%',maxWidth,maxHeight:'90vh',overflow:'auto',padding:28}}>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({label,color}) {
  return <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:color+'22',color,display:'inline-block'}}>{label}</span>;
}

export function EmptyState({icon,title,sub,onAction,actionLabel}) {
  return (
    <div style={{textAlign:'center',padding:'48px 20px',color:'#94a3b8'}}>
      <div style={{fontSize:42,marginBottom:12}}>{icon}</div>
      <div style={{fontWeight:700,fontSize:15,color:'#374151',marginBottom:4}}>{title}</div>
      {sub&&<div style={{fontSize:13,marginBottom:16}}>{sub}</div>}
      {onAction&&<button style={C.btn()} onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

export function SectionTitle({children}) {
  return <div style={{fontWeight:700,fontSize:11,color:'#64748b',marginBottom:12,paddingBottom:8,borderBottom:'1px solid #f1f5f9',textTransform:'uppercase',letterSpacing:'.4px'}}>{children}</div>;
}

export const BASI_GIURIDICHE = ['Consenso (art.6.1.a)','Contratto (art.6.1.b)','Obbligo legale (art.6.1.c)','Interesse vitale (art.6.1.d)','Interesse pubblico (art.6.1.e)','Interesse legittimo (art.6.1.f)'];
export const BASI_GIURIDICHE_ART9 = [
  'Consenso esplicito (art.9.2.a)',
  'Diritti in materia di lavoro e protezione sociale (art.9.2.b)',
  'Interessi vitali — interessato incapace di prestare consenso (art.9.2.c)',
  'Fondazione, associazione o organismo senza scopo di lucro (art.9.2.d)',
  'Dati resi manifestamente pubblici dall\'interessato (art.9.2.e)',
  'Accertamento, esercizio o difesa di diritti in sede giudiziaria (art.9.2.f)',
  'Interesse pubblico rilevante su base legislativa (art.9.2.g)',
  'Finalità di medicina preventiva o del lavoro (art.9.2.h)',
  'Interesse pubblico nel settore della sanità pubblica (art.9.2.i)',
  'Archiviazione, ricerca scientifica/storica o fini statistici (art.9.2.j)',
];
export const STATI_TRATTAMENTO = ['Attivo','Sospeso','Cessato'];
export const TIPI_MISURA = ['Tecnica','Organizzativa','Fisica','Logica'];
export const STATI_MISURA = ['Implementata','In corso','Pianificata'];
