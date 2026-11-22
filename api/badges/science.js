import crypto from 'crypto';
import { fetchLatestBuildNumber, DISCORD_HEADERS } from '../discord-client.js';

function parseBody(req) {
  let b = req.body;
  if (!b || typeof b === 'string') {
    try {
      b = typeof b === 'string' && b.trim() ? JSON.parse(b) : {};
    } catch {
      b = {};
    }
  }
  return b || {};
}

function normalizeCookie(rawCookie) {
  const c = String(rawCookie || '').trim();
  if (!c) return '';
  if (c.includes('=')) return c;
  return `cf_clearance=${c}`;
}

async function fetchAnalyticsToken(token, headers) {
  const res = await fetch('https://discord.com/api/v9/users/@me?with_analytics_token=true', { headers });
  if (res.status === 401) {
    throw Object.assign(new Error('Token Discord không hợp lệ hoặc đã hết hạn (401).'), { status: 401 });
  }
  if (res.status === 403) {
    throw Object.assign(new Error('Bị Cloudflare chặn (403). Vui lòng nhập/làm mới Cookie cf_clearance.'), { status: 403, needsCookie: true });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`Không thể lấy analytics_token từ Discord (HTTP ${res.status}).`), { status: res.status });
  }
  const data = await res.json();
  if (!data?.analytics_token) {
    throw Object.assign(new Error('Tài khoản chưa bật dữ liệu cá nhân hóa ("Use data to personalize my Discord experience") hoặc không có analytics_token.'), { status: 400 });
  }
  return data.analytics_token;
}

