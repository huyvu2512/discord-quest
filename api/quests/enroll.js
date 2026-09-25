const SUPER_PROPERTIES_DESKTOP = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MjE1Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MzEiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoidmktVk4iLCJjbGllbnRfYnVpbGRfbnVtYmVyIjozNzYwMDAsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9';

const DISCORD_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_DESKTOP,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
  'Sec-Ch-Ua': '"Chromium";v="138", "Not?A_Brand";v="8"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
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

  const { token, questId } = body || {};
  if (!token || !questId) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc questId' });
  }

  try {
    const discordRes = await fetch(`https://discord.com/api/v9/quests/${questId}/enroll`, {
      method: 'POST',
      headers: DISCORD_HEADERS(token),
      body: JSON.stringify({
        location: 11,
        is_targeted: false,
        metadata_raw: null
      })
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let errMsg = errText;
      let errCode = null;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
        errCode = parsed.code;
      } catch {}

      // Nếu quest đã được nhận trước đó
      if (errMsg.toLowerCase().includes('already enrolled')) {
        return res.status(200).json({
          success: true,
          message: 'Quest đã được nhận từ trước',
          alreadyEnrolled: true
        });
      }

      const isExpired = errMsg.toLowerCase().includes('hết hạn') || errMsg.toLowerCase().includes('expired') || errCode === 260017 || discordRes.status === 400;

      return res.status(200).json({
        success: false,
        status: discordRes.status,
        code: errCode,
        isExpired: isExpired,
        error: errMsg
      });
    }

    const data = await discordRes.json();
    return res.status(200).json({
      success: true,
      message: 'Nhận Quest thành công',
      user_status: data
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}
