export default async (req) => {
  const url = new URL(req.url);
  const targetPath = url.pathname.replace(/^\/api\/claude/, '');
  const targetUrl = `https://api.anthropic.com${targetPath}${url.search}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: req.method !== 'GET' ? req.body : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  });
};

export const config = { path: '/api/claude/*' };
