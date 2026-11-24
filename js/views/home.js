/**
 * VIEW: TRANG CHỦ / TỔNG QUAN (js/views/home.js)
 */

function renderHome() {
  const statQuests = document.getElementById("home-stat-quests");
  const statRunning = document.getElementById("home-stat-running");
  const statRunningText = document.getElementById("home-stat-running-text");
  const statRewards = document.getElementById("home-stat-rewards");
  const statOrbs = document.getElementById("home-stat-orbs");
  const badgeQuestCount = document.getElementById("home-badge-quest-count");
  const questsPreview = document.getElementById("home-quests-preview-list");
  const accountWidget = document.getElementById("home-account-widget");

  const activeAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const hasAcc = !!activeAcc;

  // 1. Thống kê tổng quan (Live Counters)
  const availableQuests = state.quests.filter(q => q.status !== "completed" && q.status !== "claimed");
  const runningQuest = state.quests.find(q => q.status === "running");

  if (statQuests) {
    if (!hasAcc) statQuests.textContent = "0";
    else if (state.isSyncingQuests) statQuests.innerHTML = `<span class="skeleton" style="width: 28px; height: 18px; display: inline-block;"></span>`;
    else statQuests.textContent = availableQuests.length;
  }
  if (badgeQuestCount) {
    if (!hasAcc || state.isSyncingQuests) badgeQuestCount.textContent = "0";
    else badgeQuestCount.textContent = state.quests.length;
  }
  if (statRunning) statRunning.textContent = runningQuest ? "1" : "0";
  if (statRunningText) statRunningText.textContent = runningQuest ? runningQuest.name : "Chưa chạy";
  
  const giftRewardCount = typeof getRewardItems === "function" ? getRewardItems().length : state.rewards.length;
  if (statRewards) {
    if (!hasAcc) statRewards.textContent = "0";
    else if (state.isSyncingQuests) statRewards.innerHTML = `<span class="skeleton" style="width: 28px; height: 18px; display: inline-block;"></span>`;
    else statRewards.textContent = giftRewardCount;
  }
  if (statOrbs) statOrbs.textContent = hasAcc ? (activeAcc.orbs ?? 0).toLocaleString() : "0";

  // 2. Danh sách nhiệm vụ nổi bật / mới nhất
  if (questsPreview) {
    if (!hasAcc) {
      questsPreview.innerHTML = `
        <div class="home-empty-state">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <div class="home-empty-title">Chưa kết nối tài khoản Discord</div>
          <div class="home-empty-desc">Thêm Token của bạn để quét danh sách nhiệm vụ thật từ Discord.</div>
          <button class="btn btn-primary btn-sm" onclick="window.switchTabTo('accounts')">+ Thêm Token Ngay</button>
        </div>
      `;
    } else if (state.isSyncingQuests) {
      questsPreview.innerHTML = `
        <div style="padding: 12px 0; display: flex; flex-direction: column; gap: 8px;">
          <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px;"></div>
          <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px;"></div>
          <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px;"></div>
        </div>
      `;
    } else if (state.quests.length === 0) {
      questsPreview.innerHTML = `
        <div class="home-empty-state">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
          <div class="home-empty-title">Chưa quét nhiệm vụ từ Discord</div>
          <div class="home-empty-desc">Nhấn nút bên dưới để đồng bộ toàn bộ Quest khả dụng cho tài khoản @${escapeHtml(activeAcc.username)}.</div>
          <button class="btn btn-primary btn-sm" onclick="syncQuestsFromDiscord(true)">Quét Nhiệm Vụ Ngay</button>
        </div>
      `;
    } else {
      const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
      const sorted = [...state.quests].sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99)).slice(0, 4);

      const hasRunning = state.quests.some(q => q.status === "running");
      const isRunningAll = !!state.isRunningAll;
      let homeQueueOrder = 1;

      questsPreview.innerHTML = sorted.map(q => {
        let actionBtn = "";
        const questUrl = q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home');

        if (q.status === "running") {
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="pauseQuest('${q.id}')">Tạm dừng</button>`;
        } else if (q.status === "completed") {
          actionBtn = `<a href="${questUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Nhận quà</a>`;
        } else if (q.status === "claimed") {
          actionBtn = `<span class="tag tag-claimed">Hoàn thành</span>`;
        } else if (isRunningAll) {
          actionBtn = `<span class="tag tag-pending font-mono" style="font-size: 11px; padding: 4px 8px;">Hàng chờ #${homeQueueOrder++}</span>`;
        } else if (hasRunning) {
          actionBtn = `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.45; cursor: not-allowed;" title="Tạm dừng nhiệm vụ đang chạy để chọn nhiệm vụ này">Chạy</button>`;
        } else {
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="startQuest('${q.id}')">Chạy</button>`;
        }

        const iconLetter = (q.name || "Q").trim().charAt(0).toUpperCase();

        return `
          <div class="home-quest-row">
            <div class="quest-row-avatar">${iconLetter}</div>
            <div class="quest-row-main">
              <div class="quest-row-title" title="${escapeHtml(q.name)}">${escapeHtml(q.name)}</div>
              <div class="quest-row-sub">
                <span class="quest-row-desc" title="${escapeHtml(q.publisher || 'Discord')}">${escapeHtml(q.publisher || 'Discord')}</span>
              </div>
            </div>
            <div class="quest-row-action">${actionBtn}</div>
          </div>
        `;
      }).join('');
    }
  }

  // 3. Mini Console Logs
  renderHomeLogs();

  // 4. Widget Tài khoản Discord
  if (accountWidget) {
    if (hasAcc) {
      const initials = (activeAcc.username || "U").slice(0, 2).toUpperCase();
      const doneCount = state.quests.filter(q => q.status === "completed" || q.status === "claimed").length;
      accountWidget.innerHTML = `
        <div class="acc-widget-user">
          ${activeAcc.avatar 
            ? `<img src="${activeAcc.avatar}" alt="Avatar" class="acc-widget-avatar">` 
            : `<div class="acc-widget-initials">${initials}</div>`}
          <div class="acc-widget-info">
            <div class="acc-widget-name">${escapeHtml(activeAcc.username)}</div>
            <div class="acc-widget-tag">${escapeHtml(activeAcc.tag || '#0000')}</div>
          </div>
          <div class="acc-widget-badge">
            <span class="dot-online"></span>
            <span>Đã kết nối</span>
          </div>
        </div>
        <div class="acc-widget-metrics">
          <div class="acc-metric-item">
            <span class="metric-num">${(activeAcc.orbs ?? 0).toLocaleString()}</span>
            <span class="metric-label">Số dư Orbs</span>
          </div>
          <div class="acc-metric-item">
            <span class="metric-num">${doneCount} / ${state.quests.length}</span>
            <span class="metric-label">Nhiệm vụ xong</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm acc-widget-btn" onclick="window.switchTabTo('accounts')">
          <span>Quản lý tài khoản</span>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      `;
    } else {
      accountWidget.innerHTML = `
        <div class="acc-widget-empty">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div class="empty-acc-text">Chưa kết nối tài khoản nào</div>
          <button class="btn btn-primary btn-sm" onclick="window.switchTabTo('accounts')">+ Thêm Token Discord</button>
        </div>
      `;
    }
  }
}

function renderHomeLogs() {
  const logsMini = document.getElementById("home-logs-mini");
  if (!logsMini) return;

  if (state.logs.length === 0) {
    logsMini.innerHTML = `
      <div class="home-log-row">
        <span class="log-time">[${new Date().toTimeString().split(' ')[0]}]</span>
        <span class="log-lvl-info">[INFO]</span>
        <span class="log-msg">Hệ thống Discord Quest đã sẵn sàng kết nối.</span>
      </div>
      <div class="home-log-prompt">
        <span class="log-cursor"></span>
        <span>Đang chờ lệnh từ người dùng...</span>
      </div>
    `;
    return;
  }

  const recentLogs = state.logs.slice(-30);
  const logRows = recentLogs.map(l => `
    <div class="home-log-row">
      <span class="log-time">[${l.time}]</span>
      <span class="log-lvl-${l.level}">[${l.level.toUpperCase()}]</span>
      <span class="log-msg">${escapeHtml(typeof window.translateDynamicText === "function" ? window.translateDynamicText(l.text) : l.text)}</span>
    </div>
  `).join('');

  logsMini.innerHTML = logRows + `
    <div class="home-log-prompt">
      <span class="log-cursor"></span>
      <span>Đang lắng nghe tiến trình thời gian thực...</span>
    </div>
  `;
  logsMini.scrollTop = logsMini.scrollHeight;
}

window.renderHome = renderHome;
window.renderHomeLogs = renderHomeLogs;
