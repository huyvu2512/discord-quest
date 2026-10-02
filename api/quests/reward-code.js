import {
  fetchLatestBuildNumber,
  DISCORD_HEADERS
} from '../discord-client.js';

export default async function handler(req, res) {
  let token = req.query?.token || req.headers?.authorization;
  let questId = req.query?.questId || req.query?.id;

  if (req.body) {
    let b = req.body;
    if (typeof b === 'string') {
      try { b = JSON.parse(b); } catch {}
    }
    if (b) {
      if (b.token) token = b.token;
      if (b.questId) questId = b.questId;
      if (b.id) questId = b.id;
    }
  }

  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  if (!token) {
    return res.status(400).json({ success: false, error: 'Thiếu Discord Token' });
  }

  if (!questId) {
    return res.status(400).json({ success: false, error: 'Thiếu Quest ID' });
  }

  try {
    const buildNum = await fetchLatestBuildNumber();
    const discordRes = await fetch(`https://discord.com/api/v9/quests/${questId}/reward-code`, {
      method: 'GET',
      headers: DISCORD_HEADERS(token, buildNum)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let errMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
      } catch {}

      return res.status(discordRes.status).json({
        success: false,
        status: discordRes.status,
        error: errMsg || 'Không thể lấy mã quà từ Discord'
      });
    }

    const data = await discordRes.json();
    return res.status(200).json({
      success: true,
      questId: data.quest_id || questId,
      code: data.code,
      platform: data.platform,
      userId: data.user_id,
      claimedAt: data.claimed_at,
      tier: data.tier
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi kết nối khi lấy mã quà'
    });
  }
}
