/**
 * API: TRA CỨU NHIỆM VỤ THEO ID / LINK (api/quests/lookup.js)
 * Cho phép tra cứu bất kỳ Quest nào (kể cả Video Quest trên Quest Home) qua ID hoặc link
 */

import {
  fetchLatestBuildNumber,
  DISCORD_HEADERS,
  DISCORD_WEB_HEADERS,
  DISCORD_MOBILE_HEADERS,
  DISCORD_IOS_HEADERS,
  detectTaskType,
  getTaskTypeName
} from '../discord-client.js';

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
    const buildNum = await fetchLatestBuildNumber();
    let r = await fetch(`https://discord.com/api/v9/quests/${cleanId}`, { headers: DISCORD_HEADERS(token, buildNum) });
    if (!r.ok) {
      r = await fetch(`https://discord.com/api/v9/quests/${cleanId}`, { headers: DISCORD_WEB_HEADERS(token, buildNum) });
    }
    if (!r.ok) {
      r = await fetch(`https://discord.com/api/v9/quests/${cleanId}`, { headers: DISCORD_MOBILE_HEADERS(token) });
    }
    if (!r.ok) {
      r = await fetch(`https://discord.com/api/v9/quests/${cleanId}`, { headers: DISCORD_IOS_HEADERS(token) });
    }
    
    if (!r.ok) {
      return res.status(r.status).json({
        success: false,
        error: `Không tìm thấy nhiệm vụ Discord (HTTP ${r.status})`
      });
    }

    const q = await r.json();
    const config = q || {};
    const name = config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord';
    const lowerName = name.toLowerCase();

    const taskType = detectTaskType(config);
    const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};
    const taskDef = tasks[taskType] || {};
    const targetSec = typeof taskDef.target === 'number' ? taskDef.target : (taskType.includes('VIDEO') ? 60 : 900);

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
