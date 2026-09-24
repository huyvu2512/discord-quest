/**
 * VIEW: MÃ QUÀ TẶNG & GIFT CODES (js/views/rewards.js)
 * Tự động lọc CHỈ NHỮNG NHIỆM VỤ CÓ MÃ GIFT CODE (Roblox, Apex, Star Wars, NBA 2K, Battlefield, v.v.)
 * Loại trừ tuyệt đối Orbs và Discord Avatar Decorations / Profile Effects.
 * Hiển thị cả nhiệm vụ chưa làm để người dùng bấm nút "Chạy" trực tiếp.
 */

function isGiftCodeQuest(q) {
  if (!q) return false;
  if (q.code) return true; // Đã nhận chuỗi mã quà
  if (q.hasGiftCode === true) return true;

  const lowerName = (q.name || q.questName || "").toLowerCase();
  const lowerRew = (q.reward || q.type || "").toLowerCase();

  // 1. Loại trừ tuyệt đối Orbs (cộng trực tiếp vào ví Discord, không có mã)
  if (lowerRew.includes('orb') || lowerRew.includes('orbs')) return false;

  // 2. Loại trừ tuyệt đối Discord Avatar / Profile Effects / Badges (nhận thẳng vào avatar Discord)
  if (
    lowerRew.includes('avatar') || lowerRew.includes('decoration') || 
    lowerRew.includes('profile effect') || lowerRew.includes('badge') ||
    lowerName.includes('albion') || lowerName.includes('dumb ways') || 
    lowerName.includes('wolverine') || lowerName.includes('runescape') ||
    lowerName.includes('phantom blade') || lowerName.includes('dawnwalker') ||
    lowerName.includes('backrooms')
  ) {
    return false;
  }

  // 3. Nhận diện các nhiệm vụ game bên thứ 3 có mã quà tặng / Gift Code
  if (
    lowerRew.includes('code') || lowerRew.includes('pack') || lowerRew.includes('bundle') ||
    lowerRew.includes('tracker') || lowerRew.includes('wings') || lowerRew.includes('skin') ||
    lowerRew.includes('item') || lowerRew.includes('boost') || lowerRew.includes('dlc') ||
    lowerName.includes('roblox') || lowerName.includes('apex') || lowerName.includes('star wars') ||
    lowerName.includes('nba') || lowerName.includes('battlefield') || lowerName.includes('fortnite') ||
    lowerName.includes('genshin') || lowerName.includes('honkai') || lowerName.includes('warframe')
  ) {
    return true;
  }

  return false;
}

function getRedeemUrl(quest) {
  const lower = ((quest.name || quest.questName || "") + " " + (quest.reward || quest.type || "")).toLowerCase();
  if (lower.includes('roblox')) return 'https://www.roblox.com/redeem';
  if (lower.includes('apex') || lower.includes('battlefield') || lower.includes('star wars')) return 'https://www.ea.com/redeem';
  if (lower.includes('genshin')) return 'https://genshin.hoyoverse.com/en/gift';
  if (lower.includes('honkai')) return 'https://hsr.hoyoverse.com/gift';
  if (lower.includes('fortnite')) return 'https://www.fortnite.com/redeem';
  if (lower.includes('warframe')) return 'https://www.warframe.com/promocode';
  if (lower.includes('nba')) return 'https://www.nba2k.com/redeem';
  return quest.discordUrl || (quest.id ? `https://discord.com/quests/${quest.id}` : 'https://discord.com/quest-home');
}

function getRewardItems() {
  const currentAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const accName = currentAcc?.username ? `@${currentAcc.username}` : "Tài khoản";

  const map = new Map();

  // 1. Quét từ state.quests:
  // Lấy TẤT CẢ các nhiệm vụ có mã quà (Gift Code) - kể cả ĐÃ XONG hay CHƯA LÀM
  (state.quests || []).forEach(q => {
    if (isGiftCodeQuest(q)) {
      const redeemLink = getRedeemUrl(q);
      const isDone = q.status === "completed" || q.status === "claimed";
      const targetSec = q.targetSec || 900;
      const progSec = isDone ? targetSec : (q.progSec || 0);
      const pct = isDone ? 100 : Math.min(100, Math.round((progSec / targetSec) * 100));

      map.set(q.id || q.name, {
        id: q.id,
        questName: q.name,
        account: accName,
        type: q.reward || "Gift Code",
        code: q.code || null,
        status: q.status || "pending",
        progSec: progSec,
        targetSec: targetSec,
        pct: pct,
        discordUrl: q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home'),
        redeemLink: redeemLink,
        expiry: "Còn hạn dùng"
      });
    }
  });

  // 2. Gộp thêm từ state.rewards nếu có mã được lưu thủ công (chỉ lấy mã hợp lệ)
  (state.rewards || []).forEach(r => {
    const key = r.id || r.code || r.questName;
    if (isGiftCodeQuest(r)) {
      if (!map.has(key)) {
        map.set(key, {
          id: r.id,
          questName: r.questName,
          account: r.account || accName,
          type: r.type || "Gift Code",
          code: r.code || null,
          status: "claimed",
          pct: 100,
          discordUrl: r.link || "https://discord.com/quest-home",
          redeemLink: r.link || "https://discord.com/quest-home",
          expiry: r.expiry || "Còn hạn dùng"
        });
      } else if (r.code && !map.get(key).code) {
        map.get(key).code = r.code;
      }
    }
  });

  // Sắp xếp: Đang chạy -> Trong hàng đợi -> Chưa chạy -> Hoàn thành (chờ nhận) -> Đã nhận mã
  const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
  return Array.from(map.values()).sort((a, b) => {
    return (order[a.status] || 99) - (order[b.status] || 99);
  });
}

