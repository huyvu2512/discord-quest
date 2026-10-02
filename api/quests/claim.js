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

    // Thử qua các nền tảng: Desktop, Web, Mobile Android, Mobile iOS
    const attempts = [
      {
        name: 'desktop',
        headers: DISCORD_HEADERS(token, buildNum),
        payload: {
          platform: null,
          location: 11,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        name: 'web',
        headers: DISCORD_WEB_HEADERS(token, buildNum),
        payload: {
          platform: null,
          location: 13,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        name: 'mobile_android',
        headers: DISCORD_MOBILE_HEADERS(token),
        payload: {
          platform: null,
          location: 11,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
      },
      {
        name: 'mobile_ios',
        headers: DISCORD_IOS_HEADERS(token),
        payload: {
          platform: null,
          location: 11,
          traffic_metadata_sealed: traffic_metadata_sealed || null
        }
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

        lastError = errJson.message || `HTTP ${discordRes.status}: ${errText.slice(0, 100)}`;
      } catch (e) {
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
