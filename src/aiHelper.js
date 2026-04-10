import Groq from 'groq-sdk';

export const isAIEnabled = !!import.meta.env.VITE_GROQ_API_KEY;

let _client = null;
function getClient() {
  if (!_client) {
    _client = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      baseURL: '/api/groq',
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

/**
 * Generates content for a form field using Groq streaming.
 * @param {string} fieldLabel - The label of the field
 * @param {string} placeholder - The placeholder/hint text
 * @param {string} context - Additional context (company name, section, etc.)
 * @param {function} onChunk - Called with each text chunk as it arrives
 */
export async function generateFieldContent(fieldLabel, placeholder, context, onChunk) {
  const client = getClient();
  const parts = [
    context && `Contesto: ${context}`,
    placeholder && `Descrizione del campo: ${placeholder}`,
  ].filter(Boolean).join('\n');

  const stream = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 400,
    stream: true,
    messages: [
      {
        role: 'system',
        content: [
          'Sei un esperto consulente di privacy, GDPR, NIS2 e sicurezza informatica.',
          'Genera contenuto professionale in italiano per campi di moduli di compliance.',
          'Rispondi ESCLUSIVAMENTE con il testo del campo richiesto.',
          'Niente prefissi, intestazioni, virgolette o spiegazioni. Solo il contenuto.',
          'Sii conciso (2-4 frasi) e direttamente utilizzabile senza modifiche.',
        ].join(' '),
      },
      {
        role: 'user',
        content: `Campo: "${fieldLabel}"\n${parts}\n\nGenera il testo per questo campo.`,
      },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) onChunk(text);
  }
}
