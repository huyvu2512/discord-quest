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

  const { token, questId, taskType, timestamp, applicationId, terminal } = body || {};
  let trafficMetadataSealed = body.traffic_metadata_sealed || body.trafficMetadataSealed || null;
  if (!token || !questId) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc questId' });
  }

  try {
    const buildNum = await fetchLatestBuildNumber();
    const isVideo = taskType === 'WATCH_VIDEO' || taskType === 'WATCH_VIDEO_ON_MOBILE' || (typeof taskType === 'string' && taskType.includes('VIDEO'));
    let headers = DISCORD_HEADERS(token, buildNum);
    let discordUrl = '';
    let payload = {};

    // Tự động nạp traffic_metadata_sealed từ get-decisions nếu chưa có cho nhiệm vụ Video
    if (isVideo && !trafficMetadataSealed) {
      try {
        const decUrl = 'https://discord.com/api/v9/quests/get-decisions?placement=1&num_decisions_requested=5';
        const decRes = await fetch(decUrl, { headers: DISCORD_WEB_HEADERS(token, buildNum) });
        if (decRes.ok) {
          const decData = await decRes.json();
          trafficMetadataSealed = decData.traffic_metadata_sealed || decData.quest?.traffic_metadata_sealed || null;
        }
      } catch {}
    }

    if (isVideo) {
      discordUrl = `https://discord.com/api/v9/quests/${questId}/video-progress`;
      const numTs = typeof timestamp === 'number' ? timestamp : parseFloat(timestamp) || 10;
      payload = { timestamp: Number(numTs.toFixed(4)) };
      if (trafficMetadataSealed) {
        payload.traffic_metadata_sealed = trafficMetadataSealed;
      }
      if (taskType === 'WATCH_VIDEO_ON_MOBILE') {
        headers = DISCORD_MOBILE_HEADERS(token);
      } else {
        headers = DISCORD_HEADERS(token, buildNum);
        headers['Referer'] = 'https://discord.com/quest-home';
      }
    } else if (taskType?.includes('CONSOLE') || taskType?.includes('XBOX') || taskType?.includes('PLAYSTATION') || taskType?.includes('NINTENDO')) {
      discordUrl = `https://discord.com/api/v9/quests/${questId}/console-heartbeat`;
      payload = {
        application_id: applicationId,
        terminal: Boolean(terminal)
      };
      headers = DISCORD_HEADERS(token, buildNum);
    } else if (taskType === 'STREAM_ON_DESKTOP' || taskType === 'WATCH_STREAM') {
      // Hỗ trợ stream_key cho nhiệm vụ Stream trên PC / Livestream
      discordUrl = `https://discord.com/api/v9/quests/${questId}/heartbeat`;
      const pid = Math.floor(Math.random() * 29000) + 1000;
      payload = {
        stream_key: `call:0:${pid}`,
        terminal: Boolean(terminal)
      };
      if (applicationId) {
        payload.application_id = applicationId;
      }
      headers = DISCORD_HEADERS(token, buildNum);
    } else if (taskType === 'PLAY_ACTIVITY') {
      // Hỗ trợ stream_key cho nhiệm vụ Discord Activity
      discordUrl = `https://discord.com/api/v9/quests/${questId}/heartbeat`;
      payload = {
        stream_key: 'call:0:1',
        terminal: Boolean(terminal)
      };
      if (applicationId) {
        payload.application_id = applicationId;
      }
      headers = DISCORD_HEADERS(token, buildNum);
    } else {
      // Gameplay thông thường (PLAY_ON_DESKTOP, v.v.)
      discordUrl = `https://discord.com/api/v9/quests/${questId}/heartbeat`;
      payload = {
        application_id: applicationId,
        terminal: Boolean(terminal)
      };
      headers = DISCORD_HEADERS(token, buildNum);
    }

    let discordRes = await fetch(discordUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    // 1. Kiểm tra giới hạn tốc độ 429 ngay lập tức
    if (discordRes.status === 429) {
      const rateLimitData = await discordRes.json().catch(() => ({}));
      const retryAfter = rateLimitData.retry_after || 5;
      return res.status(200).json({
        success: false,
        status: 429,
        retryAfter: retryAfter,
        isRateLimited: true,
        error: `Bạn đang bị Discord giới hạn tốc độ thao tác (Rate Limit). Thử lại sau ${Math.ceil(retryAfter)}s.`
      });
    }

    // 2. NẾU BỊ 404 VÀ LÀ NHIỆM VỤ VIDEO: Tự động thử JIT Enroll trên Discord
    if (discordRes.status === 404 && isVideo) {
      console.log(`[Video Progress] Quest ${questId} chưa enroll (404), tiến hành JIT Enroll...`);
      try {
        const enrollRes = await fetch(`https://discord.com/api/v9/quests/${questId}/enroll`, {
          method: 'POST',
          headers: DISCORD_HEADERS(token),
          body: JSON.stringify({
            location: 11,
            is_targeted: false,
            metadata_sealed: null,
            traffic_metadata_sealed: trafficMetadataSealed || null
          })
        });

        console.log(`[Video Progress] JIT Enroll status cho ${questId}:`, enrollRes.status);
        if (enrollRes.status === 429) {
          const rateLimitData = await enrollRes.json().catch(() => ({}));
          const retryAfter = rateLimitData.retry_after || 5;
          return res.status(200).json({
            success: false,
            status: 429,
            retryAfter: retryAfter,
            isRateLimited: true,
            error: `Discord giới hạn thao tác nhận nhiệm vụ. Thử lại sau ${Math.ceil(retryAfter)}s.`
          });
        }

        const enrollData = await enrollRes.json().catch(() => ({}));
        if (enrollRes.ok || enrollData.code === 260017 || enrollData.message?.toLowerCase().includes('already enrolled')) {
          console.log(`[Video Progress] Enroll thành công (hoặc đã tham gia), thử lại video-progress...`);
          discordRes = await fetch(discordUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        }
      } catch (e) {
        console.warn(`[Video Progress] Lỗi JIT Enroll:`, e.message);
      }
    }

    // Fallback nếu video-progress với Desktop headers chưa thành công, thử thêm với Web headers
    if (!discordRes.ok && isVideo) {
      const webHeaders = DISCORD_WEB_HEADERS(token, buildNum);
      const retryRes = await fetch(discordUrl, {
        method: 'POST',
        headers: webHeaders,
        body: JSON.stringify(payload)
      });
      if (retryRes.status === 429) {
        const rateLimitData = await retryRes.json().catch(() => ({}));
        const retryAfter = rateLimitData.retry_after || 5;
        return res.status(200).json({
          success: false,
          status: 429,
          retryAfter: retryAfter,
          isRateLimited: true,
          error: `Bạn đang bị Discord giới hạn tốc độ thao tác (Rate Limit). Thử lại sau ${Math.ceil(retryAfter)}s.`
        });
      }
      if (retryRes.ok) {
        discordRes = retryRes;
      }
    }

    // Fallback nếu video-progress vẫn chưa thành công, thử tiếp với Mobile headers
    if (!discordRes.ok && isVideo) {
      const mobHeaders = DISCORD_MOBILE_HEADERS(token);
      const retryResMob = await fetch(discordUrl, {
        method: 'POST',
        headers: mobHeaders,
        body: JSON.stringify(payload)
      });
      if (retryResMob.status === 429) {
        const rateLimitData = await retryResMob.json().catch(() => ({}));
        const retryAfter = rateLimitData.retry_after || 5;
        return res.status(200).json({
          success: false,
          status: 429,
          retryAfter: retryAfter,
          isRateLimited: true,
          error: `Bạn đang bị Discord giới hạn tốc độ thao tác (Rate Limit). Thử lại sau ${Math.ceil(retryAfter)}s.`
        });
      }
      if (retryResMob.ok) {
        discordRes = retryResMob;
      }
    }

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let errMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
      } catch {}

      if (discordRes.status === 404 && isVideo) {
        errMsg = `Quest video chưa được nhận trên Discord.`;
      }

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
