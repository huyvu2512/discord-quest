/**
 * MODULE: DISCORD CLIENT HELPERS (api/discord-client.js)
 * Cung cấp:
 * 1. Tự động cào và cập nhật Build Number mới nhất từ Discord (mặc định 626571, tự làm mới sau 6 tiếng)
 * 2. Tạo X-Super-Properties chuẩn xác cho Desktop, Web, Android và iOS
 * 3. Sinh Header kết nối tương ứng
 * 4. Nhận diện loại nhiệm vụ từ Discord task_config chuẩn 100%
 */

let cachedBuildNumber = 626571;
let lastBuildFetchedAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 tiếng tự làm mới một lần

export async function fetchLatestBuildNumber() {
  if (Date.now() - lastBuildFetchedAt < CACHE_TTL_MS && cachedBuildNumber) {
    return cachedBuildNumber;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
    const r = await fetch('https://discord.com/app', {
      headers: { 'User-Agent': ua },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (r.ok) {
      const html = await r.text();
      const re = /<script[^>]+src=["'](\/assets\/[^"']+\.js)["']/g;
      let match;
      const scriptUrls = [];
      while ((match = re.exec(html)) !== null) {
        scriptUrls.push(match[1]);
      }

      // Quét ngược từ 15 script cuối cùng
      for (const url of scriptUrls.slice(-15).reverse()) {
        try {
          const sRes = await fetch(`https://discord.com${url}`, {
            headers: { 'User-Agent': ua }
          });
          const text = await sRes.text();
          const m = text.match(/buildNumber["\s:]+["\s]*(\d{5,7})/i) || text.match(/client_build_number["\s:]+["\s]*(\d{5,7})/i);
          if (m && m[1]) {
            cachedBuildNumber = parseInt(m[1], 10);
            lastBuildFetchedAt = Date.now();
            console.log(`[Discord Build] Cập nhật Build Number Discord thành công: ${cachedBuildNumber}`);
            return cachedBuildNumber;
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`[Discord Build] Không thể lấy build mới từ Discord (${err.message}), dùng build hiện tại: ${cachedBuildNumber}`);
  }
  return cachedBuildNumber || 626571;
}

export function getCachedBuildNumber() {
  return cachedBuildNumber || 626571;
}

export function getDesktopSuperProperties(buildNum = cachedBuildNumber) {
  return Buffer.from(JSON.stringify({
    os: "Windows",
    browser: "Discord Client",
    release_channel: "stable",
    client_version: "1.0.9215",
    os_version: "10.0.22631",
    os_arch: "x64",
    app_arch: "x64",
    system_locale: "vi-VN",
    browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36",
    browser_version: "37.6.0",
    client_build_number: buildNum,
    native_build_number: 62000,
    client_event_source: null
  })).toString('base64');
}

export function getWebSuperProperties(buildNum = cachedBuildNumber) {
  return Buffer.from(JSON.stringify({
    os: "Windows",
    browser: "Chrome",
    device: "",
    system_locale: "vi-VN",
    browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    browser_version: "138.0.0.0",
    os_version: "10",
    referrer: "",
    referring_domain: "",
    referrer_current: "",
    referring_domain_current: "",
    release_channel: "stable",
    client_build_number: buildNum,
    client_event_source: null
  })).toString('base64');
}

export const SUPER_PROPERTIES_MOBILE_ANDROID = Buffer.from(JSON.stringify({
  os: "Android",
  browser: "Discord Android",
  device: "Samsung Galaxy S24",
  system_locale: "vi-VN",
  client_version: "225.0",
  release_channel: "googleRelease",
  device_vendor_id: "00000000-0000-0000-0000-000000000000",
  browser_user_agent: "",
  client_build_number: 225000000
})).toString('base64');

export const SUPER_PROPERTIES_MOBILE_IOS = Buffer.from(JSON.stringify({
  os: "iOS",
  browser: "Discord iOS",
  device: "iPhone15,2",
  system_locale: "vi-VN",
  client_version: "225.0",
  release_channel: "appleRelease",
  device_vendor_id: "00000000-0000-0000-0000-000000000000",
  browser_user_agent: "",
  client_build_number: 55000
})).toString('base64');

export const DISCORD_HEADERS = (token, buildNum = cachedBuildNumber) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': getDesktopSuperProperties(buildNum),
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

export const DISCORD_WEB_HEADERS = (token, buildNum = cachedBuildNumber) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': getWebSuperProperties(buildNum),
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

export const DISCORD_MOBILE_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Discord-Android/225000000; Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.251 Mobile Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_MOBILE_ANDROID,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
  'Content-Type': 'application/json'
});

export const DISCORD_IOS_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Discord-iOS/225.0 (iPhone; iOS 17.5.1; Scale/3.00)',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_MOBILE_IOS,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
  'Content-Type': 'application/json'
});

export function detectTaskType(config) {
  const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};
  const priority = [
    'WATCH_VIDEO', 'WATCH_VIDEO_ON_MOBILE',
    'PLAY_ON_DESKTOP', 'PLAY_ON_XBOX', 'PLAY_ON_PLAYSTATION', 'PLAY_ON_NINTENDO',
    'PLAY_ON_MOBILE', 'PLAY_SOCIAL_GAME', 'PLAY_ACTIVITY',
    'STREAM_ON_DESKTOP', 'WATCH_STREAM',
    'FOLLOW_SOCIAL', 'SHARE_CONTENT', 'JOIN_COMMUNITY',
    'COMPLETE_SURVEY', 'REDEEM_CODE', 'MAKE_PURCHASE'
  ];
  return priority.find(t => tasks[t] != null) || Object.keys(tasks)[0] || 'PLAY_ON_DESKTOP';
}

export function getTaskTypeName(taskType) {
  switch (taskType) {
    case 'WATCH_VIDEO': return 'Xem Video';
    case 'WATCH_VIDEO_ON_MOBILE': return 'Xem Video (Mobile)';
    case 'WATCH_STREAM': return 'Xem Livestream';
    case 'PLAY_ON_DESKTOP': return 'Chơi trên PC';
    case 'STREAM_ON_DESKTOP': return 'Stream trên PC';
    case 'PLAY_ON_XBOX': return 'Chơi (Xbox)';
    case 'PLAY_ON_PLAYSTATION': return 'Chơi (PS5)';
    case 'PLAY_ON_NINTENDO': return 'Chơi (Nintendo)';
    case 'PLAY_ON_MOBILE': return 'Chơi Mobile';
    case 'PLAY_ACTIVITY': return 'Hoạt động Discord';
    case 'FOLLOW_SOCIAL': return 'Theo dõi MXH';
    case 'SHARE_CONTENT': return 'Chia sẻ nội dung';
    case 'JOIN_COMMUNITY': return 'Tham gia nhóm';
    default: return 'Nhiệm vụ Discord';
  }
}
