export default async (req) => {
  const url = new URL(req.url);
  const targetPath = url.pathname.replace(/^\/api\/groq/, '');
  const targetUrl = `https://api.groq.com${targetPath}${url.search}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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

export const config = { path: '/api/groq/*' };
