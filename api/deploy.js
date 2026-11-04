module.exports = async function handler(req, res) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    res.status(500).json({
      error: 'VERCEL_TOKEN and VERCEL_PROJECT_ID must both be set in the Vercel project environment variables'
    });
    return;
  }

  try {
    const params = new URLSearchParams({
      projectId,
      limit: '1',
      target: 'production'
    });
    if (teamId) params.set('teamId', teamId);

    const response = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        error: (data && data.error && data.error.message) || 'Vercel API request failed'
      });
      return;
    }

    const deployment = Array.isArray(data.deployments) ? data.deployments[0] : null;

    if (!deployment) {
      res.status(404).json({ error: 'No production deployments found' });
      return;
    }

    const meta = deployment.meta || {};

    res.status(200).json({
      state: deployment.state || deployment.readyState || null,
      createdAt: deployment.createdAt || deployment.created || null,
      readyAt: deployment.ready || null,
      url: deployment.url || null,
      commitSha: meta.githubCommitSha ? meta.githubCommitSha.slice(0, 7) : null,
      commitMessage: meta.githubCommitMessage ? meta.githubCommitMessage.split('\n')[0] : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Proxy request failed', detail: String(err) });
  }
};

