import Anthropic from '@anthropic-ai/sdk';

export const isAIEnabled = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

let _client = null;
function getClient() {
  if (!_client) {
    _client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      baseURL: '/api/claude',
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

/**
 * Generates content for a form field using AI streaming.
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

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: [
      'Sei un esperto consulente di privacy, GDPR, NIS2 e sicurezza informatica.',
      'Genera contenuto professionale in italiano per campi di moduli di compliance.',
      'Rispondi ESCLUSIVAMENTE con il testo del campo richiesto.',
      'Niente prefissi, intestazioni, virgolette o spiegazioni. Solo il contenuto.',
      'Sii conciso (2-4 frasi) e direttamente utilizzabile senza modifiche.',
    ].join(' '),
    messages: [{
      role: 'user',
      content: `Campo: "${fieldLabel}"\n${parts}\n\nGenera il testo per questo campo.`,
    }],
  });

  for await (const text of stream.textStream) {
    onChunk(text);
  }
}
