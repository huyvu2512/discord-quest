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

    // 5. Tự động quét nhiệm vụ Video / Promo tài trợ qua Discord Decision Engine (Placements 1 & 0)
    const decisionPlacements = [1, 0];
    const decisionPromises = decisionPlacements.map(placement => {
      const getDecisionsUrl = `https://discord.com/api/v9/quests/get-decisions?placement=${placement}&num_decisions_requested=10`;
      return fetch(getDecisionsUrl, { headers: desktopHeaders })
        .then(async r => {
          if (r.ok) return r.json();
          const rWeb = await fetch(getDecisionsUrl, { headers: webHeaders });
          if (rWeb.ok) return rWeb.json();
          return null;
        })
        .catch(() => null);
    });

    // Hỗ trợ danh mục Video Promo đang mở của Discord (March of Giants, CONTROL Resonant...) + customIds
    const activeVideoPromoPool = [
      '1552897885883072582', // March of Giants Trailer (134s)
      '1552763854692290630'  // CONTROL Resonant (18s)
    ];

    const customIdsParam = req.query?.customIds || req.body?.customIds || [];
    const clientCustomIds = Array.isArray(customIdsParam) ? customIdsParam : (typeof customIdsParam === 'string' ? customIdsParam.split(',') : []);
    const promoIdsToScan = Array.from(new Set([...activeVideoPromoPool, ...clientCustomIds])).filter(Boolean);

    const customPromises = promoIdsToScan.map(qid =>
      fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: desktopHeaders })
        .then(async r => {
          if (!r.ok) return null;
          const qData = await r.json();
          return { id: qid, config: qData, user_status: qData.user_status, _source: 'video_promo' };
        })
        .catch(() => null)
    );

    const [decisionResults, customPromos] = await Promise.all([
      Promise.all(decisionPromises),
      Promise.all(customPromises)
    ]);

    // Hợp nhất dữ liệu không trùng lặp (Deduplicate Map)
    const questMap = new Map();

    const mergeQuest = (q, source) => {
      if (!q || !q.id) return;
      const config = q.config || q;
      const existing = questMap.get(q.id);
      if (!existing) {
        questMap.set(q.id, {
          id: q.id,
          config: config,
          user_status: q.user_status || null,
          traffic_metadata_sealed: q.traffic_metadata_sealed || config.traffic_metadata_sealed || null,
          _source: source
        });
      } else {
        const updated = { ...existing };
        // Bổ sung config nếu trước đó chưa có hoặc thiếu
        if (!updated.config || !updated.config.messages) {
          if (config && config.messages) updated.config = config;
        } else if (config && config.messages && !updated.config.task_config_v2) {
          updated.config = { ...config, ...updated.config };
        }
        // Cập nhật user_status nếu có
        if (q.user_status) {
          updated.user_status = { ...(existing.user_status || {}), ...q.user_status };
        }
        if (q.traffic_metadata_sealed || config.traffic_metadata_sealed) {
          updated.traffic_metadata_sealed = q.traffic_metadata_sealed || config.traffic_metadata_sealed;
        }
        if (source === 'claimed') updated._source = 'claimed';
        questMap.set(q.id, updated);
      }
    };

    // 1. Nạp từ Desktop (@me)
    (desktopData.quests || []).forEach(q => mergeQuest(q, 'desktop_active'));

    // 2. Nạp từ Web (Quest Home)
    (webData.quests || []).forEach(q => mergeQuest(q, 'web_active'));

    // 3. Tự động nạp từ Discord Decision Engine (Video Quests tài trợ như CONTROL Resonant, March of Giants)
    decisionResults.filter(Boolean).forEach((decData, idx) => {
      const placement = decisionPlacements[idx] ?? 1;
      const sealed = decData.traffic_metadata_sealed || decData.quest?.traffic_metadata_sealed || null;
      if (decData.quest && decData.quest.id) {
        decData.quest.traffic_metadata_sealed = decData.quest.traffic_metadata_sealed || sealed;
        mergeQuest(decData.quest, `decision_p${placement}`);
      }
      if (decData.creative?.creative_content && decData.creative.creative_content.id) {
        decData.creative.creative_content.traffic_metadata_sealed = decData.creative.creative_content.traffic_metadata_sealed || sealed;
        mergeQuest(decData.creative.creative_content, `decision_p${placement}`);
      }
      if (Array.isArray(decData.decisions)) {
        decData.decisions.forEach(d => {
          const q = d.quest || d.creative?.creative_content;
          if (q && q.id) {
            q.traffic_metadata_sealed = q.traffic_metadata_sealed || d.traffic_metadata_sealed || sealed;
            mergeQuest(q, `decision_p${placement}`);
          }
        });
      }
    });

    // 4. Nạp từ Video Promo Pool + Custom IDs
    customPromos.filter(Boolean).forEach(q => mergeQuest(q, 'video_promo'));

    // 5. Nạp từ Claimed/Completed
    const claimedList = Array.isArray(claimedData) ? claimedData : (claimedData.quests || []);
    claimedList.forEach(q => mergeQuest(q, 'claimed'));

    const rawQuests = Array.from(questMap.values());
    const orbsBalance = balanceData.balance ?? 0;

    console.log(`[API /api/quests] Đã quét ${rawQuests.length} Quest từ Discord (active, promo & claimed)`);

    const formattedQuests = rawQuests.map(q => {
      const config = q.config || q || {};
      const name = config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord';
      const lowerName = name.toLowerCase();

      let taskType = detectTaskType(config);
      // Tự động nhận diện nhiệm vụ Xem Video dựa trên từ khóa video/trailer thực tế nếu chưa có task cụ thể
      const hasDefinedTask = Boolean(config.task_config_v2?.tasks || config.task_config?.tasks);
      if (!hasDefinedTask || taskType === 'PLAY_ON_DESKTOP') {
        if (lowerName.includes('video') || lowerName.includes('trailer') || lowerName.includes('march of giants') || lowerName.includes('control resonant')) {
          taskType = 'WATCH_VIDEO';
        }
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

      const startsAt = config.starts_at || q.starts_at || null;
      const appId = taskDef.applications?.[0]?.id ?? config.application?.id;
      const expiresAt = config.expires_at || q.expires_at || config.task_config_v2?.expires_at || config.task_config?.expires_at || null;
      const isExpired = expiresAt ? (new Date(expiresAt).getTime() <= Date.now()) : false;

      return {
        id: q.id,
        name: config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord',
        publisher: config.messages?.game_title || config.messages?.game_publisher || config.application?.name || 'Discord',
        taskType: taskType,
        typeName: getTaskTypeName(taskType),
        applicationId: appId,
        targetSec: targetSec,
        progSec: progSec,
        reward: rewardLabel,
        code: code,
        hasGiftCode: hasGiftCode,
        status: status,
        enrolledAt: q.user_status?.enrolled_at || null,
        completedAt: q.user_status?.completed_at || null,
        claimedAt: q.user_status?.claimed_at || null,
        startsAt: startsAt,
        expiresAt: expiresAt,
        isExpired: isExpired,
        trafficMetadataSealed: q.traffic_metadata_sealed || config.traffic_metadata_sealed || null,
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

    // Loại bỏ trùng lặp triệt để theo Tên game + ApplicationId
    const seenKeys = new Map();
    for (const q of formattedQuests) {
      const key = `${(q.name || '').trim().toLowerCase()}_${q.applicationId || ''}`;
      if (!seenKeys.has(key)) {
        seenKeys.set(key, q);
      } else {
        const existing = seenKeys.get(key);
        // Ưu tiên bản có trạng thái cao hơn (running > queued > completed > claimed > pending) hoặc có tiến trình
        const statusScore = (s) => (s === 'running' ? 4 : (s === 'queued' ? 3 : (s === 'completed' ? 2 : (s === 'claimed' ? 1 : 0))));
        if (statusScore(q.status) > statusScore(existing.status) || q.progSec > existing.progSec) {
          seenKeys.set(key, q);
        }
      }
    }
    const deduplicatedQuests = Array.from(seenKeys.values());

    // Sắp xếp danh sách trả về một cách ổn định, đồng bộ (deterministic sort)
    deduplicatedQuests.sort((a, b) => {
      const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
      const statusDiff = (order[a.status] || 99) - (order[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;

      const isVideoA = a.taskType?.includes('VIDEO') ? 0 : 1;
      const isVideoB = b.taskType?.includes('VIDEO') ? 0 : 1;
      if (isVideoA !== isVideoB) return isVideoA - isVideoB;

      if (isVideoA === 0 && (a.targetSec !== b.targetSec)) {
        return (a.targetSec || 0) - (b.targetSec || 0);
      }

      const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;

      return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
    });

    // Tự động lấy Gift Code thật từ Discord (/reward-code) cho các quest đã claimed có mã quà
    const claimedGiftQuests = deduplicatedQuests.filter(q => q.status === 'claimed' && q.hasGiftCode && !q.code);
    if (claimedGiftQuests.length > 0) {
      await Promise.allSettled(
        claimedGiftQuests.slice(0, 10).map(async q => {
          try {
            const codeRes = await fetch(`https://discord.com/api/v9/quests/${q.id}/reward-code`, {
              headers: desktopHeaders
            });
            if (codeRes.ok) {
              const codeData = await codeRes.json();
              if (codeData?.code) {
                q.code = codeData.code;
                if (codeData.tier != null) q.claimedTier = codeData.tier;
              }
            }
          } catch (e) {
            // Ignore fetch error silently
          }
        })
      );
    }

    // Sau khi quét /reward-code: nếu nhiệm vụ đã claimed mà Discord không trả về mã code (hoặc đợt phát quà đã kết thúc),
    // đánh dấu hasGiftCode = false để loại bỏ nhiệm vụ rác không khả dụng
    deduplicatedQuests.forEach(q => {
      if (q.status === 'claimed' && !q.code) {
        q.hasGiftCode = false;
      }
    });

    return res.status(200).json({
      success: true,
      version: 'v2-dynamic-decision',
      balance: orbsBalance,
      quests: deduplicatedQuests
    });
  } catch (err) {
    console.error('Lỗi API Quests:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi tải Quest từ Discord: ' + err.message
    });
  }
}
