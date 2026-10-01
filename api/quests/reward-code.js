const SUPER_PROPERTIES_DESKTOP = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MjE1Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MzEiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoidmktVk4iLCJjbGllbnRfYnVpbGRfbnVtYmVyIjozNzYwMDAsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9';

const DISCORD_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_DESKTOP,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Origin': 'https://discord.com',
  'Referer': 'https://discord.com/channels/@me'
});

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
    const discordRes = await fetch(`https://discord.com/api/v9/quests/${questId}/reward-code`, {
      method: 'GET',
      headers: DISCORD_HEADERS(token)
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
