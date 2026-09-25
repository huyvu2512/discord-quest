/**
 * API: QUÉT NHIỆM VỤ DISCORD ĐA NỀN TẢNG (api/quests/index.js)
 * Tự động hợp nhất dữ liệu từ:
 * 1. Desktop Client (@me active quests)
 * 2. Web Client (Quest Home Showcase / sponsored video quests)
 * 3. Excluded Quests (Nhiệm vụ tài trợ chưa enroll hoặc video)
 * 4. Claimed Quests (@me/claimed - Các nhiệm vụ đã xem xong/chờ nhận thưởng)
 */

const SUPER_PROPERTIES_DESKTOP = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MjE1Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MzEiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoidmktVk4iLCJjbGllbnRfYnVpbGRfbnVtYmVyIjozNzYwMDAsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9';
const SUPER_PROPERTIES_WEB = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InZpLVZOIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzOC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTM4LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiIiLCJyZWZlcnJpbmdfZG9tYWluIjoiIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM3NjAwMCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=';

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

function detectTaskType(config) {
  const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};
  // Ưu tiên Xem Video trước (nhanh, 1-2 phút) rồi mới tới Chơi Game (15 phút)
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
    case 'FOLLOW_SOCIAL': return 'Theo dõi MXH';
    case 'SHARE_CONTENT': return 'Chia sẻ nội dung';
    case 'JOIN_COMMUNITY': return 'Tham gia nhóm';
    default: return 'Nhiệm vụ Discord';
  }
}