function buildGameSessionEvents(game, durationMs, heartbeatSession, launchSignature, seqState) {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const start = now - durationMs > 0 ? now - durationMs : now;
  const gameId = String(game.id);
  const gameName = String(game.name || 'Game');
  const gameExe = String(game.exe || 'game.exe');

  const nextSeq = () => {
    seqState.val += 1;
    return seqState.val;
  };

  const initialHb = {
    type: 'running_game_heartbeat',
    properties: {
      client_track_timestamp: start,
      client_heartbeat_session_id: heartbeatSession,
      event_sequence_number: nextSeq(),
      game_id: gameId,
      game_name: gameName,
      game_metadata: null,
      game_executable: gameExe,
      game_detection_enabled: true,
      initial_heartbeat: true,
      final_heartbeat: false,
      game_session_id: sessionId,
      duration_tracked_ms: 0,
      rtc_connection_id: null,
      media_session_id: null,
      launch_signature: launchSignature,
      client_app_state: 'focused',
      client_send_timestamp: start
    }
  };

  const launchEvt = {
    type: 'launch_game',
    properties: {
      client_track_timestamp: start + 100,
      client_heartbeat_session_id: heartbeatSession,
      event_sequence_number: nextSeq(),
      game: gameName,
      game_id: gameId,
      verified: true,
      elevated: false,
      is_launcher: false,
      game_platform: 'desktop',
      detection_method: 'verified_game',
      is_overlay_enabled: false,
      is_overlay_game_enabled: true,
      is_overlay_game_source: 'OOP_DEFAULT_DATABASE',
      fullscreen_type: 'UNKNOWN',
      hardware_display_count: 1,
      overlay_method: 'Disabled',
      activity_status_enabled: true,
      activity_status_shared_guilds: [],
      current_user_status: 'online',
      game_detection_enabled: true,
      executable_path: gameExe,
      voice_channel_id: null,
      voice_channel_type: null,
      voice_channel_bitrate: null,
      voice_channel_guild_id: null,
      hidden_by_distributor: false,
      game_metadata: null,
      client_performance_cpu: null,
      client_performance_memory: null,
      cpu_core_count: null,
      accessibility_features: 0,
      client_send_timestamp: start + 100
    }
  };

  const finalHb = {
    type: 'running_game_heartbeat',
    properties: {
      client_track_timestamp: now,
      client_heartbeat_session_id: heartbeatSession,
      event_sequence_number: nextSeq(),
      game_id: gameId,
      game_name: gameName,
      game_metadata: null,
      game_executable: gameExe,
      game_detection_enabled: true,
      initial_heartbeat: false,
      final_heartbeat: true,
      game_session_id: sessionId,
      duration_tracked_ms: durationMs,
      rtc_connection_id: null,
      media_session_id: null,
      launch_signature: launchSignature,
      client_app_state: 'focused',
      client_send_timestamp: now
    }
  };

  return [initialHb, launchEvt, finalHb];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Phương thức không được hỗ trợ' });
  }

  const body = parseBody(req);
  let token = String(body.token || req.headers?.authorization || '').trim().replace(/^"|"$/g, '');
  if (token.startsWith('Bearer ')) token = token.slice(7).trim();

  if (!token) {
    return res.status(400).json({ success: false, error: 'Thiếu Discord User Token' });
  }

  const games = Array.isArray(body.games) ? body.games : [];
  if (games.length === 0) {
    return res.status(400).json({ success: false, error: 'Danh sách game trống' });
  }

  const mode = body.mode || 'both'; // 'both' | 'playtime' | 'games_played'
  const hoursPerGame = Math.max(0.01, Math.min(Number(body.hoursPerGame) || 10, 5000));
  const durationMs = mode === 'games_played' ? 60000 : Math.round(hoursPerGame * 3600 * 1000);
  const cookieHeader = normalizeCookie(body.cfClearance);

  try {
    const buildNum = await fetchLatestBuildNumber();
    const headers = {
      ...DISCORD_HEADERS(token, buildNum),
      'x-debug-options': 'bugReporterEnabled'
    };
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    let analyticsToken = String(body.analyticsToken || '').trim();
    if (!analyticsToken) {
      analyticsToken = await fetchAnalyticsToken(token, headers);
    }

    const heartbeatSession = String(body.heartbeatSession || crypto.randomUUID());
    const launchSignature = String(body.launchSignature || crypto.randomUUID());
    const seqState = { val: Number(body.seqOffset) || 0 };

    // Giới hạn tối đa 16 game/batch (48 events < BATCH_SIZE 50 của Discord Science)
    const batchGames = games.slice(0, 16);
    const events = [];
    let totalDurationMs = 0;
    for (const g of batchGames) {
      const perGameMs = mode === 'games_played'
        ? (45 + Math.floor(Math.random() * 76)) * 1000 // Random 45s - 120s cho mỗi game
        : durationMs;
      totalDurationMs += perGameMs;
      events.push(...buildGameSessionEvents(g, perGameMs, heartbeatSession, launchSignature, seqState));
    }

    const sciRes = await fetch('https://discord.com/api/v9/science', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token: analyticsToken,
        events
      })
    });

    if (sciRes.status === 204 || sciRes.ok) {
      const hoursAdded = Number((totalDurationMs / (3600 * 1000)).toFixed(2));

      return res.status(200).json({
        success: true,
        status: sciRes.status,
        analyticsToken,
        heartbeatSession,
        launchSignature,
        nextSeq: seqState.val,
        eventsSent: events.length,
        gamesProcessed: batchGames.length,
        hoursAdded
      });
    }

    if (sciRes.status === 401) {
      return res.status(401).json({
        success: false,
        status: 401,
        error: 'Token không hợp lệ hoặc analytics_token đã hết hạn (401).'
      });
    }

    if (sciRes.status === 403) {
      return res.status(403).json({
        success: false,
        status: 403,
        needsCookie: true,
        error: 'Bị Cloudflare chặn (403). Vui lòng nhập hoặc làm mới Cookie cf_clearance.'
      });
    }

    if (sciRes.status === 429) {
      const rl = await sciRes.json().catch(() => ({}));
      const retryAfter = rl.retry_after || 5;
      return res.status(429).json({
        success: false,
        status: 429,
        retryAfter,
        isRateLimited: true,
        error: `Discord giới hạn tốc độ (429). Chờ ${Math.ceil(retryAfter)}s.`
      });
    }

    const errText = await sciRes.text().catch(() => '');
    return res.status(sciRes.status).json({
      success: false,
      status: sciRes.status,
      error: errText ? `Discord Science lỗi ${sciRes.status}: ${errText.slice(0, 150)}` : `Discord Science lỗi HTTP ${sciRes.status}`
    });
  } catch (err) {
    const code = err.status || 500;
    return res.status(code).json({
      success: false,
      status: code,
      needsCookie: Boolean(err.needsCookie),
      error: err.message || 'Lỗi kết nối Discord Science'
    });
  }
}
