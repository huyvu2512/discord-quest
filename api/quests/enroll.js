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

const SUPER_PROPERTIES_WEB = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InZpLVZOIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzOC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTM4LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiIiLCJyZWZlcnJpbmdfZG9tYWluIjoiIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM3NjAwMCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=';

const DISCORD_WEB_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_WEB,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
  'Sec-Ch-Ua': '"Chromium";v="138", "Not?A_Brand";v="8"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Origin': 'https://discord.com',
  'Referer': 'https://discord.com/quest-home',
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

  const traffic_metadata_sealed = body.traffic_metadata_sealed || body.trafficMetadataSealed || null;
  const metadata_sealed = body.metadata_sealed || null;

  try {
    const isTargeted = Boolean(traffic_metadata_sealed);

    // Chuẩn Discord Desktop & Web: Thử tối đa 2 lần (Location 11 -> Location 13)
    // Tuyệt đối KHÔNG lặp brute-force 28 lần gây dính HTTP 429 Rate Limit
    const attempts = [
      {
        headers: DISCORD_HEADERS(token),
        payload: {
          location: 11,
          is_targeted: false,
          metadata_sealed: metadata_sealed,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        headers: DISCORD_WEB_HEADERS(token),
        payload: {
          location: 13,
          is_targeted: isTargeted,
          metadata_sealed: metadata_sealed,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      }
    ];

    let lastRes = null;
    let lastData = null;

    for (const attempt of attempts) {
      const resDiscord = await fetch(`https://discord.com/api/v9/quests/${questId}/enroll`, {
        method: 'POST',
        headers: attempt.headers,
        body: JSON.stringify(attempt.payload)
      });

      lastRes = resDiscord;

      // 1. Xử lý HTTP 429 (Giới hạn tốc độ) NGAY LẬP TỨC: Dừng ngay, không retry để tránh bị phạt thêm
      if (resDiscord.status === 429) {
        const rateLimitData = await resDiscord.json().catch(() => ({}));
        const retryAfter = rateLimitData.retry_after || 5;
        return res.status(200).json({
          success: false,
          status: 429,
          retryAfter: retryAfter,
          isRateLimited: true,
          error: `Bạn đang bị Discord giới hạn tốc độ thao tác (Rate Limit). Vui lòng đợi ${Math.ceil(retryAfter)} giây rồi thử lại.`
        });
      }

      if (resDiscord.ok) {
        const data = await resDiscord.json().catch(() => ({}));
        return res.status(200).json({
          success: true,
          message: 'Nhận Quest thành công',
          user_status: data
        });
      }

      const errText = await resDiscord.text();
      let errMsg = errText;
      let errCode = null;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
        errCode = parsed.code;
      } catch {}

      // Nếu quest đã được nhận trước đó (code 260017 hoặc message tương ứng) -> Thành công
      const isAlreadyEnrolled = errCode === 260017 || 
        errMsg.toLowerCase().includes('already enrolled') || 
        errMsg.toLowerCase().includes('đã tham gia') ||
        errMsg.toLowerCase().includes('đã nhận');

      if (isAlreadyEnrolled) {
        return res.status(200).json({
          success: true,
          message: 'Quest đã được nhận từ trước',
          alreadyEnrolled: true
        });
      }

      lastData = { errText, errMsg, errCode };
    }

    const isExpired = lastData?.errMsg?.toLowerCase().includes('hết hạn') || 
      lastData?.errMsg?.toLowerCase().includes('expired') || 
      lastData?.errCode === 260018;

    return res.status(200).json({
      success: false,
      status: lastRes?.status || 400,
      code: lastData?.errCode,
      isExpired: isExpired,
      error: lastData?.errMsg || 'Không thể nhận nhiệm vụ trên Discord'
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}
