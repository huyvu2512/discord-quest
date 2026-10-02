import {
  fetchLatestBuildNumber,
  DISCORD_HEADERS,
  DISCORD_WEB_HEADERS,
  DISCORD_MOBILE_HEADERS,
  DISCORD_IOS_HEADERS
} from '../discord-client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const { token, questId, taskType } = body || {};
  if (!token || !questId) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc questId' });
  }

  let traffic_metadata_sealed = body.traffic_metadata_sealed || body.trafficMetadataSealed || null;
  const metadata_sealed = body.metadata_sealed || null;

  const buildNum = await fetchLatestBuildNumber();

  // Tự động nạp traffic_metadata_sealed từ get-decisions nếu chưa có
  if (!traffic_metadata_sealed) {
    try {
      const decRes = await fetch('https://discord.com/api/v9/quests/get-decisions?placement=1&num_decisions_requested=5', {
        headers: DISCORD_WEB_HEADERS(token, buildNum)
      });
      if (decRes.ok) {
        const decData = await decRes.json();
        traffic_metadata_sealed = decData.traffic_metadata_sealed || decData.quest?.traffic_metadata_sealed || null;
      }
    } catch {}
  }

  try {
    const isTargeted = Boolean(traffic_metadata_sealed);
    const isMobileTask = taskType === 'WATCH_VIDEO_ON_MOBILE' || taskType?.includes('MOBILE');

    // Chuẩn Discord Desktop, Web & Mobile:
    const attempts = [
      {
        headers: isMobileTask ? DISCORD_MOBILE_HEADERS(token) : DISCORD_HEADERS(token, buildNum),
        payload: {
          location: 11,
          is_targeted: isTargeted,
          metadata_sealed: metadata_sealed,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        headers: isMobileTask ? DISCORD_IOS_HEADERS(token) : DISCORD_WEB_HEADERS(token, buildNum),
        payload: {
          location: 13,
          is_targeted: isTargeted,
          metadata_sealed: metadata_sealed,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        headers: DISCORD_MOBILE_HEADERS(token),
        payload: {
          location: 11,
          is_targeted: isTargeted,
          metadata_sealed: metadata_sealed,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        headers: DISCORD_IOS_HEADERS(token),
        payload: {
          location: 11,
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

      // 1. Xử lý HTTP 429 (Giới hạn tốc độ) NGAY LẬP TỨC: Dừng ngay, không retry
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
