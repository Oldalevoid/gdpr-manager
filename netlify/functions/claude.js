export default async (req) => {
  const body = req.method !== 'GET' ? await req.text() : undefined;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
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
