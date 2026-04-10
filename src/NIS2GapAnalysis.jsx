import { useState } from 'react';
import * as XLSX from 'xlsx';

// ─── Framework Data ───────────────────────────────────────────────────────────

const FRAMEWORK = [
  {
    id:'GV', label:'GOVERN', color:'#92400e', bg:'#fffbeb', headerBg:'#fef3c7',
    desc:'La strategia di gestione del rischio di cybersecurity è stabilita, comunicata e monitorata.',
    categories:[
      { id:'GV.OC', label:'Contesto organizzativo', controls:[
        {id:'GV.OC-01', text:"La missione dell'organizzazione è compresa e informa la gestione del rischio di cybersecurity."},
        {id:'GV.OC-02', text:"Gli stakeholder interni ed esterni sono noti e le loro esigenze e aspettative riguardo la gestione del rischio di cybersecurity sono comprese e considerate."},
        {id:'GV.OC-03', text:"I requisiti legali, normativi e contrattuali riguardanti la cybersecurity, compresi gli obblighi in materia di privacy e libertà civili, sono compresi e gestiti."},
        {id:'GV.OC-04', text:"Gli obiettivi, le capacità e i servizi critici dai quali gli stakeholder dipendono o che si aspettano dall'organizzazione sono compresi e comunicati."},
        {id:'GV.OC-05', text:"I risultati, le capacità e i servizi dai quali l'organizzazione dipende sono compresi e comunicati."},
      ]},
      { id:'GV.RM', label:'Strategia di gestione del rischio', controls:[
        {id:'GV.RM-01', text:"Gli obiettivi di gestione del rischio sono stabiliti e accettati dagli stakeholder dell'organizzazione."},
        {id:'GV.RM-02', text:"Le dichiarazioni sulla tolleranza e la propensione al rischio sono stabilite, comunicate e mantenute."},
        {id:'GV.RM-03', text:"Le attività e gli esiti della gestione del rischio di cybersecurity sono parte integrante dei processi di gestione del rischio dell'organizzazione."},
        {id:'GV.RM-04', text:"È stabilita e comunicata la direzione strategica che descrive le opzioni appropriate di risposta al rischio."},
        {id:'GV.RM-05', text:"Sono stabiliti canali di comunicazione in tutta l'organizzazione per il rischio di cybersecurity, incluso il rischio derivante dai fornitori e da altre terze parti."},
        {id:'GV.RM-06', text:"È stabilito e comunicato un metodo standardizzato per calcolare, documentare, categorizzare e prioritizzare i rischi di cybersecurity."},
        {id:'GV.RM-07', text:"Le opportunità strategiche (i.e. i rischi positivi) sono caratterizzate e incluse nelle discussioni sul rischio di cybersecurity dell'organizzazione."},
      ]},
      { id:'GV.RR', label:'Ruoli, responsabilità e correlati poteri', controls:[
        {id:'GV.RR-01', text:"Gli organi di amministrazione e direttivi sono responsabili e rispondono (accountable) per il rischio di cybersecurity e promuovono una cultura consapevole del rischio, etica e in continuo miglioramento."},
        {id:'GV.RR-02', text:"I ruoli, le responsabilità e i correlati poteri relativi alla gestione del rischio di cybersecurity sono stabiliti, comunicati, compresi e applicati."},
        {id:'GV.RR-03', text:"Sono allocate risorse adeguate, in misura commisurata alla strategia di gestione del rischio di cybersecurity, ai ruoli, alle responsabilità e alle politiche."},
        {id:'GV.RR-04', text:"La cybersecurity è inclusa nelle pratiche delle risorse umane."},
        {id:'DP-GV.RR-05', text:"I ruoli, le responsabilità e i correlati poteri inerenti al trattamento e la protezione dei dati personali sono stabiliti, comunicati, compresi e applicati."},
      ]},
      { id:'GV.PO', label:'Politica', controls:[
        {id:'GV.PO-01', text:"La politica per la gestione del rischio di cybersecurity è stabilita in base al contesto organizzativo, alla strategia di cybersecurity e alle priorità, ed è comunicata e applicata."},
        {id:'GV.PO-02', text:"La politica per la gestione del rischio di cybersecurity è revisionata, aggiornata, comunicata e applicata per riflettere i cambiamenti nei requisiti, nelle minacce, nella tecnologia e nella missione dell'organizzazione."},
      ]},
      { id:'GV.OV', label:'Supervisione', controls:[
        {id:'GV.OV-01', text:"I risultati della strategia di gestione del rischio di cybersecurity sono revisionati per informare e adeguare la strategia e la direzione."},
        {id:'GV.OV-02', text:"La strategia di gestione del rischio di cybersecurity è revisionata e adeguata per garantire la copertura dei requisiti e dei rischi dell'organizzazione."},
        {id:'GV.OV-03', text:"Le prestazioni relative alla gestione del rischio di cybersecurity dell'organizzazione sono valutate e revisionate per gli adeguamenti necessari."},
      ]},
      { id:'GV.SC', label:'Gestione del rischio della catena di approvvigionamento', controls:[
        {id:'GV.SC-01', text:"Sono stabiliti e accettati dagli stakeholder il programma, la strategia, gli obiettivi, le politiche e i processi di gestione del rischio di cybersecurity della catena di approvvigionamento."},
        {id:'GV.SC-02', text:"I ruoli e le responsabilità in materia di cybersecurity per fornitori, clienti e partner sono stabiliti, comunicati e coordinati internamente ed esternamente."},
        {id:'GV.SC-03', text:"La gestione del rischio di cybersecurity della catena di approvvigionamento è integrata nella gestione del rischio dell'organizzazione e di cybersecurity, nella valutazione del rischio e nei processi di miglioramento."},
        {id:'GV.SC-04', text:"I fornitori sono noti e prioritizzati in base alla criticità."},
        {id:'GV.SC-05', text:"I requisiti per affrontare i rischi di cybersecurity nella catena di approvvigionamento sono stabiliti, prioritizzati e integrati nei contratti e in altri tipi di accordi con i fornitori e altre terze parti rilevanti."},
        {id:'GV.SC-06', text:"Pianificazione e due diligence sono svolte per ridurre i rischi prima di intraprendere rapporti formali con i fornitori o altre terze parti."},
        {id:'GV.SC-07', text:"I rischi posti da un fornitore, dai suoi prodotti e servizi e da altre terze parti sono compresi, registrati, prioritizzati, valutati, trattati e monitorati nel corso della relazione."},
        {id:'GV.SC-08', text:"I fornitori e le altre terze parti rilevanti sono inclusi nelle attività di pianificazione, risposta e ripristino relative agli incidenti."},
        {id:'GV.SC-09', text:"Le pratiche di sicurezza della catena di approvvigionamento sono integrate nei programmi di gestione del rischio di cybersecurity e le loro prestazioni sono monitorate durante l'intero ciclo di vita dei prodotti e dei servizi tecnologici."},
        {id:'GV.SC-10', text:"I piani di gestione del rischio di cybersecurity della catena di approvvigionamento includono le disposizioni per le attività da svolgere dopo la conclusione di un accordo di partnership o di servizio."},
      ]},
    ]
  },
  {
    id:'ID', label:'IDENTIFY', color:'#1e40af', bg:'#eff6ff', headerBg:'#dbeafe',
    desc:"I rischi attuali di cybersecurity dell'organizzazione sono compresi.",
    categories:[
      { id:'ID.AM', label:'Gestione degli asset', controls:[
        {id:'ID.AM-01', text:"Sono mantenuti gli inventari dell'hardware gestito dall'organizzazione."},
        {id:'ID.AM-02', text:"Sono mantenuti gli inventari del software, dei servizi e dei sistemi gestiti dall'organizzazione."},
        {id:'ID.AM-03', text:"Sono mantenute le rappresentazioni delle comunicazioni di rete e dei flussi di dati di rete interni ed esterni, autorizzati dall'organizzazione."},
        {id:'ID.AM-04', text:"Sono mantenuti gli inventari dei servizi erogati dai fornitori."},
        {id:'ID.AM-05', text:"Gli asset sono prioritizzati in base alla categorizzazione, alla criticità, alle risorse e all'impatto sulla missione."},
        {id:'ID.AM-07', text:"Sono mantenuti gli inventari dei dati e dei relativi metadati per selezionati tipi di dati."},
        {id:'ID.AM-08', text:"I sistemi, l'hardware, il software, i servizi e i dati sono gestiti durante il loro intero ciclo di vita."},
        {id:'DP-ID.AM-09', text:"I trattamenti di dati personali sono identificati e catalogati."},
      ]},
      { id:'ID.RA', label:'Valutazione del rischio', controls:[
        {id:'ID.RA-01', text:"Le vulnerabilità negli asset sono identificate, confermate e registrate."},
        {id:'ID.RA-02', text:"Le informazioni di cyber threat intelligence sono ricevute da forum e fonti di condivisione delle informazioni."},
        {id:'ID.RA-03', text:"Le minacce interne ed esterne all'organizzazione sono identificate e registrate."},
        {id:'ID.RA-04', text:"I potenziali impatti e le probabilità di sfruttamento delle vulnerabilità da parte delle minacce sono identificati e registrati."},
        {id:'ID.RA-05', text:"Minacce, vulnerabilità, probabilità e impatti sono utilizzati per comprendere il rischio inerente e per informare la prioritizzazione della risposta al rischio."},
        {id:'ID.RA-06', text:"Le risposte al rischio sono scelte, prioritizzate, pianificate, monitorate e comunicate."},
        {id:'ID.RA-07', text:"Le modifiche e le eccezioni sono gestite, valutate per il loro impatto sul rischio, registrate e tracciate."},
        {id:'ID.RA-08', text:"Sono stabiliti processi per la ricezione, l'analisi e la risposta alle divulgazioni di vulnerabilità."},
        {id:'ID.RA-09', text:"L'autenticità e l'integrità di hardware e software sono valutate prima dell'acquisizione e dell'uso."},
        {id:'ID.RA-10', text:"I fornitori critici sono valutati prima dell'acquisizione."},
        {id:'DP-ID.RA-11', text:"Viene effettuata una valutazione di impatto sulla protezione dei dati personali."},
      ]},
      { id:'ID.IM', label:'Miglioramento', controls:[
        {id:'ID.IM-01', text:"Sono identificati miglioramenti in esito alle valutazioni."},
        {id:'ID.IM-02', text:"Sono identificati miglioramenti in esito ai test e alle esercitazioni di sicurezza, compresi quelli effettuati in coordinamento con i fornitori e le terze parti interessate."},
        {id:'ID.IM-03', text:"Sono identificati miglioramenti dall'esecuzione di processi, procedure e attività operativi."},
        {id:'ID.IM-04', text:"I piani di risposta agli incidenti e gli altri piani di cybersecurity che impattano le operazioni sono stabiliti, comunicati, mantenuti e migliorati."},
      ]},
      { id:'DP-ID.DM', label:'Data Management', controls:[
        {id:'DP-ID.DM-01', text:"Il ciclo di vita dei dati è definito e documentato."},
        {id:'DP-ID.DM-02', text:"Sono definiti, implementati e documentati i processi riguardanti l'informazione dell'interessato in merito al trattamento dei dati."},
        {id:'DP-ID.DM-03', text:"Sono definiti, implementati e documentati i processi di raccolta e revoca del consenso dell'interessato al trattamento di dati."},
        {id:'DP-ID.DM-04', text:"Sono definiti, implementati e documentati i processi per l'esercizio dei diritti (accesso, rettifica, cancellazione, ecc.) dell'interessato."},
        {id:'DP-ID.DM-05', text:"Sono definiti, implementati e documentati i processi di trasferimento dei dati in ambito internazionale."},
      ]},
    ]
  },
  {
    id:'PR', label:'PROTECT', color:'#6d28d9', bg:'#f5f3ff', headerBg:'#ede9fe',
    desc:"Sono adottate misure di protezione per gestire i rischi di cybersecurity dell'organizzazione.",
    categories:[
      { id:'PR.AA', label:'Gestione delle identità, autenticazione e controllo degli accessi', controls:[
        {id:'PR.AA-01', text:"Le identità e le credenziali degli utenti, dei servizi e dell'hardware autorizzati sono gestite dall'organizzazione."},
        {id:'PR.AA-02', text:"Le identità sono verificate e associate alle credenziali in base al contesto delle interazioni."},
        {id:'PR.AA-03', text:"Utenti, servizi e hardware sono autenticati."},
        {id:'PR.AA-04', text:"Le asserzioni di identità sono protette, trasmesse e verificate."},
        {id:'PR.AA-05', text:"I permessi, i diritti e le autorizzazioni di accesso sono definiti in una politica, gestiti, applicati e rivisti e incorporano i principi del minimo privilegio e della separazione dei compiti."},
        {id:'PR.AA-06', text:"L'accesso fisico agli asset è gestito, monitorato e applicato in misura appropriata al rischio."},
      ]},
      { id:'PR.AT', label:'Consapevolezza e formazione', controls:[
        {id:'PR.AT-01', text:"Il personale è sensibilizzato e formato in modo da possedere le conoscenze e le competenze per svolgere compiti di carattere generale tenendo conto dei rischi di cybersecurity."},
        {id:'PR.AT-02', text:"Gli individui che ricoprono ruoli specializzati sono sensibilizzati e formati in modo da possedere le conoscenze e le competenze per svolgere i pertinenti compiti tenendo conto dei rischi di cybersecurity."},
      ]},
      { id:'PR.DS', label:'Sicurezza dei dati', controls:[
        {id:'PR.DS-01', text:"La riservatezza, l'integrità e la disponibilità dei dati a riposo (data-at-rest) sono protette."},
        {id:'PR.DS-02', text:"La riservatezza, l'integrità e la disponibilità dei dati in transito (data-in-transit) sono protette."},
        {id:'PR.DS-10', text:"La riservatezza, l'integrità e la disponibilità dei dati in uso (data-in-use) sono protette."},
        {id:'PR.DS-11', text:"I backup dei dati sono creati, protetti, mantenuti e verificati."},
      ]},
      { id:'PR.PS', label:'Sicurezza delle piattaforme', controls:[
        {id:'PR.PS-01', text:"Sono stabilite e applicate pratiche di gestione della configurazione."},
        {id:'PR.PS-02', text:"Il software è mantenuto, sostituito e rimosso in base al rischio."},
        {id:'PR.PS-03', text:"L'hardware è mantenuto, sostituito e rimosso in base al rischio."},
        {id:'PR.PS-04', text:"I registri di log sono generati e resi disponibili per il monitoraggio continuo."},
        {id:'PR.PS-05', text:"Sono impedite l'installazione ed esecuzione di software non autorizzato."},
        {id:'PR.PS-06', text:"Le pratiche di sviluppo sicuro del software sono integrate e le loro prestazioni sono monitorate durante l'intero ciclo di vita del software."},
      ]},
      { id:'PR.IR', label:"Resilienza dell'infrastruttura tecnologica", controls:[
        {id:'PR.IR-01', text:"Le reti e gli ambienti sono protetti dall'accesso logico e dall'uso non autorizzati."},
        {id:'PR.IR-02', text:"Gli asset tecnologici dell'organizzazione sono protetti dalle minacce ambientali."},
        {id:'PR.IR-03', text:"Sono implementati meccanismi per soddisfare i requisiti di resilienza in situazioni normali e avverse."},
        {id:'PR.IR-04', text:"È mantenuta un'adeguata capacità di risorse per garantire la disponibilità."},
      ]},
    ]
  },
  {
    id:'DE', label:'DETECT', color:'#c2410c', bg:'#fff7ed', headerBg:'#fed7aa',
    desc:"Possibili attacchi e compromissioni di cybersecurity sono rilevati e analizzati.",
    categories:[
      { id:'DE.CM', label:'Monitoraggio continuo', controls:[
        {id:'DE.CM-01', text:"Le reti e i servizi di rete sono monitorati per individuare eventi potenzialmente avversi."},
        {id:'DE.CM-02', text:"L'ambiente fisico è monitorato per individuare eventi potenzialmente avversi."},
        {id:'DE.CM-03', text:"L'attività del personale e l'utilizzo della tecnologia sono monitorati per individuare eventi potenzialmente avversi."},
        {id:'DE.CM-06', text:"Le attività e i servizi dei fornitori di servizi esterni sono monitorati per individuare eventi potenzialmente avversi."},
        {id:'DE.CM-09', text:"L'hardware e il software di elaborazione, gli ambienti di runtime e i loro dati sono monitorati per individuare eventi potenzialmente avversi."},
      ]},
      { id:'DE.AE', label:'Analisi degli eventi avversi', controls:[
        {id:'DE.AE-02', text:"Gli eventi potenzialmente avversi sono analizzati per meglio comprenderne le attività associate."},
        {id:'DE.AE-03', text:"Le informazioni sono correlate da più fonti."},
        {id:'DE.AE-04', text:"L'impatto e la portata stimati degli eventi avversi sono compresi."},
        {id:'DE.AE-06', text:"Le informazioni sugli eventi avversi sono fornite al personale e agli strumenti autorizzati."},
        {id:'DE.AE-07', text:"La cyber threat intelligence e le altre informazioni contestuali sono integrate nell'analisi."},
        {id:'DE.AE-08', text:"Gli incidenti sono dichiarati quando gli eventi avversi soddisfano i criteri definiti per gli incidenti."},
      ]},
    ]
  },
  {
    id:'RS', label:'RESPOND', color:'#b91c1c', bg:'#fef2f2', headerBg:'#fecaca',
    desc:"Sono intraprese azioni in risposta a un incidente di cybersecurity rilevato.",
    categories:[
      { id:'RS.MA', label:'Gestione degli incidenti', controls:[
        {id:'RS.MA-01', text:"Il piano di risposta agli incidenti è eseguito in coordinamento con le terze parti interessate una volta dichiarato un incidente."},
        {id:'RS.MA-02', text:"I report sugli incidenti sono sottoposti a triage e convalidati."},
        {id:'RS.MA-03', text:"Gli incidenti sono categorizzati e prioritizzati."},
        {id:'RS.MA-04', text:"Gli incidenti sono scalati (assegnati a meccanismi di risposta con risorse crescenti) o elevati (passati in gestione a un livello superiore) a seconda delle necessità."},
        {id:'RS.MA-05', text:"Sono applicati i criteri per l'avvio del ripristino dagli incidenti."},
      ]},
      { id:'RS.AN', label:'Analisi degli incidenti', controls:[
        {id:'RS.AN-03', text:"È eseguita un'analisi per stabilire cosa è avvenuto durante un incidente e la causa principale dell'incidente."},
        {id:'RS.AN-06', text:"Le azioni eseguite durante un'investigazione sono registrate e l'integrità e la provenienza delle registrazioni sono preservate."},
        {id:'RS.AN-07', text:"I dati e i metadati degli incidenti sono raccolti e la loro integrità e provenienza sono preservate."},
        {id:'RS.AN-08', text:"La magnitudo di un incidente è stimata e convalidata."},
      ]},
      { id:'RS.CO', label:'Segnalazione e comunicazione della risposta', controls:[
        {id:'RS.CO-02', text:"Gli stakeholder interni ed esterni sono informati degli incidenti."},
        {id:'RS.CO-03', text:"Le informazioni sono condivise con gli stakeholder interni ed esterni designati."},
        {id:'DP-RS.CO-06', text:"Gli incidenti che si configurano come violazioni di dati personali sono documentati ed eventualmente vengono informate le autorità di riferimento e gli interessati."},
      ]},
      { id:'RS.MI', label:'Mitigazione degli incidenti', controls:[
        {id:'RS.MI-01', text:"Gli incidenti vengono contenuti."},
        {id:'RS.MI-02', text:"Gli incidenti vengono eradicati."},
      ]},
    ]
  },
  {
    id:'RC', label:'RECOVER', color:'#15803d', bg:'#f0fdf4', headerBg:'#bbf7d0',
    desc:"Gli asset e le operazioni interessati da un incidente di cybersecurity sono ripristinati.",
    categories:[
      { id:'RC.RP', label:'Esecuzione del piano di ripristino dagli incidenti', controls:[
        {id:'RC.RP-01', text:"La parte del piano di risposta agli incidenti relativa al ripristino viene eseguita una volta avviata dal processo di risposta agli incidenti."},
        {id:'RC.RP-02', text:"Le azioni di ripristino sono selezionate, contestualizzate, prioritizzate e eseguite."},
        {id:'RC.RP-03', text:"L'integrità dei backup e delle altre risorse di ripristino è verificata prima che siano utilizzati per il ripristino."},
        {id:'RC.RP-04', text:"Le funzioni critiche per la mission dell'organizzazione e la gestione del rischio di cybersecurity sono considerate per stabilire le norme operative post-incidente."},
        {id:'RC.RP-05', text:"L'integrità degli asset ripristinati è verificata, i sistemi e i servizi sono ripristinati e lo stato operativo normale viene confermato."},
        {id:'RC.RP-06', text:"La conclusione del ripristino dell'incidente viene dichiarata sulla base di criteri definiti e la documentazione relativa all'incidente è completata."},
      ]},
      { id:'RC.CO', label:'Comunicazione sul ripristino dagli incidenti', controls:[
        {id:'RC.CO-03', text:"Le attività di ripristino e i progressi nel ripristino delle capacità operative sono comunicati agli stakeholder interni ed esterni designati."},
        {id:'RC.CO-04', text:"Gli aggiornamenti pubblici sul ripristino dagli incidenti sono condivisi utilizzando modalità e messaggi approvati."},
      ]},
    ]
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATI = ['Conforme', 'Parzialmente conforme', 'Non conforme', 'Non applicabile'];
const PRIORITA = ['Alta', 'Media', 'Bassa'];

const STATO_COLOR = {
  'Conforme':'#16a34a', 'Parzialmente conforme':'#d97706',
  'Non conforme':'#dc2626', 'Non applicabile':'#94a3b8', '':'#cbd5e1'
};
const STATO_BG = {
  'Conforme':'#f0fdf4', 'Parzialmente conforme':'#fffbeb',
  'Non conforme':'#fef2f2', 'Non applicabile':'#f8fafc', '':'#f8fafc'
};
const PRIO_COLOR = {'Alta':'#dc2626','Media':'#d97706','Bassa':'#16a34a'};

function stats(gapData, controls) {
  const appl = controls.filter(c => (gapData[c.id]?.stato||'') !== 'Non applicabile');
  const conf = appl.filter(c => gapData[c.id]?.stato === 'Conforme').length;
  const parz = appl.filter(c => gapData[c.id]?.stato === 'Parzialmente conforme').length;
  const nonc = appl.filter(c => gapData[c.id]?.stato === 'Non conforme').length;
  const nval = appl.filter(c => !gapData[c.id]?.stato).length;
  const score = appl.length > 0 ? Math.round((conf*100 + parz*50) / appl.length) : 0;
  return { total: controls.length, appl: appl.length, conf, parz, nonc, nval, score };
}

function ScoreBadge({ score, size=36 }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:color+'18',border:`2px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontSize:size*0.3,fontWeight:800,color}}>{score}%</span>
    </div>
  );
}

// ─── Control Row ──────────────────────────────────────────────────────────────

function ControlRow({ ctrl, data, onChange, funcColor }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(data?.note || '');
  const [resp, setResp] = useState(data?.responsabile || '');
  const [scad, setScad] = useState(data?.scadenza || '');
  const isDP = ctrl.id.startsWith('DP-');
  const stato = data?.stato || '';
  const priorita = data?.priorita || '';

  const inp = {
    width:'100%', padding:'6px 9px', border:'1px solid #e2e8f0', borderRadius:6,
    fontSize:12, fontFamily:'inherit', outline:'none', background:'#fff',
    boxSizing:'border-box',
  };

  return (
    <div style={{borderBottom:'1px solid #f1f5f9', background: open ? '#fafbfc' : '#fff'}}>
      {/* Main row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer',
          transition:'background .12s'}}
        onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
        onMouseLeave={e=>e.currentTarget.style.background= open?'#fafbfc':'#fff'}
      >
        {/* ID badge */}
        <span style={{fontFamily:'"Courier New",monospace', fontSize:11, fontWeight:700,
          padding:'2px 7px', borderRadius:4, background: funcColor+'14', color: funcColor,
          flexShrink:0, whiteSpace:'nowrap'}}>
          {ctrl.id}
        </span>
        {isDP && (
          <span style={{fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3,
            background:'#e0f2fe', color:'#0369a1', flexShrink:0}}>DP</span>
        )}
        {/* Description */}
        <span style={{flex:1, fontSize:12.5, color:'#334155', lineHeight:1.5}}>{ctrl.text}</span>
        {/* Priority badge */}
        {priorita && (
          <span style={{fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:12,
            background: PRIO_COLOR[priorita]+'18', color: PRIO_COLOR[priorita], flexShrink:0}}>
            {priorita}
          </span>
        )}
        {/* Status select */}
        <select
          value={stato}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onChange(ctrl.id, 'stato', e.target.value); }}
          style={{fontSize:11, fontWeight:600, padding:'3px 6px', border:`1.5px solid ${STATO_COLOR[stato]}`,
            borderRadius:6, background: STATO_BG[stato], color: STATO_COLOR[stato],
            cursor:'pointer', fontFamily:'inherit', outline:'none', flexShrink:0, minWidth:160}}
        >
          <option value=''>— Non valutato —</option>
          {STATI.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Expand toggle */}
        <span style={{fontSize:12, color:'#94a3b8', flexShrink:0}}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded details */}
      {open && (
        <div style={{padding:'10px 14px 14px 14px', background:'#f8fafc',
          borderTop:'1px solid #e2e8f0', display:'grid',
          gridTemplateColumns:'1fr 1fr 1fr', gap:'0 12px'}}>
          <div style={{gridColumn:'1/-1', marginBottom:8}}>
            <label style={{display:'block', fontSize:10, fontWeight:700, color:'#64748b',
              textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3}}>Note / Evidenze</label>
            <textarea value={note} rows={2}
              onChange={e=>setNote(e.target.value)}
              onBlur={()=>onChange(ctrl.id,'note',note)}
              placeholder="Descrivi lo stato attuale, le evidenze disponibili o le azioni pianificate..."
              style={{...inp, resize:'vertical', minHeight:52}}/>
          </div>
          <div>
            <label style={{display:'block', fontSize:10, fontWeight:700, color:'#64748b',
              textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3}}>Priorità remediation</label>
            <select value={priorita}
              onChange={e=>onChange(ctrl.id,'priorita',e.target.value)}
              style={{...inp}}>
              <option value=''>Nessuna</option>
              {PRIORITA.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block', fontSize:10, fontWeight:700, color:'#64748b',
              textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3}}>Responsabile</label>
            <input value={resp} placeholder="es. CISO, IT Manager..."
              onChange={e=>setResp(e.target.value)}
              onBlur={()=>onChange(ctrl.id,'responsabile',resp)}
              style={inp}/>
          </div>
          <div>
            <label style={{display:'block', fontSize:10, fontWeight:700, color:'#64748b',
              textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3}}>Scadenza</label>
            <input type='date' value={scad}
              onChange={e=>{setScad(e.target.value); onChange(ctrl.id,'scadenza',e.target.value);}}
              style={inp}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NIS2GapAnalysis({ gapData, onSave, client }) {
  const [localGap, setLocalGap] = useState(gapData || {});
  const [activeFunc, setActiveFunc] = useState('GV');
  const [openCats, setOpenCats] = useState({});
  const [filterStato, setFilterStato] = useState('');

  const update = (controlId, field, value) => {
    const updated = { ...localGap, [controlId]: { ...(localGap[controlId]||{}), [field]:value } };
    setLocalGap(updated);
    onSave(updated);
  };

  // Global stats
  const allControls = FRAMEWORK.flatMap(f => f.categories.flatMap(c => c.controls));
  const global = stats(localGap, allControls);

  const activeFunction = FRAMEWORK.find(f => f.id === activeFunc);

  const exportExcel = () => {
    const rows = [];
    FRAMEWORK.forEach(fn => {
      fn.categories.forEach(cat => {
        cat.controls.forEach(ctrl => {
          const d = localGap[ctrl.id] || {};
          rows.push({
            'Funzione': fn.label,
            'Categoria': cat.label,
            'ID Controllo': ctrl.id,
            'Descrizione': ctrl.text,
            'Stato': d.stato || 'Non valutato',
            'Priorità': d.priorita || '',
            'Responsabile': d.responsabile || '',
            'Scadenza': d.scadenza || '',
            'Note': d.note || '',
          });
        });
      });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Gap Analysis NIS2');
    XLSX.writeFile(wb, `Gap_Analysis_NIS2_${(client?.ragioneSociale||'export').replace(/[^a-z0-9]/gi,'_')}.xlsx`);
  };

  const toggleCat = id => setOpenCats(p => ({...p,[id]:!p[id]}));

  const C = { btn: (bg='#2563eb',col='#fff',sm=false)=>({background:bg,color:col,border:'none',borderRadius:7,padding:sm?'5px 12px':'8px 16px',cursor:'pointer',fontWeight:600,fontSize:sm?11:13,fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}) };

  return (
    <div style={{fontFamily:'"Inter",system-ui,sans-serif'}}>
      {/* ── Global header ── */}
      <div style={{background:'linear-gradient(135deg,#0c4a6e,#0891b2)',borderRadius:14,padding:'20px 24px',marginBottom:20,color:'#fff'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
          <div style={{flex:1}}>
            <h3 style={{margin:0,fontSize:17,fontWeight:800}}>Gap Analysis — Framework Nazionale per la Cybersecurity e la Data Protection</h3>
            <div style={{fontSize:12,opacity:.8,marginTop:2}}>Edizione 2025 v2.1.0 · {allControls.length} controlli · {client?.ragioneSociale}</div>
          </div>
          <ScoreBadge score={global.score} size={56}/>
          <button style={{...C.btn('#fff','#0c4a6e',true)}} onClick={exportExcel}>📊 Esporta Excel</button>
        </div>
        {/* Global progress bar */}
        <div style={{display:'flex',gap:3,height:8,borderRadius:4,overflow:'hidden',background:'rgba(255,255,255,.2)'}}>
          {global.conf > 0 && <div style={{flex:global.conf,background:'#22c55e'}}/>}
          {global.parz > 0 && <div style={{flex:global.parz,background:'#f59e0b'}}/>}
          {global.nonc > 0 && <div style={{flex:global.nonc,background:'#ef4444'}}/>}
          {global.nval > 0 && <div style={{flex:global.nval,background:'rgba(255,255,255,.3)'}}/>}
        </div>
        <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap'}}>
          {[
            ['Conformi', global.conf, '#22c55e'],
            ['Parz. conformi', global.parz, '#f59e0b'],
            ['Non conformi', global.nonc, '#ef4444'],
            ['Non valutati', global.nval, 'rgba(255,255,255,.5)'],
            ['Non applicabili', global.total - global.appl, 'rgba(255,255,255,.3)'],
          ].map(([l,n,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0}}/>
              <span style={{opacity:.9}}>{l}: <strong>{n}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.4px'}}>Filtra:</span>
        {['', ...STATI].map(s => (
          <button key={s} onClick={()=>setFilterStato(s)}
            style={{fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20,border:'1.5px solid',
              borderColor: filterStato===s ? STATO_COLOR[s]||'#2563eb' : '#e2e8f0',
              background: filterStato===s ? (STATO_BG[s]||'#eff6ff') : '#fff',
              color: filterStato===s ? (STATO_COLOR[s]||'#2563eb') : '#64748b',
              cursor:'pointer', fontFamily:'inherit'}}>
            {s || 'Tutti'}
          </button>
        ))}
      </div>

      {/* ── Function tabs ── */}
      <div style={{display:'flex',gap:0,borderBottom:'2px solid #e2e8f0',marginBottom:18,overflowX:'auto'}}>
        {FRAMEWORK.map(fn => {
          const fnControls = fn.categories.flatMap(c=>c.controls);
          const fnStats = stats(localGap, fnControls);
          const active = activeFunc === fn.id;
          return (
            <button key={fn.id} onClick={()=>setActiveFunc(fn.id)}
              style={{background:'none',border:'none',borderBottom:`3px solid ${active?fn.color:'transparent'}`,
                color: active ? fn.color : '#64748b', fontWeight: active ? 800 : 500,
                fontSize:12, cursor:'pointer', padding:'8px 14px', fontFamily:'inherit',
                display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                marginBottom:-2, whiteSpace:'nowrap', minWidth:80}}>
              <span>{fn.label}</span>
              <span style={{fontSize:10,opacity:.8}}>{fnStats.score}% · {fnControls.length}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active function ── */}
      {activeFunction && (
        <div>
          {/* Function summary */}
          <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',
            background:activeFunction.bg, borderRadius:10, marginBottom:16,
            border:`1px solid ${activeFunction.color}22`}}>
            <div style={{width:44,height:44,borderRadius:10,background:activeFunction.color+'18',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:16,fontWeight:800,color:activeFunction.color,flexShrink:0}}>
              {activeFunction.id}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:'#0f172a'}}>{activeFunction.label}</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{activeFunction.desc}</div>
            </div>
            {(() => {
              const fnControls = activeFunction.categories.flatMap(c=>c.controls);
              const s = stats(localGap, fnControls);
              return (
                <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                  <ScoreBadge score={s.score} size={44}/>
                  <div style={{fontSize:11,color:'#64748b',lineHeight:1.8}}>
                    <div>✅ Conformi: <strong>{s.conf}</strong></div>
                    <div>⚠️ Parziali: <strong>{s.parz}</strong></div>
                    <div>❌ Non conf.: <strong>{s.nonc}</strong></div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Categories */}
          {activeFunction.categories.map(cat => {
            const visibleControls = filterStato
              ? cat.controls.filter(c => (localGap[c.id]?.stato||'') === filterStato ||
                  (filterStato==='' ))
              : cat.controls;
            if(filterStato && visibleControls.length===0) return null;
            const catOpen = openCats[cat.id] !== false; // default open
            const catStats = stats(localGap, cat.controls);

            return (
              <div key={cat.id} style={{marginBottom:10,borderRadius:10,overflow:'hidden',
                border:'1px solid #e5eaf0',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                {/* Category header */}
                <div onClick={()=>toggleCat(cat.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
                    background:activeFunction.headerBg, cursor:'pointer',
                    borderBottom: catOpen ? '1px solid #e5eaf0' : 'none'}}>
                  <span style={{fontSize:11,fontFamily:'"Courier New",monospace',fontWeight:700,
                    color:activeFunction.color}}>{cat.id}</span>
                  <span style={{flex:1,fontWeight:600,fontSize:13,color:'#0f172a'}}>{cat.label}</span>
                  {/* Mini progress */}
                  <div style={{display:'flex',gap:4,alignItems:'center',fontSize:10,color:'#64748b'}}>
                    <span style={{color:'#16a34a',fontWeight:700}}>{catStats.conf}✅</span>
                    <span style={{color:'#d97706',fontWeight:700}}>{catStats.parz}⚡</span>
                    <span style={{color:'#dc2626',fontWeight:700}}>{catStats.nonc}❌</span>
                    <span style={{color:'#94a3b8'}}>{catStats.nval}?</span>
                  </div>
                  <div style={{width:60,height:5,borderRadius:3,background:'#e2e8f0',overflow:'hidden',flexShrink:0}}>
                    {catStats.appl > 0 && (
                      <div style={{width:`${catStats.score}%`,height:'100%',
                        background: catStats.score>=70?'#16a34a':catStats.score>=40?'#d97706':'#dc2626',
                        borderRadius:3, transition:'width .3s'}}/>
                    )}
                  </div>
                  <span style={{fontSize:12,color:'#94a3b8',flexShrink:0}}>{catOpen?'▲':'▼'}</span>
                </div>

                {/* Controls list */}
                {catOpen && (
                  <div>
                    {visibleControls.map(ctrl => (
                      <ControlRow
                        key={ctrl.id}
                        ctrl={ctrl}
                        data={localGap[ctrl.id]}
                        onChange={update}
                        funcColor={activeFunction.color}
                      />
                    ))}
                    {filterStato && cat.controls.length !== visibleControls.length && (
                      <div style={{padding:'8px 14px',fontSize:11,color:'#94a3b8',background:'#fafafa',
                        textAlign:'center'}}>
                        {cat.controls.length - visibleControls.length} controlli nascosti dal filtro
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