window.getRewardItems = getRewardItems;
window.isGiftCodeQuest = isGiftCodeQuest;

function renderRewards() {
  const tbody = document.getElementById("rewards-tbody");
  if (!tbody) return;

  const items = getRewardItems();

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Chưa có nhiệm vụ có mã quà</div>
            <div class="empty-desc">Khi tài khoản có nhiệm vụ tặng Gift Code (Roblox, Apex, Star Wars, NBA...), nhiệm vụ sẽ xuất hiện tại đây để bạn bấm Chạy và lấy mã đổi thưởng.</div>
            <button class="btn btn-primary btn-sm" onclick="syncQuestsFromDiscord(true)">Quét Nhiệm Vụ Ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(r => {
    let codeCol = '';
    let statusCol = '';
    let actionCol = '';

    if (r.status === 'running') {
      statusCol = `<span class="tag tag-running">● Đang chạy</span>`;
      codeCol = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="color: var(--yellow); font-size: 12px; font-weight: 500;">Đang cày (${r.pct}%)</span>
        </div>
      `;
      actionCol = `
        <button class="btn btn-secondary btn-sm" onclick="pauseQuest('${r.id}')">Tạm dừng</button>
      `;
    } else if (r.status === 'queued') {
      statusCol = `<span class="tag tag-pending">Trong hàng đợi</span>`;
      codeCol = `<span style="color: var(--text-muted); font-size: 12px;">Chờ đến lượt chạy</span>`;
      actionCol = `
        <button class="btn btn-secondary btn-run btn-sm" onclick="startQuest('${r.id}')">Chạy</button>
      `;
    } else if (r.status === 'pending') {
      statusCol = `<span class="tag tag-pending">Chưa làm</span>`;
      codeCol = `<span style="color: var(--text-muted); font-size: 12px;">Chưa hoàn thành</span>`;
      actionCol = `
        <button class="btn btn-primary btn-sm" onclick="startQuest('${r.id}')">Chạy</button>
      `;
    } else if (r.status === 'completed') {
      statusCol = `<span class="tag tag-completed">Chờ lấy mã</span>`;
      codeCol = `
        <a href="${r.discordUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;" title="Mở Discord để lấy mã Gift Code">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          <span>Lấy Mã trên Discord</span>
        </a>
      `;
      actionCol = `
        <a href="${r.redeemLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
          <span>Trang đổi quà</span>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
        </a>
      `;
    } else {
      // claimed
      statusCol = `<span class="tag tag-claimed">Đã nhận mã</span>`;
      if (r.code) {
        codeCol = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="font-mono" style="background: rgba(87, 242, 135, 0.1); color: var(--green); border: 1px solid rgba(87, 242, 135, 0.25); padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; user-select: all;">${escapeHtml(r.code)}</span>
            <button class="btn btn-secondary btn-sm" onclick="copyCode('${escapeHtml(r.code)}')">Copy</button>
          </div>
        `;
      } else {
        codeCol = `
          <a href="${r.discordUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;" title="Mở Discord để xem chuỗi mã Gift Code">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            <span>Xem Mã trên Discord</span>
          </a>
        `;
      }
      actionCol = `
        <a href="${r.redeemLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
          <span>Trang đổi quà</span>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
        </a>
      `;
    }

    return `
      <tr>
        <td style="font-weight: 600; color: #fff;">
          <div class="quest-name-cell" title="${escapeHtml(r.questName)}">${escapeHtml(r.questName)}</div>
        </td>
        <td class="col-hide-mobile" style="color: var(--text-sub);">${escapeHtml(r.account)}</td>
        <td class="col-hide-mobile">
          <span class="tag tag-completed" style="color: #fff; background: rgba(88, 101, 242, 0.15); border-color: rgba(88, 101, 242, 0.3);">${escapeHtml(r.type)}</span>
        </td>
        <td>${codeCol}</td>
        <td class="col-hide-mobile">${statusCol}</td>
        <td style="text-align: right; white-space: nowrap;">${actionCol}</td>
      </tr>
    `;
  }).join("");
}

window.copyCode = function(text) {
  navigator.clipboard.writeText(text);
  toast(`Đã chép mã: ${text}`, "success");
};
