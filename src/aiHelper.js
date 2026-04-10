const SYSTEM = [
  'Sei un esperto consulente di privacy, GDPR, NIS2 e sicurezza informatica.',
  'Genera contenuto professionale in italiano per campi di moduli di compliance.',
  'Rispondi ESCLUSIVAMENTE con il testo del campo richiesto.',
  'Niente prefissi, intestazioni, virgolette o spiegazioni. Solo il contenuto.',
  'Sii conciso (2-4 frasi) e direttamente utilizzabile senza modifiche.',
].join(' ');

function getAIConfig() {
  const provider = localStorage.getItem('gdpr:aiProvider') || 'groq';
  const groqKey = localStorage.getItem('gdpr:groqKey') || import.meta.env.VITE_GROQ_API_KEY || '';
  const claudeKey = localStorage.getItem('gdpr:claudeKey') || '';
  return { provider, groqKey, claudeKey };
}

export const isAIEnabled = !!(
  import.meta.env.VITE_GROQ_API_KEY ||
  localStorage.getItem('gdpr:groqKey') ||
  localStorage.getItem('gdpr:claudeKey')
);

export async function generateFieldContent(fieldLabel, placeholder, context, onChunk) {
  const { provider, groqKey, claudeKey } = getAIConfig();
  const parts = [
    context && `Contesto: ${context}`,
    placeholder && `Descrizione del campo: ${placeholder}`,
  ].filter(Boolean).join('\n');
  const userContent = `Campo: "${fieldLabel}"\n${parts}\n\nGenera il testo per questo campo.`;

  if (provider === 'claude' && claudeKey) {
    await generateFieldClaude(claudeKey, userContent, onChunk);
  } else {
    await generateFieldGroq(groqKey, userContent, onChunk);
  }
}

async function generateFieldGroq(apiKey, userContent, onChunk) {
  const res = await fetch('/api/groq/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`Groq error ${res.status}: ${err}`); }
  await readSSEGroq(res.body, onChunk);
}

async function generateFieldClaude(apiKey, userContent, onChunk) {
  const res = await fetch('/api/claude/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      stream: true,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`Claude error ${res.status}: ${err}`); }
  await readSSEClaude(res.body, onChunk);
}

async function readSSEGroq(body, onChunk) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t || t === 'data: [DONE]') continue;
      if (t.startsWith('data: ')) {
        try { const text = JSON.parse(t.slice(6)).choices?.[0]?.delta?.content || ''; if (text) onChunk(text); } catch {}
      }
    }
  }
}

async function readSSEClaude(body, onChunk) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(t.slice(6));
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            onChunk(parsed.delta.text);
          }
        } catch {}
      }
    }
  }
}
