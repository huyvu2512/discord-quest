const DISCORD_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'Origin': 'https://discord.com',
  'Referer': 'https://discord.com/channels/@me',
  'Content-Type': 'application/json'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const { token, questId, taskType, timestamp, applicationId, terminal } = body || {};
  if (!token || !questId) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc questId' });
  }

  try {
    const headers = DISCORD_HEADERS(token);
    let discordUrl = '';
    let payload = {};

    if (taskType === 'WATCH_VIDEO' || taskType === 'WATCH_VIDEO_ON_MOBILE') {
      discordUrl = `https://discord.com/api/v9/quests/${questId}/video-progress`;
      payload = { timestamp: timestamp || 10 };
    } else if (taskType?.includes('CONSOLE') || taskType?.includes('XBOX') || taskType?.includes('PLAYSTATION') || taskType?.includes('NINTENDO')) {
      discordUrl = `https://discord.com/api/v9/quests/${questId}/console-heartbeat`;
      payload = {
        application_id: applicationId,
        terminal: Boolean(terminal)
      };
    } else {
      // Gameplay / Stream / Activity Heartbeat
      discordUrl = `https://discord.com/api/v9/quests/${questId}/heartbeat`;
      payload = {
        application_id: applicationId,
        terminal: Boolean(terminal)
      };
    }

    const discordRes = await fetch(discordUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let errMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
      } catch {}
      return res.status(200).json({
        success: false,
        status: discordRes.status,
        error: errMsg
      });
    }

    const data = await discordRes.json();
    return res.status(200).json({
      success: true,
      user_status: data
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}
