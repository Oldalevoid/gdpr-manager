import { useState } from 'react';
import { useAICtx } from './AIContext';
import { isAIEnabled, generateFieldContent } from './aiHelper';

export const PRIMARY = '#1a3a5c';
export const ACCENT  = '#2563eb';

export const C = {
  card: {background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #e5eaf0'},
  btn:  (bg=ACCENT,col='#fff',sm=false)=>({background:bg,color:col,border:'none',borderRadius:8,padding:sm?'6px 12px':'9px 18px',cursor:'pointer',fontWeight:600,fontSize:sm?12:14,fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}),
  inp:  {width:'100%',padding:'8px 11px',border:'1.5px solid #dde3ec',borderRadius:8,fontSize:14,boxSizing:'border-box',outline:'none',fontFamily:'inherit',background:'#fff'},
  lbl:  {display:'block',fontSize:11,fontWeight:700,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'},
  row:  {display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'},
};

function AIModal({ label, initialPrompt, onApply, onClose }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setPreview('');
    setLoading(true);
    let buf = '';
    try {
      await generateFieldContent(label, '', prompt, chunk => {
        buf += chunk;
        setPreview(buf);
      });
    } catch (e) {
      setPreview('❌ Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{background:'#fff',borderRadius:14,padding:28,width:'100%',maxWidth:560,boxShadow:'0 8px 40px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
          <span style={{fontSize:20}}>✨</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15,color:'#0f172a'}}>Genera con IA</div>
            <div style={{fontSize:12,color:'#64748b',marginTop:1}}>Campo: <strong>{label}</strong></div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#94a3b8',lineHeight:1}}>✕</button>
        </div>

        <div style={{marginBottom:14}}>
          <label style={C.lbl}>Prompt — modifica per personalizzare il risultato</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
            style={{...C.inp, resize:'vertical', minHeight:80, fontSize:13}}
            onFocus={e => e.target.style.borderColor='#6366f1'}
            onBlur={e => e.target.style.borderColor='#dde3ec'} />
        </div>

        <button onClick={generate} disabled={loading}
          style={{...C.btn('#6366f1','#fff'), marginBottom:16, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer'}}>
          {loading ? '⏳ Generando...' : '✨ Genera'}
        </button>

        {preview && (
          <div style={{marginBottom:16}}>
            <label style={C.lbl}>Anteprima</label>
            <div style={{background:'#f8fafc',border:'1.5px solid #6366f1',borderRadius:8,padding:'10px 14px',fontSize:14,color:'#0f172a',lineHeight:1.6,minHeight:60,whiteSpace:'pre-wrap'}}>
              {preview}
              {loading && <span style={{color:'#6366f1'}}>▌</span>}
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={C.btn('#f1f5f9','#374151')}>Annulla</button>
          {preview && !loading && (
            <button onClick={() => { onApply(preview); onClose(); }} style={C.btn('#6366f1','#fff')}>
              ✅ Applica al campo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Fld({id, label, type='text', val, onChange, ph, options, cols, ctx=''}) {
  const [showAI, setShowAI] = useState(false);
  const aiCtx = useAICtx();

  const fo = e => e.target.style.borderColor = ACCENT;
  const bl = e => e.target.style.borderColor = '#dde3ec';
  const wrap = child => (
    <div style={{marginBottom:14,gridColumn:cols?`span ${cols}`:undefined}}>{child}</div>
  );

  const canAI = isAIEnabled && (type === 'textarea' || type === 'text');

  const buildPrompt = () => [
    aiCtx.clientName && `Azienda: ${aiCtx.clientName}`,
    aiCtx.sectionLabel && `Sezione: ${aiCtx.sectionLabel}`,
    aiCtx.recordName && `Record corrente: ${aiCtx.recordName}`,
    ctx,
    ph && `Istruzioni campo: ${ph}`,
    `\nGenera il contenuto per il campo "${label}".`,
  ].filter(Boolean).join('\n');

  const AIBtn = canAI && (
    <button type='button' onClick={() => setShowAI(true)} title='Genera con IA'
      style={{
        border: 'none', cursor: 'pointer', background: '#6366f1',
        color: '#fff', borderRadius: 5, padding: '1px 8px', fontSize: 10,
        fontWeight: 700, fontFamily: 'inherit', marginLeft: 7,
        verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center', gap: 3, lineHeight: '1.7',
      }}>
      ✨ IA
    </button>
  );

  if (options) return wrap(<>
    <label style={C.lbl}>{label}</label>
    <select value={val||''} onChange={e=>onChange(id,e.target.value)} style={C.inp} onFocus={fo} onBlur={bl}>
      <option value=''>Seleziona...</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </>);

  const Tag = type === 'textarea' ? 'textarea' : 'input';
  return wrap(<>
    {showAI && (
      <AIModal
        label={label}
        initialPrompt={buildPrompt()}
        onApply={v => onChange(id, v)}
        onClose={() => setShowAI(false)}
      />
    )}
    <label style={C.lbl}>{label}{AIBtn}</label>
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
export const STATI_MISURA = ['Implementata','In corso','Pianificata','Non implementata'];
export const ART32_RIFERIMENTI = [
  'Art.32.1.a — Pseudonimizzazione e cifratura',
  'Art.32.1.b — Riservatezza, integrità, disponibilità e resilienza',
  'Art.32.1.c — Ripristino disponibilità/accesso (disaster recovery)',
  'Art.32.1.d — Procedura test, verifica e valutazione efficacia',
  'Art.32.2 — Rischi presentazione, distruzione accidentale/illecita',
  'Art.32 — Misura tecnica generale',
  'Art.32 — Misura organizzativa generale',
];
