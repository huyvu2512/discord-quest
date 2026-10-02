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

    // 1. Attempt 1: Chuẩn nền tảng của Quest (Desktop hoặc Mobile)
    const primaryHeaders = isMobileTask ? DISCORD_MOBILE_HEADERS(token) : DISCORD_HEADERS(token, buildNum);
    const primaryPayload = {
      location: isMobileTask ? 13 : 11,
      is_targeted: isTargeted,
      ...(metadata_sealed ? { metadata_sealed } : {}),
      ...(traffic_metadata_sealed ? { traffic_metadata_sealed } : {})
    };

    const resDiscord = await fetch(`https://discord.com/api/v9/quests/${questId}/enroll`, {
      method: 'POST',
      headers: primaryHeaders,
      body: JSON.stringify(primaryPayload)
    });

    if (resDiscord.status === 429) {
      const rateLimitData = await resDiscord.json().catch(() => ({}));
      const retryAfter = rateLimitData.retry_after || 5;
      return res.status(200).json({
        success: false,
        status: 429,
        retryAfter: retryAfter,
        isRateLimited: true,
        error: `Bị Discord giới hạn tốc độ thao tác (Rate Limit, ${Math.ceil(retryAfter)}s).`
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

    // Đã nhận trước đó (code 260017) -> Thành công
    if (errCode === 260017 || errMsg.toLowerCase().includes('already enrolled')) {
      return res.status(200).json({
        success: true,
        message: 'Quest đã được nhận từ trước',
        alreadyEnrolled: true
      });
    }

    // 2. Attempt 2 (Fallback duy nhất): Thử Location 13 (với Desktop) hoặc Location 1 (với Mobile)
    if (resDiscord.status === 400 || resDiscord.status === 404) {
      const fallbackHeaders = isMobileTask ? DISCORD_IOS_HEADERS(token) : DISCORD_WEB_HEADERS(token, buildNum);
      const fallbackPayload = {
        location: isMobileTask ? 1 : 13,
        is_targeted: isTargeted,
        ...(traffic_metadata_sealed ? { traffic_metadata_sealed } : {})
      };
      const fallbackRes = await fetch(`https://discord.com/api/v9/quests/${questId}/enroll`, {
        method: 'POST',
        headers: fallbackHeaders,
        body: JSON.stringify(fallbackPayload)
      });

      if (fallbackRes.status === 429) {
        const rateLimitData = await fallbackRes.json().catch(() => ({}));
        const retryAfter = rateLimitData.retry_after || 5;
        return res.status(200).json({
          success: false,
          status: 429,
          retryAfter: retryAfter,
          isRateLimited: true,
          error: `Bị Discord giới hạn tốc độ thao tác (Rate Limit, ${Math.ceil(retryAfter)}s).`
        });
      }

      if (fallbackRes.ok) {
        const data = await fallbackRes.json().catch(() => ({}));
        return res.status(200).json({
          success: true,
          message: 'Nhận Quest thành công',
          user_status: data
        });
      }

      const fbErrText = await fallbackRes.text();
      try {
        const fbParsed = JSON.parse(fbErrText);
        if (fbParsed.code === 260017 || fbParsed.message?.toLowerCase().includes('already enrolled')) {
          return res.status(200).json({
            success: true,
            message: 'Quest đã được nhận từ trước',
            alreadyEnrolled: true
          });
        }
        errMsg = fbParsed.message || errMsg;
        errCode = fbParsed.code || errCode;
      } catch {}
    }

    const isExpired = errMsg?.toLowerCase().includes('hết hạn') || 
      errMsg?.toLowerCase().includes('expired') || 
      errCode === 260018;

    return res.status(200).json({
      success: false,
      status: resDiscord.status || 400,
      code: errCode,
      isExpired: isExpired,
      error: errMsg || 'Không thể nhận nhiệm vụ trên Discord'
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}
