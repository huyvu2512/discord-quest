import crypto from 'crypto';

let cachedCordProps = null;
let cachedCordPropsAt = 0;
const PROPS_CACHE_MS = 6 * 60 * 60 * 1000;

const FALLBACK_CLIENT_PROPS = {
  os: 'Windows',
  browser: 'Discord Client',
  release_channel: 'stable',
  client_version: '1.0.9269',
  os_version: '10.0.26200',
  os_arch: 'x64',
  app_arch: 'x64',
  system_locale: 'vi-VN',
  has_client_mods: false,
  browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9269 Chrome/152.0.7977.169 Electron/44.10.2 Safari/537.36',
  browser_version: '44.10.2',
  os_sdk_version: '26200',
  client_build_number: 679544,
  native_build_number: 98981,
  client_event_source: null,
  client_app_state: 'focused'
};

async function fetchWindowsClientProps() {
  if (cachedCordProps && Date.now() - cachedCordPropsAt < PROPS_CACHE_MS) {
    return { ...cachedCordProps };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://cordapi.dolfi.es/api/v2/properties/windows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': FALLBACK_CLIENT_PROPS.browser_user_agent
      },
      body: '{}',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data?.properties && typeof data.properties === 'object') {
        cachedCordProps = data.properties;
        cachedCordPropsAt = Date.now();
        return { ...cachedCordProps };
      }
    }
  } catch {}
  return { ...FALLBACK_CLIENT_PROPS };
}

function buildScienceSuperProps(baseProps, clientLaunchId, launchSignature, heartbeatSession) {
  const props = {
    ...baseProps,
    client_launch_id: clientLaunchId,
    launch_signature: launchSignature,
    client_heartbeat_session_id: heartbeatSession,
    client_app_state: 'focused'
  };
  return Buffer.from(JSON.stringify(props)).toString('base64');
}

function getUserIdFromToken(token) {
  try {
    const first = String(token || '').split('.')[0];
    if (!first) return '';
    const b64 = first.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf8').trim();
  } catch {
    return '';
  }
}

/**
 * Tạo executable_fingerprint chuẩn 146 byte (PE32+) gắn với userId theo thuật toán Discord Desktop.
 */
function buildExecutableFingerprint(userId, game) {
  if (!userId) return null;
  const seed = `${userId}:${game?.id || ''}:${game?.exe || 'game.exe'}`;
  const out = Buffer.alloc(146);
  out[0] = 1; // version
  out[1] = 3; // PE32+ (2) + signed (1)

  const fileSize = BigInt(15_000_000 + (crypto.createHash('md5').update(seed).digest().readUInt32LE(0) % 80_000_000));
  const timestamp = 1700000000 + (crypto.createHash('md5').update(seed + ':ts').digest().readUInt32LE(0) % 50_000_000);
  const sizeOfImage = 0x400000 + ((crypto.createHash('md5').update(seed + ':img').digest().readUInt32LE(0) % 0x800) * 0x1000);

  out.writeBigUInt64LE(fileSize, 2);
  out.writeUInt32LE(timestamp >>> 0, 10);
  out.writeUInt32LE(sizeOfImage >>> 0, 14);

  const headerHash = crypto.createHash('sha256').update(`${seed}:hdr`).digest();
  const machineUserHash = crypto.createHash('sha256').update(`${userId}:machine`).digest();
  const sectionHash = crypto.createHash('sha256').update(`${seed}:sec`).digest();
  const certHash = crypto.createHash('sha256').update(`${seed}:cert`).digest();

  headerHash.copy(out, 18);
  machineUserHash.copy(out, 50);
  sectionHash.copy(out, 82);
  certHash.copy(out, 114);

  const xorKey = crypto.createHash('sha256').update(`${userId}https://discord.com/careers`).digest();
  for (let i = 1; i < out.length; i++) {
    out[i] = out[i] ^ xorKey[(i - 1) & 31];
  }
  return out.toString('base64');
}

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

