/**
 * VIEW: QUẢN LÝ TÀI KHOẢN (js/views/accounts.js)
 */

function renderAccounts() {
  const tbody = document.getElementById("accounts-tbody");
  if (!tbody) return;

  if (state.accounts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Chưa có tài khoản Discord nào</div>
            <div class="empty-desc">Bạn cần thêm và xác thực ít nhất 1 Token tài khoản Discord để mở khóa các mục Tiến độ, Quests và Quà tặng.</div>
            <button class="btn btn-primary btn-sm col-hide-mobile" onclick="document.getElementById('modal-add-account').classList.add('open')">+ Thêm & Check Token Ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.accounts.map(a => {
    const isCur = a.id === state.activeAccId;
    const avatarHtml = a.avatar
      ? `<img src="${escapeHtml(a.avatar)}" alt="" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-right: 8px;">`
      : `<span class="acc-avatar-sm" style="width: 24px; height: 24px; display: inline-flex; font-size: 10px; margin-right: 8px; flex-shrink: 0;">${escapeHtml(a.username.slice(0, 2).toUpperCase())}</span>`;

    const totalQuests = isCur ? state.quests.length : (a.totalQuests || 0);
    const doneQuests = isCur 
      ? state.quests.filter(q => q.status === "completed" || q.status === "claimed").length 
      : (a.completedCount || 0);
    const remainingQuests = Math.max(0, totalQuests - doneQuests);

    let questBadgeHtml = '';
    if (totalQuests === 0) {
      questBadgeHtml = `<span class="tag tag-pending font-mono"><span class="txt-desktop">0/0 nhiệm vụ</span><span class="txt-mobile">0/0</span></span>`;
    } else if (remainingQuests === 0) {
      questBadgeHtml = `<span class="tag tag-claimed font-mono" style="font-weight: 600;"><span class="txt-desktop">Còn 0/${totalQuests} nhiệm vụ</span><span class="txt-mobile">0/${totalQuests}</span></span>`;
    } else {
      questBadgeHtml = `<span class="tag tag-running font-mono" style="font-weight: 600;"><span class="txt-desktop">Còn ${remainingQuests}/${totalQuests} nhiệm vụ</span><span class="txt-mobile">${remainingQuests}/${totalQuests}</span></span>`;
    }

    return `
      <tr>
        <td>
          <div class="acc-user-cell">
            ${avatarHtml}
            <div class="acc-name-wrap">
              <div class="acc-name-text" title="${escapeHtml(a.username)}">${escapeHtml(a.username)}</div>
              ${a.tag ? `<div class="acc-sub-text" title="${escapeHtml(a.tag)}">@${escapeHtml(a.tag.replace(/^@/, ''))}</div>` : ''}
            </div>
          </div>
        </td>
        <td>${questBadgeHtml}</td>
        <td class="font-mono text-nowrap" style="color: var(--amber); white-space: nowrap;">${(a.orbs || 0).toLocaleString()} Orbs</td>
        <td class="col-hide-mobile">${doneQuests} quest</td>
        <td class="col-hide-mobile font-mono" style="font-size: 11px; color: var(--text-muted);">${escapeHtml(a.token.slice(0, 14))}...</td>
        <td style="text-align: right; white-space: nowrap;">
          <div class="acc-actions-wrap">
            ${isCur ? `
              <button class="btn btn-primary btn-sm col-hide-mobile" disabled style="opacity: 0.85; cursor: default;">Đang chọn</button>
              <button class="btn btn-secondary btn-sm" onclick="logoutAcc('${a.id}')">Đăng xuất</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="selectAcc('${a.id}')">Chọn</button>
              <button class="btn btn-secondary btn-sm col-hide-mobile" onclick="logoutAcc('${a.id}')">Đăng xuất</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

window.selectAcc = function(id) {
  state.activeAccId = id;
  saveState();
  toast("Đã chọn tài khoản", "info");
  
  // Hiệu ứng skeleton loading khi đổi tài khoản
  showTableSkeleton("runner-tbody", 4, 6);
  showTableSkeleton("quests-tbody", 4, 6);
  setTimeout(() => {
    if (typeof renderAll === 'function') renderAll();
    if (typeof syncQuestsFromDiscord === 'function') syncQuestsFromDiscord(false);
  }, 200);
};

window.logoutAcc = async function(id) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}

  const acc = state.accounts.find(a => a.id === id);
  const accName = acc?.username || "Tài khoản";

  state.accounts = state.accounts.filter(a => a.id !== id);
  if (state.activeAccId === id) {
    state.activeAccId = state.accounts.length > 0 ? state.accounts[0].id : null;
  }
  if (state.accounts.length === 0) {
    state.quests = [];
    state.rewards = [];
  }
  saveState();
  toast(`Đã đăng xuất ${accName}`, "info");
  if (typeof addLog === 'function') addLog("info", `Đã đăng xuất tài khoản ${accName}.`);
  if (typeof updateNavGating === 'function') updateNavGating();
  if (typeof renderAll === 'function') renderAll();
  if (state.accounts.length === 0 && typeof window.switchTabTo === 'function') {
    window.switchTabTo("accounts");
  } else if (typeof syncQuestsFromDiscord === 'function') {
    syncQuestsFromDiscord(false);
  }
};

window.deleteAcc = window.logoutAcc;
