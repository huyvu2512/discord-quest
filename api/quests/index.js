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
const SUPER_PROPERTIES_MOBILE = 'eyJvcyI6IkFuZHJvaWQiLCJicm93c2VyIjoiRGlzY29yZCBBbmRyb2lkIiwiZGV2aWNlIjoiU2Ftc3VuZyBHYWxheHkgUzI0Iiwic3lzdGVtX2xvY2FsZSI6InZpLVZOIiwiY2xpZW50X3ZlcnNpb24iOiIyMjUuMCIsInJlbGVhc2VfY2hhbm5lbCI6Imdvb2dsZVJlbGVhc2UiLCJkZXZpY2VfdmVuZG9yX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiIiwiY2xpZW50X2J1aWxkX251bWJlciI6MjI1MDAwMDAwfQ==';

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

const DISCORD_MOBILE_HEADERS = (token) => ({
  'Authorization': token.trim(),
  'User-Agent': 'Discord-Android/225000000; Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.251 Mobile Safari/537.36',
  'Accept-Language': 'vi,en-US;q=0.9',
  'X-Super-Properties': SUPER_PROPERTIES_MOBILE,
  'X-Discord-Locale': 'vi',
  'X-Discord-Timezone': 'Asia/Saigon',
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

    // 2.2 Quét nhiệm vụ Mobile (@me trên ứng dụng di động)
    const mobilePromise = fetch('https://discord.com/api/v9/quests/@me', { headers: DISCORD_MOBILE_HEADERS(token) })
      .then(async r => {
        if (!r.ok) return { quests: [], excluded_quests: [] };
        return r.json();
      })
      .catch(() => ({ quests: [], excluded_quests: [] }));

    // 3. Quét nhiệm vụ đã xong / chờ nhận thưởng / mã quà
    const claimedPromise = fetch('https://discord.com/api/v9/quests/@me/claimed', { headers: desktopHeaders })
      .then(async r => (r.ok ? r.json() : { quests: [] }))
      .catch(() => ({ quests: [] }));

    // 4. Lấy số dư Orbs thật từ Discord
    const balancePromise = fetch('https://discord.com/api/v9/users/@me/virtual-currency/balance', { headers: desktopHeaders })
      .then(async r => (r.ok ? r.json() : { balance: 0 }))
      .catch(() => ({ balance: 0 }));

    const [desktopData, webData, mobileData, claimedData, balanceData] = await Promise.all([
      desktopPromise,
      webPromise,
      mobilePromise,
      claimedPromise,
      balancePromise
    ]);

    // 5. Tự động quét nhiệm vụ Video / Promo tài trợ qua Discord Decision Engine (Placements 0 -> 6)
    // Quét trên cả Desktop, Web và Mobile để không bỏ sót Take-Two Empires & Puzzles và các nhà tài trợ khác
    const decisionPlacements = [0, 1, 2, 3, 4, 5, 6];
    const decisionPromises = [];
    for (const placement of decisionPlacements) {
      const getDecisionsUrl = `https://discord.com/api/v9/quests/get-decisions?placement=${placement}&num_decisions_requested=15`;
      decisionPromises.push(
        fetch(getDecisionsUrl, { headers: desktopHeaders })
          .then(r => r.ok ? r.json() : null)
          .then(data => data ? { placement, data } : null)
          .catch(() => null),
        fetch(getDecisionsUrl, { headers: webHeaders })
          .then(r => r.ok ? r.json() : null)
          .then(data => data ? { placement, data } : null)
          .catch(() => null),
        fetch(getDecisionsUrl, { headers: DISCORD_MOBILE_HEADERS(token) })
          .then(r => r.ok ? r.json() : null)
          .then(data => data ? { placement, data } : null)
          .catch(() => null)
      );
    }

    // Hỗ trợ danh mục Video Promo đang mở của Discord (Empires & Puzzles, March of Giants, CONTROL Resonant...) + customIds
    const activeVideoPromoPool = [
      '1554245382601580687', // Empires & Puzzles: Match-3 Fantasy RPG (44s, Take-Two, 200 Orbs - WATCH_VIDEO_ON_MOBILE)
      '1552897885883072582', // March of Giants Trailer (134s)
      '1552763854692290630'  // CONTROL Resonant (18s)
    ];

    const customIdsParam = req.query?.customIds || req.body?.customIds || [];
    const clientCustomIds = Array.isArray(customIdsParam) ? customIdsParam : (typeof customIdsParam === 'string' ? customIdsParam.split(',') : []);
    const promoIdsToScan = Array.from(new Set([...activeVideoPromoPool, ...clientCustomIds])).filter(Boolean);

    const customPromises = promoIdsToScan.map(qid =>
      fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: desktopHeaders })
        .then(async r => {
          if (!r.ok) {
            // Thử lại với web headers hoặc mobile headers nếu desktop không trả về
            const rWeb = await fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: webHeaders });
            if (rWeb.ok) {
              const qDataWeb = await rWeb.json();
              return { id: qid, config: qDataWeb, user_status: qDataWeb.user_status, _source: 'video_promo' };
            }
            const rMob = await fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: DISCORD_MOBILE_HEADERS(token) });
            if (rMob.ok) {
              const qDataMob = await rMob.json();
              return { id: qid, config: qDataMob, user_status: qDataMob.user_status, _source: 'video_promo' };
            }
            return null;
          }
          const qData = await r.json();
          return { id: qid, config: qData, user_status: qData.user_status, _source: 'video_promo' };
        })
        .catch(() => null)
    );

    const [decisionResults, customPromos] = await Promise.all([
      Promise.all(decisionPromises),
      Promise.all(customPromises)
    ]);

    // Hợp nhất dữ liệu không trùng lặp (Deduplicate Map theo Quest ID duy nhất)
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
    (desktopData.excluded_quests || []).forEach(q => mergeQuest(q, 'desktop_excluded'));

    // 2. Nạp từ Web (Quest Home)
    (webData.quests || []).forEach(q => mergeQuest(q, 'web_active'));
    (webData.excluded_quests || []).forEach(q => mergeQuest(q, 'web_excluded'));

    // 2.2 Nạp từ Mobile (@me Android/iOS)
    (mobileData.quests || []).forEach(q => mergeQuest(q, 'mobile_active'));
    (mobileData.excluded_quests || []).forEach(q => mergeQuest(q, 'mobile_excluded'));

    // 3. Tự động nạp từ Discord Decision Engine (Tất cả Placements 0-6 trên Desktop, Web, Mobile)
    decisionResults.filter(Boolean).forEach(resItem => {
      const placement = resItem.placement ?? 1;
      const decData = resItem.data;
      if (!decData) return;
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
          const q = d.quest || d.creative?.creative_content || d.creative;
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
      const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};

      // Tự động nhận diện nhiệm vụ Xem Video dựa trên từ khóa video/trailer thực tế nếu chưa có task cụ thể
      const hasDefinedTask = Boolean(config.task_config_v2?.tasks || config.task_config?.tasks);
      if (!hasDefinedTask || taskType === 'PLAY_ON_DESKTOP') {
        if (tasks['WATCH_VIDEO_ON_MOBILE'] || lowerName.includes('puzzle') || lowerName.includes('empires')) {
          taskType = 'WATCH_VIDEO_ON_MOBILE';
        } else if (tasks['WATCH_VIDEO'] || lowerName.includes('video') || lowerName.includes('trailer') || lowerName.includes('march of giants') || lowerName.includes('control resonant') || lowerName.includes('take-two')) {
          taskType = 'WATCH_VIDEO';
        }
      }

      const taskDef = tasks[taskType] || {};
      const targetSec = taskDef.target ?? ((lowerName.includes('puzzle') || lowerName.includes('empires')) ? 44 : (taskType.includes('VIDEO') ? 120 : 900));

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

      // Nhận diện loại phần thưởng 100% dựa trên cấu trúc dữ liệu chuẩn của Discord API
      const lowerRew = rewardLabel.toLowerCase();

      // 1. Orbs: Kiểm tra thuộc tính orb_quantity, type = 0/4 của Discord hoặc tên có chứa "Orb"
      const isOrb = rewards.some(r => (r.orb_quantity != null && r.orb_quantity > 0) || r.type === 0 || r.type === 4) || lowerRew.includes('orb');

      // 2. Discord Collectibles (Avatar Decoration / Profile Effect / Badges):
      // Thuộc tính chuẩn của Discord: type === 3, có sku_id (SKU trong Discord Store), hoặc tên vật phẩm trang trí
      const isAvatarDeco = rewards.some(r => r.type === 3 || Boolean(r.sku_id)) || 
                           /avatar|decoration|profile effect|collectible|badge|khung đại diện/i.test(lowerRew);

      // 3. Gift Code / Mã đổi thưởng từ game đối tác bên thứ 3:
      // Tự động nhận diện động 100% cho mọi game hiện tại và tương lai nếu:
      // - Đã có chuỗi mã code trả về từ Discord
      // - Hoặc reward type là mã đổi thưởng (type === 1 hoặc 2) hoặc có hướng dẫn nhập mã (redemption_instructions)
      // - Hoặc tên quà chứa các từ khóa mã quà phổ biến (code, pack, bundle, item, skin, tracker, boost, key, dlc...)
      let hasGiftCode = false;
      if (isOrb || isAvatarDeco) {
        hasGiftCode = false;
      } else if (
        Boolean(code) ||
        rewards.some(r => r.type === 1 || r.type === 2 || Boolean(r.messages?.redemption_instructions) || Boolean(r.messages?.redemption_instructions_by_platform)) ||
        /code|gift|pack|bundle|tracker|wings|skin|item|boost|dlc|key|set|trang phục|vật phẩm/i.test(lowerRew)
      ) {
        hasGiftCode = true;
      }

      const startsAt = config.starts_at || q.starts_at || null;
      const appId = taskDef.applications?.[0]?.id ?? config.application?.id;
      const expiresAt = config.expires_at || q.expires_at || config.task_config_v2?.expires_at || config.task_config?.expires_at || null;
      const isExpired = expiresAt ? (new Date(expiresAt).getTime() <= Date.now()) : false;

      // URL Video stream trực tiếp từ CDN Discord cho nhiệm vụ xem video
      const videoAsset = taskDef.assets?.video?.url || taskDef.assets?.video_low_res?.url || null;
      const videoUrl = videoAsset ? `https://cdn.discordapp.com/${videoAsset}` : null;
      const videoThumbnail = taskDef.assets?.video?.thumbnail ? `https://cdn.discordapp.com/${taskDef.assets.video.thumbnail}` : null;

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
        discordUrl: `https://discord.com/quests/${q.id}`,
        videoUrl: videoUrl,
        videoThumbnail: videoThumbnail
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

    // Loại bỏ trùng lặp chuẩn xác theo Quest ID (Snowflake duy nhất của Discord)
    // Giữ nguyên vẹn tất cả quest có ID khác nhau (bao gồm các đợt nhiệm vụ mới/lặp lại mùa như Typhoeus)
    const seenIds = new Set();
    const deduplicatedQuests = [];
    for (const q of formattedQuests) {
      if (!q.id || seenIds.has(q.id)) continue;
      seenIds.add(q.id);
      deduplicatedQuests.push(q);
    }

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
