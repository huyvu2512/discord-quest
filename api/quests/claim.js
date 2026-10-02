/**
 * API: NHẬN PHẦN THƯỞNG DISCORD QUEST (api/quests/claim.js)
 * Gọi trực tiếp API nội bộ của Discord:
 * POST https://discord.com/api/v9/quests/{quest_id}/claim-reward
 * 
 * Hỗ trợ nhận:
 * 1. Orbs (tự động cộng vào số dư ví ảo)
 * 2. Avatar Decoration / Khung đại diện (cấp thẳng vào kho đồ Discord)
 * 3. Gift Code (trả về mã đổi thưởng trực tiếp)
 */

import {
  fetchLatestBuildNumber,
  DISCORD_HEADERS,
  DISCORD_WEB_HEADERS,
  DISCORD_MOBILE_HEADERS,
  DISCORD_IOS_HEADERS
} from '../discord-client.js';

function formatDiscordError(errJson, status, errText) {
  if (errJson && typeof errJson === 'object') {
    if (errJson.errors && typeof errJson.errors === 'object') {
      const details = [];
      for (const [field, fieldVal] of Object.entries(errJson.errors)) {
        if (fieldVal?._errors?.length) {
          details.push(`${field}: ${fieldVal._errors.map(e => e.message || e.code).join(', ')}`);
        }
      }
      if (details.length > 0) {
        return `${errJson.message || 'Lỗi dữ liệu'}: ${details.join('; ')}`;
      }
    }
    if (errJson.message) {
      return errJson.message;
    }
  }
  return `HTTP ${status}: ${errText.slice(0, 120)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const { token, questId, taskType, platform: reqPlatform } = body || {};
  if (!token || !questId) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc questId' });
  }

  let traffic_metadata_sealed = body.traffic_metadata_sealed || body.trafficMetadataSealed || null;

  try {
    const buildNum = await fetchLatestBuildNumber();

    // Tự động nạp traffic_metadata_sealed từ get-decisions nếu chưa có
    if (!traffic_metadata_sealed) {
      try {
        const decRes = await fetch('https://discord.com/api/v9/quests/get-decisions?placement=1&num_decisions_requested=5', {
          headers: DISCORD_WEB_HEADERS(token, buildNum)
        });
        if (decRes.ok) {
          const decData = await decRes.json();
          traffic_metadata_sealed = decData.traffic_metadata_sealed || decData.quest?.traffic_metadata_sealed || null;
        }
      } catch {}
    }

    // Xác định platform integer chuẩn của Discord:
    // 0: CROSS_PLATFORM / DESKTOP (mặc định của Discord cho game PC & quest đa nền tảng)
    // 1: XBOX
    // 2: PLAYSTATION
    // 3: SWITCH
    // 4: PC
    let targetPlatform = 0;
    if (typeof reqPlatform === 'number') {
      targetPlatform = reqPlatform;
    } else if (taskType) {
      const tt = String(taskType).toUpperCase();
      if (tt.includes('XBOX')) targetPlatform = 1;
      else if (tt.includes('PLAYSTATION')) targetPlatform = 2;
      else if (tt.includes('SWITCH')) targetPlatform = 3;
      else targetPlatform = 0; // DESKTOP / PC default
    }

    // Helper tạo payload sạch (chỉ kèm traffic_metadata_sealed nếu là string hợp lệ, không gửi null)
    const buildPayload = (platformVal, locationVal) => {
      const p = {
        location: locationVal,
        is_targeted: false
      };
      if (typeof platformVal === 'number') {
        p.platform = platformVal;
      }
      if (typeof traffic_metadata_sealed === 'string' && traffic_metadata_sealed.length > 0) {
        p.traffic_metadata_sealed = traffic_metadata_sealed;
      }
      return p;
    };

    // Danh sách các phương án gửi payload tương thích 100% với schema Discord
    const attempts = [
      // 1. Desktop tiêu chuẩn Discord client (location 11: QUEST_HOME_DESKTOP)
      {
        name: 'desktop_standard',
        headers: DISCORD_HEADERS(token, buildNum),
        payload: buildPayload(targetPlatform, 11)
      },
      // 2. Desktop Reward Modal (location 25: REWARD_MODAL - giao diện popup nhận quà)
      {
        name: 'desktop_reward_modal',
        headers: DISCORD_HEADERS(token, buildNum),
        payload: buildPayload(targetPlatform, 25)
      },
      // 3. Desktop với platform = 4 (PC explicit nếu targetPlatform = 0)
      ...(targetPlatform === 0 ? [{
        name: 'desktop_pc_platform',
        headers: DISCORD_HEADERS(token, buildNum),
        payload: buildPayload(4, 11)
      }] : []),
      // 4. Web client headers (location 13: QUEST_BAR_MOBILE / Web)
      {
        name: 'web_location_13',
        headers: DISCORD_WEB_HEADERS(token, buildNum),
        payload: buildPayload(targetPlatform, 13)
      },
      // 5. Desktop không truyền platform (chỉ truyền location & is_targeted)
      {
        name: 'desktop_no_platform',
        headers: DISCORD_HEADERS(token, buildNum),
        payload: buildPayload(undefined, 11)
      },
      // 6. Mobile Android client
      {
        name: 'mobile_android',
        headers: DISCORD_MOBILE_HEADERS(token),
        payload: buildPayload(targetPlatform, 11)
      },
      // 7. Mobile iOS client
      {
        name: 'mobile_ios',
        headers: DISCORD_IOS_HEADERS(token),
        payload: buildPayload(targetPlatform, 11)
      },
      // 8. Payload rỗng tối giản (dự phòng)
      {
        name: 'desktop_minimal',
        headers: DISCORD_HEADERS(token, buildNum),
        payload: {}
      }
    ];

    let lastError = null;
    let claimData = null;

    for (const att of attempts) {
      try {
        const discordRes = await fetch(`https://discord.com/api/v9/quests/${questId}/claim-reward`, {
          method: 'POST',
          headers: att.headers,
          body: JSON.stringify(att.payload)
        });

        if (discordRes.ok) {
          const resData = await discordRes.json().catch(() => ({}));
          claimData = resData;
          break;
        }

        const errText = await discordRes.text().catch(() => '');
        let errJson = {};
        try { errJson = JSON.parse(errText); } catch {}

        // Kiểm tra nếu Discord yêu cầu Captcha
        if (discordRes.status === 400 && (errJson.captcha_key || errJson.captcha_sitekey || errJson.fields?.captcha_key)) {
          return res.status(200).json({
            success: false,
            requireCaptcha: true,
            captchaSitekey: errJson.captcha_sitekey || null,
            error: 'Discord yêu cầu giải Captcha để nhận phần thưởng này'
          });
        }

        // Nếu đã được nhận trước đó (Already claimed)
        if (errJson.message && /already.*claimed|already.*completed/i.test(errJson.message)) {
          return res.status(200).json({
            success: true,
            alreadyClaimed: true,
            message: 'Nhiệm vụ này đã được nhận trước đó'
          });
        }

        const formattedErr = formatDiscordError(errJson, discordRes.status, errText);
        console.warn(`[API Claim] Attempt [${att.name}] thất bại (${discordRes.status}):`, formattedErr);
        lastError = formattedErr;
      } catch (e) {
        console.warn(`[API Claim] Attempt [${att.name}] lỗi kết nối:`, e.message);
        lastError = e.message;
      }
    }

    if (claimData) {
      // Tìm mã code nếu có
      let code = null;
      let claimedTier = null;
      if (claimData.code) {
        code = claimData.code;
        claimedTier = claimData.tier ?? null;
      } else if (claimData.entitlements?.items?.[0]) {
        const rew = claimData.entitlements.items[0].tenantMetadata?.questRewards?.reward;
        if (rew?.rewardCode?.code) {
          code = rew.rewardCode.code;
          claimedTier = rew.rewardCode.tier ?? null;
        }
      }

      // Nếu chưa có code mà là nhiệm vụ gift code, thử gọi /reward-code
      if (!code) {
        try {
          const codeRes = await fetch(`https://discord.com/api/v9/quests/${questId}/reward-code`, {
            headers: DISCORD_HEADERS(token, buildNum)
          });
          if (codeRes.ok) {
            const codeData = await codeRes.json().catch(() => null);
            if (codeData?.code) {
              code = codeData.code;
              claimedTier = codeData.tier ?? claimedTier;
            }
          }
        } catch {}
      }

      // Cập nhật số dư Orbs mới nhất
      let balance = null;
      try {
        const balRes = await fetch('https://discord.com/api/v9/users/@me/virtual-currency/balance', {
          headers: DISCORD_HEADERS(token, buildNum)
        });
        if (balRes.ok) {
          const balData = await balRes.json().catch(() => null);
          balance = balData?.balance ?? null;
        }
      } catch {}

      return res.status(200).json({
        success: true,
        questId,
        code,
        claimedTier,
        balance,
        claimedAt: new Date().toISOString()
      });
    }

    return res.status(400).json({
      success: false,
      error: lastError || 'Không thể nhận phần thưởng từ Discord'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