function buildGameSessionEvents(game, durationMs, heartbeatSession, launchSignature, executableFingerprint, seqState, staggerIndex = 0) {
  const sessionId = crypto.randomUUID();
  const staggerMs = staggerIndex * 25 * 60 * 1000;
  const now = Date.now() - staggerMs;
  let start = now - durationMs;
  if (start < 0) start = now;
  const gameId = String(game.id);
  const gameName = String(game.name || 'Game');
  const gameExe = String(game.exe || 'game.exe').replace(/^>/, '');

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

  const launchProps = {
    client_track_timestamp: now,
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
    rendered_locale: 'vi',
    launch_signature: launchSignature,
    client_rtc_state: null,
    client_app_state: 'focused',
    client_send_timestamp: now
  };
  if (executableFingerprint) {
    launchProps.executable_fingerprint = executableFingerprint;
  }

  const launchEvt = {
    type: 'launch_game',
    properties: launchProps
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

function buildRealtimeEvents(action, game, durationMs, sessionId, heartbeatSession, launchSignature, executableFingerprint, seqState) {
  const now = Date.now();
  const gameId = String(game.id);
  const gameName = String(game.name || 'Game');
  const gameExe = String(game.exe || 'game.exe').replace(/^>/, '');
  const nextSeq = () => {
    seqState.val += 1;
    return seqState.val;
  };

  if (action === 'start') {
    const initialHb = {
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
        initial_heartbeat: true,
        final_heartbeat: false,
        game_session_id: sessionId,
        duration_tracked_ms: 0,
        rtc_connection_id: null,
        media_session_id: null,
        launch_signature: launchSignature,
        client_app_state: 'focused',
        client_send_timestamp: now
      }
    };
    const launchProps = {
      client_track_timestamp: now + 50,
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
      rendered_locale: 'vi',
      launch_signature: launchSignature,
      client_rtc_state: null,
      client_app_state: 'focused',
      client_send_timestamp: now
    };
    if (executableFingerprint) launchProps.executable_fingerprint = executableFingerprint;
    return [initialHb, { type: 'launch_game', properties: launchProps }];
  }

  return [{
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
      final_heartbeat: action === 'stop',
      game_session_id: sessionId,
      duration_tracked_ms: Math.max(0, Math.round(durationMs)),
      rtc_connection_id: null,
      media_session_id: null,
      launch_signature: launchSignature,
      client_app_state: 'focused',
      client_send_timestamp: now
    }
  }];
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
    const heartbeatSession = String(body.heartbeatSession || crypto.randomUUID());
    const launchSignature = String(body.launchSignature || crypto.randomUUID());
    const clientLaunchId = String(body.clientLaunchId || crypto.randomUUID());
    const baseProps = await fetchWindowsClientProps();
    const superProps = buildScienceSuperProps(baseProps, clientLaunchId, launchSignature, heartbeatSession);

    const headers = {
      'Accept': '*/*',
      'Accept-Language': 'vi,en-US;q=0.9',
      'Authorization': token,
      'Content-Type': 'application/json',
      'Origin': 'https://discord.com',
      'Referer': 'https://discord.com/channels/@me',
      'User-Agent': baseProps.browser_user_agent || FALLBACK_CLIENT_PROPS.browser_user_agent,
      'X-Debug-Options': 'bugReporterEnabled',
      'X-Discord-Locale': 'vi',
      'X-Discord-Timezone': 'Asia/Saigon',
      'X-Super-Properties': superProps
    };
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    let analyticsToken = String(body.analyticsToken || '').trim();
    if (!analyticsToken) {
      analyticsToken = await fetchAnalyticsToken(token, headers);
    }

    const action = String(body.action || 'burst'); // 'burst' | 'start' | 'heartbeat' | 'stop'
    const userId = getUserIdFromToken(token);
    const customFingerprint = String(body.executableFingerprint || '').trim();
    const seqState = { val: Number(body.seqOffset) || 0 };
    const sessionId = String(body.sessionId || crypto.randomUUID());

    // Giới hạn tối đa 16 game/batch (48 events < BATCH_SIZE 50 của Discord Science)
    const batchGames = games.slice(0, 16);
    const events = [];
    let totalDurationMs = 0;

    if (action === 'start' || action === 'heartbeat' || action === 'stop') {
      const g = batchGames[0];
      const rtDurationMs = action === 'start'
        ? 0
        : Math.max(1000, Math.min(Number(body.durationMs) || 60000, 600000));
      totalDurationMs = rtDurationMs;
      const fp = customFingerprint || buildExecutableFingerprint(userId, g);
      events.push(...buildRealtimeEvents(action, g, rtDurationMs, sessionId, heartbeatSession, launchSignature, fp, seqState));
    } else {
      for (let idx = 0; idx < batchGames.length; idx++) {
        const g = batchGames[idx];
        const perGameMs = mode === 'games_played'
          ? (45 + Math.floor(Math.random() * 76)) * 1000 // Random 45s - 120s cho mỗi game
          : durationMs;
        totalDurationMs += perGameMs;
        const fp = customFingerprint || buildExecutableFingerprint(userId, g);
        events.push(...buildGameSessionEvents(g, perGameMs, heartbeatSession, launchSignature, fp, seqState, idx));
      }
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
        clientLaunchId,
        sessionId,
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
