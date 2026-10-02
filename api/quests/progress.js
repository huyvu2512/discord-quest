const SUPER_PROPERTIES_DESKTOP = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MTc1Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjYxMDAiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoidmktVk4iLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBkaXNjb3JkLzEuMC45MTc1IENocm9tZS8xMjguMC42NjEzLjE4NiBFbGVjdHJvbi8zMi4yLjcgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjMyLjIuNyIsImNsaWVudF9idWlsZF9udW1iZXIiOjUwNDY0OSwibmF0aXZlX2J1aWxkX251bWJlciI6NTk0OTgsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9';
const SUPER_PROPERTIES_WEB = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InZpLVZOIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzOC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTM4LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiIiLCJyZWZlcnJpbmdfZG9tYWluIjoiIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM3NjAwMCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=';

const DISCORD_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9175 Chrome/128.0.6613.186 Electron/32.2.7 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_DESKTOP,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
  'Sec-Ch-Ua': '"Chromium";v="128", "Not?A_Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Origin': 'https://discord.com',
  'Referer': 'https://discord.com/channels/@me',
  'Content-Type': 'application/json'
});

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

  const { token, questId, taskType, timestamp, applicationId, terminal } = body || {};
  let trafficMetadataSealed = body.traffic_metadata_sealed || body.trafficMetadataSealed || null;
  if (!token || !questId) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc questId' });
  }

  try {
    const isVideo = taskType === 'WATCH_VIDEO' || taskType === 'WATCH_VIDEO_ON_MOBILE' || (typeof taskType === 'string' && taskType.includes('VIDEO'));
    let headers = DISCORD_HEADERS(token);
    let discordUrl = '';
    let payload = {};

    // Tự động nạp traffic_metadata_sealed từ get-decisions nếu chưa có cho nhiệm vụ Video
    if (isVideo && !trafficMetadataSealed) {
      try {
        const decUrl = 'https://discord.com/api/v9/quests/get-decisions?placement=1&num_decisions_requested=5';
        const decRes = await fetch(decUrl, { headers: DISCORD_WEB_HEADERS(token) });
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
      headers = DISCORD_HEADERS(token);
      headers['Referer'] = 'https://discord.com/quest-home';
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
      const webHeaders = DISCORD_WEB_HEADERS(token);
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

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      let errMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
      } catch {}

      if (discordRes.status === 404 && isVideo) {
        errMsg = `Quest video chưa được nhận trên Discord. Vui lòng bấm biểu tượng mở Discord bên cạnh để bắt đầu xem video.`;
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
