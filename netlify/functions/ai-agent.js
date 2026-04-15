const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// ---- Supabase helpers ----
async function sbGet(table, filters = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  for (const [k, v] of Object.entries(filters)) url += `&${k}=eq.${encodeURIComponent(v)}`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
  });
  return r.json();
}

async function sbUpsert(table, record) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(record),
  });
  if (!r.ok) throw new Error(`Supabase upsert error: ${await r.text()}`);
  return true;
}

async function sbDelete(table, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase delete error: ${await r.text()}`);
  return true;
}

// ---- Tool definitions ----
const TOOLS = [
  {
    name: 'get_client_info',
    description: 'Legge le informazioni anagrafiche di un cliente (ragione sociale, titolare, settore, ecc.)',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string', description: 'ID del cliente' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_trattamenti',
    description: 'Legge tutti i trattamenti di dati del cliente dal registro',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_misure_sicurezza',
    description: 'Legge le misure di sicurezza tecniche e organizzative del cliente',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_analisi_rischi',
    description: 'Legge le analisi dei rischi privacy del cliente',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_assets',
    description: 'Legge gli asset IT e infrastrutturali del cliente',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_suppliers',
    description: 'Legge i fornitori e responsabili del trattamento del cliente',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_documents',
    description: 'Legge i documenti già generati per il cliente',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        tipo: { type: 'string', description: 'Filtro opzionale per tipo documento' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'get_dpia',
    description: 'Legge le DPIA (valutazioni d\'impatto) del cliente',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'get_data_breaches',
    description: 'Legge i data breach registrati del cliente',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'save_document',
    description: 'Salva un documento generato su Supabase per il cliente',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        tipo: { type: 'string', description: 'Tipo documento (es. registro, informativa, dpa...)' },
        label: { type: 'string', description: 'Titolo leggibile del documento' },
        contenuto: { type: 'string', description: 'Testo completo del documento in Markdown' },
      },
      required: ['client_id', 'tipo', 'label', 'contenuto'],
    },
  },
  {
    name: 'save_trattamento',
    description: 'Salva o aggiorna un trattamento nel registro',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        trattamento: { type: 'object', description: 'Oggetto trattamento con tutti i campi GDPR' },
      },
      required: ['client_id', 'trattamento'],
    },
  },
  {
    name: 'delete_document',
    description: 'Elimina un documento dal database',
    input_schema: {
      type: 'object',
      properties: { document_id: { type: 'string' } },
      required: ['document_id'],
    },
  },
];

// ---- Tool executor ----
async function executeTool(name, input) {
  switch (name) {
    case 'get_client_info': {
      const rows = await sbGet('clients', { id: input.client_id });
      return rows[0]?.data || null;
    }
    case 'get_trattamenti': {
      const rows = await sbGet('trattamenti', { client_id: input.client_id });
      return rows.map(r => r.data);
    }
    case 'get_misure_sicurezza': {
      const rows = await sbGet('misure_sicurezza', { client_id: input.client_id });
      return rows[0]?.data || null;
    }
    case 'get_analisi_rischi': {
      const rows = await sbGet('analisi_rischi', { client_id: input.client_id });
      return rows.map(r => ({ id: r.id, trattamento_id: r.trattamento_id, ...r.data }));
    }
    case 'get_assets': {
      const rows = await sbGet('assets', { client_id: input.client_id });
      return rows.map(r => r.data);
    }
    case 'get_suppliers': {
      const rows = await sbGet('suppliers', { client_id: input.client_id });
      return rows.map(r => r.data);
    }
    case 'get_documents': {
      const rows = await sbGet('documents', { client_id: input.client_id });
      const docs = rows.filter(r => !input.tipo || r.tipo === input.tipo);
      return docs.map(r => ({ id: r.id, tipo: r.tipo, label: r.label, createdAt: r.created_at }));
    }
    case 'get_dpia': {
      const rows = await sbGet('dpia', { client_id: input.client_id });
      return rows.map(r => ({ id: r.id, trattamento_id: r.trattamento_id, ...r.data }));
    }
    case 'get_data_breaches': {
      const rows = await sbGet('data_breaches', { client_id: input.client_id });
      return rows.map(r => ({ id: r.id, ...r.data }));
    }
    case 'save_document': {
      const id = Date.now().toString();
      await sbUpsert('documents', {
        id, client_id: input.client_id, tipo: input.tipo,
        label: input.label, contenuto: input.contenuto,
      });
      return { success: true, id };
    }
    case 'save_trattamento': {
      const t = input.trattamento;
      const id = t.id || Date.now().toString();
      await sbUpsert('trattamenti', { id, client_id: input.client_id, data: { ...t, id } });
      return { success: true, id };
    }
    case 'delete_document': {
      await sbDelete('documents', input.document_id);
      return { success: true };
    }
    default:
      throw new Error(`Tool sconosciuto: ${name}`);
  }
}

// ---- Agentic loop ----
async function runAgent(messages, systemPrompt) {
  const MAX_ITERATIONS = 10;
  let iter = 0;

  while (iter++ < MAX_ITERATIONS) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(`Claude error ${r.status}: ${JSON.stringify(data.error)}`);

    messages = [...messages, { role: 'assistant', content: data.content }];

    if (data.stop_reason === 'end_turn') {
      const text = data.content.find(b => b.type === 'text')?.text || '';
      return { text, messages };
    }

    if (data.stop_reason === 'tool_use') {
      const toolResults = [];
      for (const block of data.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try {
          result = await executeTool(block.name, block.input);
        } catch (e) {
          result = { error: e.message };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages = [...messages, { role: 'user', content: toolResults }];
      continue;
    }

    break;
  }

  throw new Error('Agente non ha completato entro il numero massimo di iterazioni');
}

// ---- Handler ----
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { messages, client_id } = body;
  if (!messages || !client_id) {
    return new Response('Missing messages or client_id', { status: 400 });
  }

  const systemPrompt = `Sei un assistente esperto di GDPR, privacy e compliance che lavora con dati reali di un cliente specifico.
Hai accesso diretto al database tramite tool: puoi leggere trattamenti, analisi rischi, misure di sicurezza, asset, fornitori, DPIA, data breach e documenti già generati.
Puoi anche salvare documenti e trattamenti direttamente nel database.

REGOLE:
- Prima di rispondere o generare qualsiasi documento, usa SEMPRE i tool per leggere i dati aggiornati dal database
- Non inventare dati — usa solo quelli reali forniti dai tool
- Quando generi un documento, salvalo automaticamente con save_document
- Rispondi sempre in italiano
- Quando usi i tool, non commentare ogni singola chiamata — vai diretto al risultato
- Il client_id del cliente attivo è: ${client_id}`;

  try {
    const { text } = await runAgent(messages, systemPrompt);
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
