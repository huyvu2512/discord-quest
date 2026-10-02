/**
 * API: QUÉT NHIỆM VỤ DISCORD ĐA NỀN TẢNG (api/quests/index.js)
 * Tự động hợp nhất dữ liệu từ:
 * 1. Desktop Client (@me active quests)
 * 2. Web Client (Quest Home Showcase / sponsored video quests)
 * 3. Excluded Quests (Nhiệm vụ tài trợ chưa enroll hoặc video)
 * 4. Claimed Quests (@me/claimed - Các nhiệm vụ đã xem xong/chờ nhận thưởng)
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
    const buildNum = await fetchLatestBuildNumber();
    const desktopHeaders = DISCORD_HEADERS(token, buildNum);
    const webHeaders = DISCORD_WEB_HEADERS(token, buildNum);

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

    // 2.2 Quét nhiệm vụ Mobile Android (@me trên ứng dụng di động Android)
    const mobilePromise = fetch('https://discord.com/api/v9/quests/@me', { headers: DISCORD_MOBILE_HEADERS(token) })
      .then(async r => {
        if (!r.ok) return { quests: [], excluded_quests: [] };
        return r.json();
      })
      .catch(() => ({ quests: [], excluded_quests: [] }));

    // 2.3 Quét nhiệm vụ Mobile iOS (@me trên ứng dụng di động iOS)
    const iosPromise = fetch('https://discord.com/api/v9/quests/@me', { headers: DISCORD_IOS_HEADERS(token) })
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

    const [desktopData, webData, mobileData, iosData, claimedData, balanceData] = await Promise.all([
      desktopPromise,
      webPromise,
      mobilePromise,
      iosPromise,
      claimedPromise,
      balancePromise
    ]);

    // Cờ bật/tắt quét quảng cáo toàn cầu (Decision Engine), nhiệm vụ bị loại trừ (Excluded) và nhiệm vụ Mobile
    // Mặc định chỉ lấy nhiệm vụ PC / Web thực tế của tài khoản (khớp chính xác với app Discord trên máy tính)
    const ENABLE_GLOBAL_DECISIONS = req.query?.includeDecisions === 'true';
    const ENABLE_EXCLUDED_QUESTS = req.query?.includeExcluded === 'true';
    const ENABLE_MOBILE_QUESTS = req.query?.includeMobile === 'true';

    let decisionResults = [];
    if (ENABLE_GLOBAL_DECISIONS) {
      const decisionPlacements = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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
            .catch(() => null),
          fetch(getDecisionsUrl, { headers: DISCORD_IOS_HEADERS(token) })
            .then(r => r.ok ? r.json() : null)
            .then(data => data ? { placement, data } : null)
            .catch(() => null)
        );
      }
      decisionResults = await Promise.all(decisionPromises);
    }

    const customIdsParam = req.query?.customIds || req.body?.customIds || [];
    const clientCustomIds = Array.isArray(customIdsParam) ? customIdsParam : (typeof customIdsParam === 'string' ? customIdsParam.split(',') : []);

    // Hợp nhất dữ liệu hoàn toàn từ API (Deduplicate Map theo Quest ID duy nhất)
    const questMap = new Map();

    const mergeQuest = (q, source) => {
      if (!q) return;
      const qid = q.id || q.quest_id;
      if (!qid) return;
      const config = q.config || q;
      const existing = questMap.get(qid);
      if (!existing) {
        questMap.set(qid, {
          id: qid,
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
        questMap.set(qid, updated);
      }
    };

    // 1. Nạp từ Desktop (@me)
    (desktopData.quests || []).forEach(q => mergeQuest(q, 'desktop_active'));
    if (ENABLE_EXCLUDED_QUESTS) (desktopData.excluded_quests || []).forEach(q => mergeQuest(q, 'desktop_excluded'));

    // 2. Nạp từ Web (Quest Home)
    (webData.quests || []).forEach(q => mergeQuest(q, 'web_active'));
    if (ENABLE_EXCLUDED_QUESTS) (webData.excluded_quests || []).forEach(q => mergeQuest(q, 'web_excluded'));

    // 3. Nạp từ Mobile (@me Android & iOS) (mặc định tắt để khớp chính xác với app Discord PC)
    if (ENABLE_MOBILE_QUESTS) {
      (mobileData.quests || []).forEach(q => mergeQuest(q, 'mobile_android_active'));
      if (ENABLE_EXCLUDED_QUESTS) (mobileData.excluded_quests || []).forEach(q => mergeQuest(q, 'mobile_android_excluded'));
      (iosData.quests || []).forEach(q => mergeQuest(q, 'mobile_ios_active'));
      if (ENABLE_EXCLUDED_QUESTS) (iosData.excluded_quests || []).forEach(q => mergeQuest(q, 'mobile_ios_excluded'));
    }

    // 4. Tự động nạp từ Discord Decision Engine (Tất cả Placements 0-10 trên Desktop, Web, Mobile)
    if (ENABLE_GLOBAL_DECISIONS) {
      decisionResults.filter(Boolean).forEach(resItem => {
        const placement = resItem.placement ?? 1;
        const decData = resItem.data;
        if (!decData) return;
        const sealed = decData.traffic_metadata_sealed || decData.quest?.traffic_metadata_sealed || null;

        // Ưu tiên quest chính từ Decision Engine. Chỉ dùng creative_content nếu decData không có trường quest
        if (decData.quest && (decData.quest.id || decData.quest.quest_id)) {
          decData.quest.traffic_metadata_sealed = decData.quest.traffic_metadata_sealed || sealed;
          if (decData.creative?.creative_content?.assets && decData.quest.config) {
            decData.quest.config.assets = decData.quest.config.assets || decData.creative.creative_content.assets;
          }
          mergeQuest(decData.quest, `decision_p${placement}`);
        } else if (decData.creative?.creative_content) {
          const cc = decData.creative.creative_content;
          const realQuestId = decData.quest_id || cc.quest_id || cc.id;
          const combined = {
            ...cc,
            id: realQuestId,
            traffic_metadata_sealed: cc.traffic_metadata_sealed || sealed
          };
          mergeQuest(combined, `decision_p${placement}`);
        }

        if (Array.isArray(decData.decisions)) {
          decData.decisions.forEach(d => {
            const questObj = d.quest || {};
            const creativeContent = d.creative?.creative_content || {};
            const trueQuestId = d.quest_id || questObj.id || questObj.quest_id || creativeContent.quest_id || creativeContent.id;
            if (!trueQuestId) return;

            const combined = {
              ...creativeContent,
              ...questObj,
              id: trueQuestId,
              config: questObj.config || creativeContent.config || creativeContent,
              user_status: questObj.user_status || d.user_status || null,
              traffic_metadata_sealed: questObj.traffic_metadata_sealed || d.traffic_metadata_sealed || sealed
            };
            mergeQuest(combined, `decision_p${placement}`);
          });
        }
      });
    }

    // 5. Nạp từ Claimed/Completed
    const claimedList = Array.isArray(claimedData) ? claimedData : (claimedData.quests || []);
    claimedList.forEach(q => mergeQuest(q, 'claimed'));

    // 6. Nạp ID người dùng chủ động dán link qua modal (nếu có)
    clientCustomIds.forEach(cid => {
      const clean = String(cid).trim().replace(/.*\/quests\//, '').replace(/\D/g, '');
      if (clean && !questMap.has(clean)) {
        questMap.set(clean, { id: clean, config: null, user_status: null, _source: 'client_custom' });
      }
    });

    // Tự động truy vấn chi tiết (hydrate) từ Discord API cho bất kỳ Quest nào chưa đủ thông tin config/tasks
    // (như các quest trả về từ excluded_quests hoặc decision creative chỉ có id)
    const incompleteIds = Array.from(questMap.entries())
      .filter(([id, item]) => {
        const cfg = item.config;
        return !cfg || !cfg.messages?.quest_name || (!cfg.task_config_v2 && !cfg.task_config);
      })
      .map(([id]) => id);

    if (incompleteIds.length > 0) {
      await Promise.all(
        incompleteIds.map(async (qid) => {
          try {
            let r = await fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: desktopHeaders });
            if (!r.ok) {
              r = await fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: webHeaders });
            }
            if (!r.ok) {
              r = await fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: DISCORD_MOBILE_HEADERS(token) });
            }
            if (!r.ok) {
              r = await fetch(`https://discord.com/api/v9/quests/${qid}`, { headers: DISCORD_IOS_HEADERS(token) });
            }
            if (r.ok) {
              const fullQuest = await r.json();
              if (fullQuest && (fullQuest.id || fullQuest.config)) {
                mergeQuest(fullQuest, 'hydrated');
              }
            }
          } catch {}
        })
      );
    }

    const rawQuests = Array.from(questMap.values());
    const orbsBalance = balanceData.balance ?? 0;

    console.log(`[API /api/quests] Đã quét ${rawQuests.length} Quest từ Discord API (desktop, web, mobile, decisions & claimed)`);

    const formattedQuests = rawQuests.map(q => {
      const config = q.config || q || {};
      const name = config.messages?.quest_name || config.application?.name || 'Nhiệm vụ Discord';

      const taskType = detectTaskType(config);
      const tasks = config.task_config_v2?.tasks ?? config.task_config?.tasks ?? {};
      const taskDef = tasks[taskType] || {};
      const targetSec = typeof taskDef.target === 'number' ? taskDef.target : (taskType.includes('VIDEO') ? 60 : 900);

      const progressVal = q.user_status?.progress?.[taskType]?.value ?? 0;
      let progSec = Math.min(targetSec, progressVal);

      let status = 'pending';
      if (q.user_status?.claimed_at) {
        status = 'claimed';
      } else if (q.user_status?.completed_at || progSec >= targetSec) {
        status = 'completed';
      } else if (q.user_status?.enrolled_at) {
        status = 'queued';
      } else if (q._source === 'claimed') {
        status = 'claimed';
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
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord')) {
        return false;
      }
      // 2. Loại bỏ các quest đã hết hạn hẳn (trừ trường hợp đã claimed có mã gift code để lưu vào kho quà)
      const isExpired = q.isExpired || (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now());
      if (isExpired && !(q.status === 'claimed' && (q.hasGiftCode || q.code))) {
        return false;
      }
      return true;
    });

    // -------------------------------------------------------------------------
    // BỘ LỌC TRÙNG LẶP THÔNG MINH (SMART DEDUPLICATION)
    // 100% dữ liệu từ Discord API nhưng loại bỏ triệt để các trường hợp trùng lặp:
    // 1. Loại bỏ các nhiệm vụ pending "bóng ma" khi người dùng ĐÃ hoàn thành / nhận thưởng trong cùng đợt
    // 2. Hợp nhất các bản ghi trùng placement/creative của cùng một chiến dịch pending
    // 3. Giữ nguyên 100% các phần thưởng khác nhau (ví dụ 2 vật phẩm khác nhau của Matchbox)
    // 4. Giữ nguyên 100% các đợt nhiệm vụ mùa mới (như Typhoeus tháng 10 vs tháng 9)
    // -------------------------------------------------------------------------

    const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

    // 1. BƯỚC 1: Tìm các quest đã claimed / completed / queued
    const activeOrDone = formattedQuests.filter(q => q.status !== 'pending');

    const isGhostPendingOf = (p, c) => {
      if (p.taskType !== c.taskType) return false;
      // Không so sánh với nhiệm vụ đã hết hạn từ quá khứ
      if (c.isExpired) return false;

      const isGame = p.taskType === 'PLAY_ON_DESKTOP' || p.taskType === 'STREAM_ON_DESKTOP' || p.taskType === 'PLAY_ACTIVITY' || p.taskType === 'ACHIEVEMENT_IN_ACTIVITY';

      // a) Nhiệm vụ chơi game (PC/Console): Trùng applicationId thực sự trong cùng đợt chiến dịch còn hạn
      if (isGame && p.applicationId && c.applicationId && p.applicationId === c.applicationId) {
        const sP = p.startsAt ? p.startsAt.slice(0, 10) : '';
        const sC = c.startsAt ? c.startsAt.slice(0, 10) : '';
        const eP = p.expiresAt ? p.expiresAt.slice(0, 10) : '';
        const eC = c.expiresAt ? c.expiresAt.slice(0, 10) : '';
        if ((sP && sP === sC) || (eP && eP === eC)) {
          return true;
        }
      }

      // b) Nhiệm vụ Video: URL video của quest c chứa ID của quest p (creative cutdown variant) hoặc cùng file video
      if (!isGame) {
        if (c.videoUrl && p.id && c.videoUrl.includes(p.id)) return true;
        if (p.videoUrl && c.id && p.videoUrl.includes(c.id)) return true;
        if (c.videoUrl && p.videoUrl && c.videoUrl === p.videoUrl) return true;
      }

      return false;
    };

    // Loại bỏ các quest pending "bóng ma" đã được làm/claim
    const validQuests = formattedQuests.filter(q => {
      if (q.status !== 'pending') return true;
      return !activeOrDone.some(c => isGhostPendingOf(q, c));
    });

    // 2. BƯỚC 2: So sánh độ ưu tiên khi hợp nhất 2 bản ghi trùng lặp
    const compareQuestPriority = (a, b) => {
      // Ưu tiên trạng thái: running (5) > queued (4) > completed (3) > claimed (2) > pending (1)
      const rank = { running: 5, queued: 4, completed: 3, claimed: 2, pending: 1 };
      const diffRank = (rank[b.status] || 0) - (rank[a.status] || 0);
      if (diffRank !== 0) return diffRank;

      // Ưu tiên tiến độ cao hơn
      const diffProg = (b.progSec || 0) - (a.progSec || 0);
      if (diffProg !== 0) return diffProg;

      // Chưa hết hạn ưu tiên hơn đã hết hạn
      if (!a.isExpired && b.isExpired) return -1;
      if (a.isExpired && !b.isExpired) return 1;

      // Ưu tiên có trafficMetadataSealed (để play video)
      if (b.trafficMetadataSealed && !a.trafficMetadataSealed) return 1;
      if (!b.trafficMetadataSealed && a.trafficMetadataSealed) return -1;

      // Ưu tiên có videoUrl
      if (b.videoUrl && !a.videoUrl) return 1;
      if (!b.videoUrl && a.videoUrl) return -1;

      // Ưu tiên ID Snowflake lớn hơn (đối tượng mới hơn từ Discord)
      return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
    };

    // 3. BƯỚC 3: Nhóm theo Campaign Key và hợp nhất
    const campaignMap = new Map();
    for (const q of validQuests) {
      const name = cleanStr(q.name);
      const taskType = String(q.taskType || '');
      const reward = cleanStr(q.reward);
      const targetSec = Number(q.targetSec) || 0;
      const sDate = q.startsAt ? q.startsAt.slice(0, 10) : '';
      const eDate = q.expiresAt ? q.expiresAt.slice(0, 10) : '';
      const appId = q.applicationId ? String(q.applicationId) : '';
      
      // Với các quest đã claim ở các mốc thời gian khác nhau (ví dụ F1 Clash các tuần trước hoặc AION 2 các đợt trước),
      // giữ lại lịch sử claim riêng biệt theo claimedAt
      const claimDate = (q.status === 'claimed' && q.claimedAt) ? q.claimedAt.slice(0, 10) : '';

      const key = `${name}#${taskType}#${reward}#${targetSec}#${appId}#${sDate}#${eDate}#${claimDate}`;

      if (!campaignMap.has(key)) {
        campaignMap.set(key, q);
      } else {
        const existing = campaignMap.get(key);
        const prio = compareQuestPriority(existing, q);
        if (prio > 0) {
          // q tốt hơn existing -> chọn q, bổ sung metadata từ existing nếu q thiếu
          const merged = {
            ...q,
            trafficMetadataSealed: q.trafficMetadataSealed || existing.trafficMetadataSealed,
            videoUrl: q.videoUrl || existing.videoUrl,
            videoThumbnail: q.videoThumbnail || existing.videoThumbnail,
            code: q.code || existing.code
          };
          campaignMap.set(key, merged);
        } else {
          // existing tốt hơn -> bổ sung metadata từ q nếu existing thiếu
          if (!existing.trafficMetadataSealed && q.trafficMetadataSealed) {
            existing.trafficMetadataSealed = q.trafficMetadataSealed;
          }
          if (!existing.videoUrl && q.videoUrl) {
            existing.videoUrl = q.videoUrl;
          }
          if (!existing.videoThumbnail && q.videoThumbnail) {
            existing.videoThumbnail = q.videoThumbnail;
          }
          if (!existing.code && q.code) {
            existing.code = q.code;
          }
        }
      }
    }

    const deduplicatedQuests = Array.from(campaignMap.values());

    // Sắp xếp danh sách trả về:
    // 1. Nhóm chưa làm (running, queued, pending) lên đầu tiên
    // 2. Nhóm đã làm xong nhưng chưa nhận thưởng (completed) xếp dưới các quest chưa làm
    // 3. Nhóm đã làm và đã nhận rồi (claimed) cho hết xuống dưới
    deduplicatedQuests.sort((a, b) => {
      const getTier = (status) => {
        if (status === 'running' || status === 'queued' || status === 'pending') return 1;
        if (status === 'completed') return 2;
        if (status === 'claimed') return 3;
        return 4;
      };

      const tierA = getTier(a.status);
      const tierB = getTier(b.status);
      if (tierA !== tierB) return tierA - tierB;

      // 1. Trong nhóm chưa làm hoặc đang làm (running, queued, pending)
      if (tierA === 1) {
        const runA = a.status === 'running' ? 0 : 1;
        const runB = b.status === 'running' ? 0 : 1;
        if (runA !== runB) return runA - runB;

        const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        if (expA !== expB) return expA - expB;

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
      }

      // 2. Trong nhóm đã làm xong nhưng chưa nhận thưởng (completed)
      if (tierA === 2) {
        const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        if (expA !== expB) return expA - expB;

        const isVideoA = a.taskType?.includes('VIDEO') ? 0 : 1;
        const isVideoB = b.taskType?.includes('VIDEO') ? 0 : 1;
        if (isVideoA !== isVideoB) return isVideoA - isVideoB;

        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      }

      // Nhóm đã làm rồi (claimed): Còn hạn xếp trên, Hết hạn tống xuống dưới cùng
      const now = Date.now();
      const isExpiredA = a.isExpired || (a.expiresAt && new Date(a.expiresAt).getTime() <= now) ? 1 : 0;
      const isExpiredB = b.isExpired || (b.expiresAt && new Date(b.expiresAt).getTime() <= now) ? 1 : 0;
      if (isExpiredA !== isExpiredB) return isExpiredA - isExpiredB;

      if (!isExpiredA) {
        const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        if (expA !== expB) return expA - expB;
      }

      const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
      const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      if (expA !== expB) return expB - expA;

      const timeA = a.claimedAt ? new Date(a.claimedAt).getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const timeB = b.claimedAt ? new Date(b.claimedAt).getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
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