export default async function handler(req, res) {
  let token = req.query?.token || req.headers?.authorization;
  if (!token && req.body) {
    let b = req.body;
    if (typeof b === 'string') {
      try { b = JSON.parse(b); } catch {}
    }
    token = b.token;
  }

  if (!token) {
    return res.status(400).json({ success: false, error: 'Thiếu Discord Token' });
  }

  try {
    const desktopHeaders = DISCORD_HEADERS(token);
    const webHeaders = DISCORD_WEB_HEADERS(token);

    // 1. Quét nhiệm vụ Desktop (@me)
    const desktopPromise = fetch('https://discord.com/api/v9/quests/@me', { headers: desktopHeaders })
      .then(async r => {
        if (!r.ok) {
          const txt = await r.text().catch(() => '');
          console.warn(`[API Quests Desktop] HTTP ${r.status}: ${txt.slice(0, 300)}`);
          return { quests: [], excluded_quests: [] };
        }
        return r.json();
      })
      .catch(err => {
        console.warn('[API Quests Desktop] Lỗi:', err.message);
        return { quests: [], excluded_quests: [] };
      });

    // 2. Quét nhiệm vụ Web Quest Home (Xem video đối tác, Scopely, PlayStation, v.v.)
    const webPromise = fetch('https://discord.com/api/v9/quests/@me', { headers: webHeaders })
      .then(async r => {
        if (!r.ok) {
          const txt = await r.text().catch(() => '');
          console.warn(`[API Quests Web] HTTP ${r.status}: ${txt.slice(0, 300)}`);
          return { quests: [], excluded_quests: [] };
        }
        return r.json();
      })
      .catch(err => {
        console.warn('[API Quests Web] Lỗi:', err.message);
        return { quests: [], excluded_quests: [] };
      });

    // 3. Quét nhiệm vụ đã xong / chờ nhận thưởng / mã quà
    const claimedPromise = fetch('https://discord.com/api/v9/quests/@me/claimed', { headers: desktopHeaders })
      .then(async r => (r.ok ? r.json() : { quests: [] }))
      .catch(() => ({ quests: [] }));

    // 4. Lấy số dư Orbs thật từ Discord
    const balancePromise = fetch('https://discord.com/api/v9/users/@me/virtual-currency/balance', { headers: desktopHeaders })
      .then(async r => (r.ok ? r.json() : { balance: 0 }))
      .catch(() => ({ balance: 0 }));

    const [desktopData, webData, claimedData, balanceData] = await Promise.all([
      desktopPromise,
      webPromise,
      claimedPromise,
      balancePromise
    ]);

    // Hợp nhất dữ liệu không trùng lặp (Deduplicate Map)
    const questMap = new Map();

    const mergeQuest = (q, source) => {
      if (!q || !q.id) return;
      const existing = questMap.get(q.id);
      if (!existing) {
        questMap.set(q.id, { ...q, _source: source });
      } else {
        // Cập nhật trạng thái tốt hơn nếu có
        const updated = { ...existing };
        if (q.config && !existing.config) updated.config = q.config;
        if (q.user_status) {
          updated.user_status = { ...(existing.user_status || {}), ...q.user_status };
        }
        if (source === 'claimed') updated._source = 'claimed';
        questMap.set(q.id, updated);
      }
    };

    // 1. Nạp từ Desktop (Bao gồm cả quests khả dụng và excluded_quests chờ enroll)
    (desktopData.quests || []).forEach(q => mergeQuest(q, 'desktop_active'));
    (desktopData.excluded_quests || []).forEach(q => mergeQuest(q, 'desktop_excluded'));

    // 2. Nạp từ Web (Quest Home Showcase)
    (webData.quests || []).forEach(q => mergeQuest(q, 'web_active'));
    (webData.excluded_quests || []).forEach(q => mergeQuest(q, 'web_excluded'));

    // 3. Nạp từ Claimed/Completed
    const claimedList = Array.isArray(claimedData) ? claimedData : (claimedData.quests || []);
    claimedList.forEach(q => mergeQuest(q, 'claimed'));

    const rawQuests = Array.from(questMap.values());
    const orbsBalance = balanceData.balance ?? 0;

    console.log(`[API /api/quests] Đã quét ${rawQuests.length} Quest từ Discord (bao gồm active & excluded)`);

    const formattedQuests = rawQuests.map(q => {
      const config = q.config || {};
      const name = config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord';
      const lowerName = name.toLowerCase();

      let taskType = detectTaskType(config);
      // Tự động nhận diện nhiệm vụ Xem Video dựa trên tên nhà tài trợ / video / trailer
      if (lowerName.includes('video') || lowerName.includes('trailer') || lowerName.includes('monopoly') || 
          lowerName.includes('dumb ways') || lowerName.includes('wolverine') || lowerName.includes('runescape') || 
          lowerName.includes('star wars') || lowerName.includes('phantom blade') || lowerName.includes('subnautica') || 
          lowerName.includes('backrooms') || lowerName.includes('dawnwalker') || lowerName.includes('nba 2k27')) {
        taskType = 'WATCH_VIDEO';
      }

      const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};
      const taskDef = tasks[taskType] || {};
      const targetSec = taskDef.target ?? (taskType.includes('VIDEO') ? 120 : 900);

      const progressVal = q.user_status?.progress?.[taskType]?.value ?? 0;
      let progSec = Math.min(targetSec, progressVal);

      let status = 'pending';
      if (q.user_status?.claimed_at || q._source === 'claimed') {
        status = 'claimed';
      } else if (q.user_status?.completed_at || progSec >= targetSec) {
        status = 'completed';
      } else if (q.user_status?.enrolled_at) {
        status = 'queued';
      }

      // ĐÃ XONG HOẶC ĐÃ CLAIM -> MẶC ĐỊNH LUÔN FULL 100%
      if (status === 'claimed' || status === 'completed') {
        progSec = targetSec;
      }

      // Phần thưởng
      const rewards = config.rewards_config?.rewards || [];
      let rewardLabel = 'Phần thưởng Discord';
      let code = q.user_status?.claimed_tier?.code || q.user_status?.claim_tier?.code || q.user_status?.code || null;
      if (rewards.length > 0) {
        const r0 = rewards[0];
        if (r0.orb_quantity) {
          rewardLabel = `${r0.orb_quantity} Orbs`;
        } else if (r0.messages?.name) {
          rewardLabel = r0.messages.name;
        }
      }

      // Bổ sung thông tin phần thưởng cụ thể nếu Discord không gửi chi tiết trong lịch sử claimed
      if (rewardLabel === 'Phần thưởng Discord') {
        if (lowerName.includes('monopoly')) rewardLabel = '200 Orbs';
        else if (lowerName.includes('dumb ways')) rewardLabel = 'Builder Bean Avatar Decoration';
        else if (lowerName.includes('wolverine')) rewardLabel = "Marvel's Wolverine Avatar Decoration";
        else if (lowerName.includes('runescape')) rewardLabel = 'Dragonwilds Avatar Decoration';
        else if (lowerName.includes('roblox')) rewardLabel = 'Blurple 8-Bit Wings';
        else if (lowerName.includes('apex')) rewardLabel = 'Kung Fu Coach tracker set';
        else if (lowerName.includes('star wars')) rewardLabel = 'STAR WARS Zero Item Pack';
        else if (lowerName.includes('phantom blade')) rewardLabel = 'Phantom Blade Avatar Set';
        else if (lowerName.includes('subnautica')) rewardLabel = 'Subnautica 2 Badge & Boost';
        else if (lowerName.includes('backrooms')) rewardLabel = 'Backrooms Movie Avatar Decoration';
        else if (lowerName.includes('dawnwalker')) rewardLabel = 'Dawnwalker Avatar Set';
        else if (lowerName.includes('nba')) rewardLabel = 'NBA 2K27 Content Pack';
      }

      // Nhận diện xem nhiệm vụ có tặng Gift Code / Mã quà hay không
      let hasGiftCode = false;
      if (code) {
        hasGiftCode = true;
      } else if (rewards.length > 0 && rewards.some(r => r.type === 1 || r.messages?.redemption_instructions)) {
        hasGiftCode = true;
      }

      const lowerRew = rewardLabel.toLowerCase();
      const isOrb = lowerRew.includes('orb') || rewards.some(r => r.orb_quantity > 0 || r.type === 0);
      const isAvatarDeco = lowerRew.includes('avatar') || lowerRew.includes('decoration') || 
                           lowerRew.includes('profile effect') || lowerRew.includes('badge') ||
                           lowerName.includes('albion') || lowerName.includes('dumb ways') ||
                           lowerName.includes('wolverine') || lowerName.includes('runescape') ||
                           lowerName.includes('phantom blade') || lowerName.includes('dawnwalker') ||
                           lowerName.includes('backrooms');

      if (isOrb || isAvatarDeco) {
        hasGiftCode = false;
      } else if (
        lowerRew.includes('code') || lowerRew.includes('pack') || lowerRew.includes('bundle') || 
        lowerRew.includes('tracker') || lowerRew.includes('wings') || lowerRew.includes('skin') || 
        lowerRew.includes('item') || lowerRew.includes('boost') || lowerRew.includes('dlc') ||
        lowerName.includes('roblox') || lowerName.includes('apex') || lowerName.includes('star wars') || 
        lowerName.includes('nba') || lowerName.includes('battlefield') || lowerName.includes('fortnite') ||
        lowerName.includes('genshin') || lowerName.includes('honkai') || lowerName.includes('warframe')
      ) {
        hasGiftCode = true;
      }

      const appId = taskDef.applications?.[0]?.id ?? config.application?.id;
      const expiresAt = config.expires_at || q.expires_at || config.task_config_v2?.expires_at || config.task_config?.expires_at || null;
      const isExpired = expiresAt ? (new Date(expiresAt).getTime() <= Date.now()) : false;

      return {
        id: q.id,
        name: config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord',
        publisher: config.messages?.game_title || config.messages?.game_publisher || config.application?.name || 'Discord',
        taskType: taskType,
        typeName: getTaskTypeName(taskType),
        targetSec: targetSec,
        progSec: progSec,
        reward: rewardLabel,
        code: code,
        hasGiftCode: hasGiftCode,
        status: status,
        applicationId: appId,
        enrolledAt: q.user_status?.enrolled_at || null,
        completedAt: q.user_status?.completed_at || null,
        claimedAt: q.user_status?.claimed_at || null,
        expiresAt: expiresAt,
        isExpired: isExpired,
        discordUrl: `https://discord.com/quests/${q.id}`
      };
    }).filter(q => {
      // 1. Loại bỏ các quest rác/ảo không có tên hoặc không có ứng dụng nhiệm vụ
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord') && q.status !== 'claimed' && q.status !== 'completed') {
        return false;
      }
      // 2. Loại bỏ các quest chưa làm nhưng đã hết hạn theo thời gian thực (expires_at)
      if (q.status !== 'claimed' && q.status !== 'completed') {
        if (q.isExpired) return false;
        if (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now()) return false;
      }
      return true;
    });

    return res.status(200).json({
      success: true,
      balance: orbsBalance,
      quests: formattedQuests
    });
  } catch (err) {
    console.error('Lỗi API Quests:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi tải Quest từ Discord: ' + err.message
    });
  }
}
