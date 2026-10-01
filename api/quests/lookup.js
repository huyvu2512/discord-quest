/**
 * API: TRA CỨU NHIỆM VỤ THEO ID / LINK (api/quests/lookup.js)
 * Cho phép tra cứu bất kỳ Quest nào (kể cả Video Quest trên Quest Home) qua ID hoặc link
 */

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

function detectTaskType(config) {
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

function getTaskTypeName(taskType) {
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
    default: return 'Nhiệm vụ Discord';
  }
}

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
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc Quest ID' });
  }

  // Làm sạch ID nếu người dùng dán toàn bộ URL discord
  const cleanId = String(questId).trim().replace(/.*\/quests\//, '').replace(/\D/g, '');
  if (!cleanId) {
    return res.status(400).json({ success: false, error: 'ID nhiệm vụ không hợp lệ' });
  }

  try {
    const headers = DISCORD_HEADERS(token);
    const r = await fetch(`https://discord.com/api/v9/quests/${cleanId}`, { headers });
    
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return res.status(r.status).json({
        success: false,
        error: `Không tìm thấy nhiệm vụ Discord (HTTP ${r.status})`
      });
    }

    const q = await r.json();
    const config = q || {};
    const name = config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord';
    const lowerName = name.toLowerCase();

    let taskType = detectTaskType(config);
    if (lowerName.includes('video') || lowerName.includes('trailer') || lowerName.includes('resonant') || lowerName.includes('puzzle')) {
      taskType = 'WATCH_VIDEO';
    }

    const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};
    const taskDef = tasks[taskType] || {};
    const targetSec = taskDef.target ?? (taskType.includes('VIDEO') ? 120 : 900);

    const progressVal = q.user_status?.progress?.[taskType]?.value ?? 0;
    const progSec = Math.min(targetSec, progressVal);

    let status = 'pending';
    if (q.user_status?.claimed_at) {
      status = 'claimed';
    } else if (q.user_status?.completed_at || progSec >= targetSec) {
      status = 'completed';
    } else if (q.user_status?.enrolled_at) {
      status = 'queued';
    }

    const rewards = config.rewards_config?.rewards || [];
    let rewardLabel = 'Phần thưởng Discord';
    if (rewards.length > 0) {
      const r0 = rewards[0];
      if (r0.orb_quantity) {
        rewardLabel = `${r0.orb_quantity} Orbs`;
      } else if (r0.messages?.name) {
        rewardLabel = r0.messages.name;
      }
    }

    const appId = taskDef.applications?.[0]?.id ?? config.application?.id;
    const expiresAt = config.expires_at || config.task_config_v2?.expires_at || null;
    const isExpired = expiresAt ? (new Date(expiresAt).getTime() <= Date.now()) : false;

    const formatted = {
      id: cleanId,
      name: name,
      publisher: config.messages?.game_title || config.messages?.game_publisher || config.application?.name || 'Discord',
      taskType: taskType,
      typeName: getTaskTypeName(taskType),
      targetSec: targetSec,
      progSec: progSec,
      reward: rewardLabel,
      code: q.user_status?.claimed_tier?.code || null,
      hasGiftCode: false,
      status: status,
      applicationId: appId,
      enrolledAt: q.user_status?.enrolled_at || null,
      completedAt: q.user_status?.completed_at || null,
      claimedAt: q.user_status?.claimed_at || null,
      expiresAt: expiresAt,
      isExpired: isExpired,
      discordUrl: `https://discord.com/quests/${cleanId}`
    };

    return res.status(200).json({
      success: true,
      quest: formatted
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
