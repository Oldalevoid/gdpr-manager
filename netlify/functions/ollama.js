export default async (req) => {
  const url = new URL(req.url);
  const targetPath = url.pathname.replace(/^\/api\/ollama/, '');
  const targetUrl = `https://proxy.integroup.eu${targetPath}${url.search}`;

  const body = req.method !== 'GET' ? await req.text() : undefined;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'CF-Access-Client-Id': process.env.OLLAMA_CF_CLIENT_ID,
      'CF-Access-Client-Secret': process.env.OLLAMA_CF_CLIENT_SECRET,
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
