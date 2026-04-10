export const isAIEnabled = !!import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM = [
  'Sei un esperto consulente di privacy, GDPR, NIS2 e sicurezza informatica.',
  'Genera contenuto professionale in italiano per campi di moduli di compliance.',
  'Rispondi ESCLUSIVAMENTE con il testo del campo richiesto.',
  'Niente prefissi, intestazioni, virgolette o spiegazioni. Solo il contenuto.',
  'Sii conciso (2-4 frasi) e direttamente utilizzabile senza modifiche.',
].join(' ');

export async function generateFieldContent(fieldLabel, placeholder, context, onChunk) {
  const parts = [
    context && `Contesto: ${context}`,
    placeholder && `Descrizione del campo: ${placeholder}`,
  ].filter(Boolean).join('\n');

  const res = await fetch('/api/groq/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Campo: "${fieldLabel}"\n${parts}\n\nGenera il testo per questo campo.` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const reader = res.body.getReader();
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
        try {
          const text = JSON.parse(t.slice(6)).choices?.[0]?.delta?.content || '';
          if (text) onChunk(text);
        } catch {}
      }
    }
  }
}
