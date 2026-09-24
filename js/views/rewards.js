/**
 * VIEW: MÃ QUÀ TẶNG & GIFT CODES (js/views/rewards.js)
 */

function getRewardItems() {
  const currentAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const accName = currentAcc?.username ? `@${currentAcc.username}` : "Tài khoản";

  const map = new Map();

  // 1. Quét từ state.quests (Tất cả nhiệm vụ đã hoàn thành 100%, đã claim hoặc có code)
  (state.quests || []).forEach(q => {
    if (q.status === "claimed" || q.status === "completed" || q.code) {
      const lower = (q.name || "").toLowerCase();
      let redeemLink = q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home');
      let isDirectDecoration = false;

      if (lower.includes('roblox')) {
        redeemLink = 'https://www.roblox.com/redeem';
      } else if (lower.includes('apex')) {
        redeemLink = 'https://www.ea.com/redeem';
      } else if (lower.includes('runescape') || lower.includes('avatar') || lower.includes('decoration') || lower.includes('badge') || lower.includes('bean') || lower.includes('wolverine')) {
        isDirectDecoration = true;
      }

      map.set(q.id || q.name, {
        id: q.id,
        questName: q.name,
        account: accName,
        type: q.reward || "Phần thưởng Discord",
        code: q.code || null,
        status: q.status,
        discordUrl: q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home'),
        redeemLink: redeemLink,
        isDirectDecoration: isDirectDecoration,
        expiry: "Còn hạn dùng"
      });
    }
  });

  // 2. Gộp thêm từ state.rewards nếu có mã được lưu độc lập
  (state.rewards || []).forEach(r => {
    const key = r.id || r.code || r.questName;
    if (!map.has(key)) {
      map.set(key, {
        id: r.id,
        questName: r.questName,
        account: r.account || accName,
        type: r.type || "Gift Code",
        code: r.code || null,
        status: "claimed",
        discordUrl: r.link || "https://discord.com/quest-home",
        redeemLink: r.link || "https://discord.com/quest-home",
        isDirectDecoration: false,
        expiry: r.expiry || "Còn hạn dùng"
      });
    } else if (r.code && !map.get(key).code) {
      map.get(key).code = r.code;
    }
  });

  return Array.from(map.values());
}

window.getRewardItems = getRewardItems;

function renderRewards() {
  const tbody = document.getElementById("rewards-tbody");
  if (!tbody) return;

  const items = getRewardItems();

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Chưa có phần thưởng nào</div>
            <div class="empty-desc">Khi bạn hoặc hệ thống tự động hoàn thành nhiệm vụ, các phần thưởng và mã gift code sẽ xuất hiện tại đây kèm đường dẫn nhận quà.</div>
            <button class="btn btn-primary btn-sm" onclick="switchTabTo('runner')">Xem Tiến Độ Auto</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(r => {
    let codeCol = '';
    if (r.code) {
      codeCol = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="font-mono" style="background: rgba(87, 242, 135, 0.1); color: var(--green); border: 1px solid rgba(87, 242, 135, 0.25); padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; user-select: all;">${escapeHtml(r.code)}</span>
          <button class="btn btn-secondary btn-sm" onclick="copyCode('${escapeHtml(r.code)}')">Copy</button>
        </div>
      `;
    } else if (r.isDirectDecoration) {
      codeCol = `
        <span class="tag tag-completed" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(87, 242, 135, 0.12); color: var(--green);">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          Đã nhận vào Avatar Discord
        </span>
      `;
    } else {
      codeCol = `
        <a href="${r.discordUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;" title="Mở Discord để xem chuỗi mã Gift Code">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          <span>Xem Mã trên Discord</span>
        </a>
      `;
    }

    let actionCol = '';
    if (r.redeemLink) {
      actionCol = `
        <a href="${r.redeemLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
          <span>${r.isDirectDecoration ? 'Mở Discord' : 'Trang đổi quà'}</span>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
        </a>
      `;
    }

    return `
      <tr>
        <td style="font-weight: 600; color: #fff;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${escapeHtml(r.questName)}</span>
          </div>
        </td>
        <td class="col-hide-mobile" style="color: var(--text-sub);">${escapeHtml(r.account)}</td>
        <td class="col-hide-mobile">
          <span class="tag tag-completed" style="color: #fff; background: rgba(88, 101, 242, 0.15); border-color: rgba(88, 101, 242, 0.3);">${escapeHtml(r.type)}</span>
        </td>
        <td>${codeCol}</td>
        <td class="col-hide-mobile" style="color: var(--text-muted); font-size: 12px;">${r.expiry}</td>
        <td style="text-align: right;">${actionCol}</td>
      </tr>
    `;
  }).join("");
}

window.copyCode = function(text) {
  navigator.clipboard.writeText(text);
  toast(`Đã chép mã: ${text}`, "success");
};
