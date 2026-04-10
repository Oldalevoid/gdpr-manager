export default async (req) => {
  const body = req.method !== 'GET' ? await req.text() : undefined;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  });
};
