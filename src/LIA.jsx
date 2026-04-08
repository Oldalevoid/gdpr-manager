import { useState } from 'react';
import { C, Fld, StatusBadge, EmptyState, SectionTitle, ACCENT } from './shared';
import { TrattamentoSelector } from './AnalisiRischi';

const ESITI = ['Positivo','Negativo','Da rivedere'];
const ESITO_COLOR = { Positivo:'#16a34a', Negativo:'#dc2626', 'Da rivedere':'#d97706' };

const EMPTY = {
  purposeTest: { interesseLegittimo:'', specificita:'', note:'' },
  necessityTest: { necessita:'', alternative:'', proporzionalita:'' },
  balancingTest: { interessiTitolare:'', dirittiInteressati:'', salvaguardie:'', esito:'' },
  conclusione:'', esito:'Da rivedere', dataValutazione:''
};

export default function LIA({ trattamenti, lia, onSave }) {
  const [selId, setSelId] = useState(trattamenti[0]?.id||null);

  const record = lia.find(l=>l.trattamentoId===selId);
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

  const uNested = (section, k, v) => persist({ ...f, [section]: { ...(f[section]||{}), [k]:v } });
  const u = (k,v) => persist({...f,[k]:v});

  if(!selId || !tratt) return (
    <div>
      <h3 style={{margin:'0 0 16px',color:'#0f172a',fontSize:16}}>⚖️ LIA — Legitimate Interest Assessment</h3>
      {trattamenti.length===0
        ? <EmptyState icon='⚖️' title='Nessun trattamento' sub='Crea prima un trattamento nel tab Registro.'/>
        : <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20}}>
            <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId}/>
            <EmptyState icon='👈' title='Seleziona un trattamento'/>
          </div>}
    </div>
  );

  const pt = f.purposeTest||{};
  const nt = f.necessityTest||{};
  const bt = f.balancingTest||{};

  return (
    <div>
      <h3 style={{margin:'0 0 16px',color:'#0f172a',fontSize:16}}>⚖️ LIA — Legitimate Interest Assessment</h3>
      <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:20,alignItems:'start'}}>
        <TrattamentoSelector trattamenti={trattamenti} selectedId={selId} onSelect={setSelId}/>
        <div>

          {/* Header */}
          <div style={{...C.card,marginBottom:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:'#0f172a'}}>{tratt.nome}</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Legitimate Interest Assessment</div>
            </div>
            <StatusBadge label={f.esito} color={ESITO_COLOR[f.esito]||'#64748b'}/>
          </div>

          {/* 1 - Purpose Test */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>1. Purpose Test — Interesse Legittimo</SectionTitle>
            <p style={{margin:'0 0 12px',fontSize:12,color:'#64748b',lineHeight:1.6}}>
              Identificare e descrivere l'interesse legittimo del titolare o di terzi. L'interesse deve essere reale, presente e non ipotetico.
            </p>
            <Fld id='interesseLegittimo' label="Qual è l'interesse legittimo perseguito? *" type='textarea'
              val={pt.interesseLegittimo} onChange={(_,v)=>uNested('purposeTest','interesseLegittimo',v)}
              ph='es. Prevenzione frodi, sicurezza della rete, marketing diretto verso clienti esistenti...'/>
            <Fld id='specificita' label="L'interesse è sufficientemente specifico?" type='textarea'
              val={pt.specificita} onChange={(_,v)=>uNested('purposeTest','specificita',v)}
              ph="Descrivere perché l'interesse è concreto e specifico, non generico..."/>
            <Fld id='note' label='Note aggiuntive' type='textarea'
              val={pt.note} onChange={(_,v)=>uNested('purposeTest','note',v)}
              ph='Riferimenti normativi, considerazioni aggiuntive...'/>
          </div>

          {/* 2 - Necessity Test */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>2. Necessity Test — Necessità del Trattamento</SectionTitle>
            <p style={{margin:'0 0 12px',fontSize:12,color:'#64748b',lineHeight:1.6}}>
              Il trattamento deve essere necessario per il perseguimento dell'interesse legittimo. Non deve essere possibile raggiungere lo stesso obiettivo con mezzi meno invasivi.
            </p>
            <Fld id='necessita' label='Il trattamento è necessario?' type='textarea'
              val={nt.necessita} onChange={(_,v)=>uNested('necessityTest','necessita',v)}
              ph="Spiegare perché il trattamento è necessario per perseguire l'interesse identificato..."/>
            <Fld id='alternative' label='Esistono alternative meno invasive?' type='textarea'
              val={nt.alternative} onChange={(_,v)=>uNested('necessityTest','alternative',v)}
              ph='Analisi delle alternative considerate e motivi per cui sono state scartate...'/>
            <Fld id='proporzionalita' label='Il trattamento è proporzionato?' type='textarea'
              val={nt.proporzionalita} onChange={(_,v)=>uNested('necessityTest','proporzionalita',v)}
              ph='I dati trattati sono limitati al minimo necessario? La durata è proporzionata?'/>
          </div>

          {/* 3 - Balancing Test */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>3. Balancing Test — Bilanciamento degli Interessi</SectionTitle>
            <p style={{margin:'0 0 12px',fontSize:12,color:'#64748b',lineHeight:1.6}}>
              Bilanciare gli interessi del titolare con i diritti e le libertà degli interessati. Considerare il contesto del trattamento e le ragionevoli aspettative degli interessati.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
              <Fld id='interessiTitolare' label='Interessi del titolare / terzi' type='textarea'
                val={bt.interessiTitolare} onChange={(_,v)=>uNested('balancingTest','interessiTitolare',v)}
                ph='Peso e rilevanza degli interessi del titolare...'/>
              <Fld id='dirittiInteressati' label='Diritti e interessi degli interessati' type='textarea'
                val={bt.dirittiInteressati} onChange={(_,v)=>uNested('balancingTest','dirittiInteressati',v)}
                ph='Impatto potenziale sugli interessati, loro ragionevoli aspettative...'/>
              <div style={{gridColumn:'1/-1'}}>
                <Fld id='salvaguardie' label='Salvaguardie e garanzie adottate' type='textarea'
                  val={bt.salvaguardie} onChange={(_,v)=>uNested('balancingTest','salvaguardie',v)}
                  ph='es. Diritto di opposizione, minimizzazione dati, trasparenza, opt-out facilitato...'/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={C.lbl}>Esito del bilanciamento</label>
                <select value={bt.esito||''} onChange={e=>uNested('balancingTest','esito',e.target.value)} style={{...C.inp,marginBottom:14}}>
                  <option value=''>Seleziona...</option>
                  {ESITI.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 4 - Conclusione */}
          <div style={{...C.card,marginBottom:16}}>
            <SectionTitle>4. Conclusione e Esito Finale</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 16px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <Fld id='conclusione' label='Conclusione finale' type='textarea' val={f.conclusione}
                  onChange={u} ph="Sintesi dell'analisi e conclusioni sulla liceità del trattamento basato su interesse legittimo..."/>
              </div>
              <div>
                <label style={C.lbl}>Esito finale *</label>
                <select value={f.esito||''} onChange={e=>u('esito',e.target.value)} style={{...C.inp,marginBottom:14}}>
                  {ESITI.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
              <Fld id='dataValutazione' label='Data valutazione' type='date' val={f.dataValutazione} onChange={u} ph=''/>
            </div>
            {f.esito&&(
              <div style={{padding:'12px 16px',borderRadius:8,background:ESITO_COLOR[f.esito]+'12',border:`1px solid ${ESITO_COLOR[f.esito]}33`,display:'flex',alignItems:'center',gap:10}}>
                <StatusBadge label={f.esito} color={ESITO_COLOR[f.esito]}/>
                <span style={{fontSize:13,color:'#374151'}}>
                  {f.esito==='Positivo'&&'Il trattamento basato su interesse legittimo è ritenuto lecito.'}
                  {f.esito==='Negativo'&&'Il trattamento non può basarsi sull\'interesse legittimo. Necessaria altra base giuridica.'}
                  {f.esito==='Da rivedere'&&'La valutazione richiede ulteriore analisi o misure aggiuntive.'}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
