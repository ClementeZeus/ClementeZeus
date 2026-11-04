module.exports = async function handler(req, res) {
  const path = req.query.path;

  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ error: 'GITHUB_TOKEN is not set in the Vercel project environment variables' });
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json'
      }
    });

    const text = await response.text();
    res
      .status(response.status)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      .send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy request failed', detail: String(err) });
  }
};
