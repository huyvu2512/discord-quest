/**
 * PLAYTIME RUNNER VIEW RENDERER (js/views/playtime/render.js)
 */

window.autoScrollRunnerTiers = function() {
  ['playtime', 'variety'].forEach(type => {
    const grid = document.getElementById(`runner-tier-grid-${type}`);
    if (!grid) return;

    const unlockedSlots = grid.querySelectorAll('.runner-tier-slot.unlocked');
    const activeSlot = grid.querySelector('.runner-tier-slot.current')
      || (unlockedSlots.length > 0 ? unlockedSlots[unlockedSlots.length - 1] : null);

    if (activeSlot) {
      const slotLeft = activeSlot.offsetLeft - grid.offsetLeft;
      const slotWidth = activeSlot.offsetWidth;
      const gridWidth = grid.clientWidth;
      const maxScroll = Math.max(0, grid.scrollWidth - gridWidth);
      const targetScroll = Math.max(0, Math.min(maxScroll, slotLeft - (gridWidth / 2) + (slotWidth / 2)));

      grid.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      return;
    }

    grid.scrollTo({ left: 0, behavior: 'smooth' });
  });
};

function renderBadgeRunner() {
  const root = document.getElementById('playtime-view-root') || document.getElementById('badge-runner-view-root');
  if (!root) return;

  const token = getBadgeRunnerToken();

  // Tự động nạp thông tin huy hiệu nếu chưa có dữ liệu hồ sơ
  if (token && badgeProfileState.lastCheckedToken !== token && !badgeProfileState.loading && typeof window.loadBadgeProfile === 'function') {
    window.loadBadgeProfile(false);
  }

  const playtime = getPlaytimeStatus();
  const variety = getVarietyStatus();
  const isBothMaxed = playtime.isMaxed && variety.isMaxed;

  // Tự động chuyển chế độ nếu chế độ hiện tại đã max
  if (!isBothMaxed && !badgeRunnerState.isRunning) {
    if (playtime.isMaxed && (badgeRunnerState.mode === 'playtime' || badgeRunnerState.mode === 'both')) {
      badgeRunnerState.mode = 'games_played';
    } else if (variety.isMaxed && (badgeRunnerState.mode === 'games_played' || badgeRunnerState.mode === 'both')) {
      badgeRunnerState.mode = 'playtime';
    }
  }

  const isVarietyOnly = badgeRunnerState.mode === 'games_played';
  const estHours = isVarietyOnly ? (badgeRunnerState.gameCount * (60 / 3600)).toFixed(1) : (badgeRunnerState.gameCount * badgeRunnerState.hoursPerGame).toLocaleString('vi-VN');
  const pct = badgeRunnerState.progressTotal > 0
    ? Math.min(100, Math.round((badgeRunnerState.progressCurrent / badgeRunnerState.progressTotal) * 100))
    : 0;

  const playtimeNeeded = Math.max(0, 5000 - Math.floor(playtime.currentValue || 0));
  const varietyNeeded = Math.max(0, 100 - (variety.currentValue || 0));
  const maxHoursForCurrentGames = Math.max(1, Math.ceil(playtimeNeeded / Math.max(1, badgeRunnerState.gameCount)));

  const isQuestActive = typeof window.isQuestRunning === 'function' && window.isQuestRunning();

  const isCurrentModeMaxed = isBothMaxed
    || (badgeRunnerState.mode === 'playtime' && playtime.isMaxed)
    || (badgeRunnerState.mode === 'games_played' && variety.isMaxed)
    || (badgeRunnerState.mode === 'both' && (playtime.isMaxed || variety.isMaxed));

  root.innerHTML = `
    <!-- HÀNG 1: Cấu hình & Nhật ký -->
    <div class="badge-runner-layout">
      <!-- Cột trái: Cấu hình -->
      <div class="card runner-card">
        <div class="runner-card-head">
          <div class="runner-card-title">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" style="color: var(--text-sub);"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>Cấu Hình Chạy</span>
          </div>
        </div>

        ${isBothMaxed ? `
          <div class="runner-maxed-banner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span>Tài khoản này đã mở khóa tối đa tất cả 10 cấp của cả 2 huy hiệu!</span>
          </div>
        ` : ''}

        <label class="form-lbl">Chế độ</label>
        <div class="mode-selector-grid">
          <button type="button" 
                  class="mode-pill-btn ${badgeRunnerState.mode === 'both' ? 'active' : ''} ${playtime.isMaxed || variety.isMaxed ? 'disabled' : ''}" 
                  onclick="setBadgeRunnerMode('both')"
                  ${playtime.isMaxed || variety.isMaxed ? 'disabled' : ''}
                  title="${playtime.isMaxed || variety.isMaxed ? 'Một trong hai huy hiệu đã đạt tối đa' : 'Cày đồng thời cả 2 mốc'}">
            <span class="mode-pill-name">Cả hai</span>
            <span class="mode-pill-desc">
              ${isBothMaxed ? 'Đã max cả 2 ✓' : (playtime.isMaxed ? 'Thời gian chơi đã max' : (variety.isMaxed ? 'Số game đã max' : 'Giờ chơi + Số game'))}
            </span>
          </button>

          <button type="button" 
                  class="mode-pill-btn ${badgeRunnerState.mode === 'playtime' ? 'active' : ''} ${playtime.isMaxed ? 'disabled' : ''}" 
                  onclick="setBadgeRunnerMode('playtime')"
                  ${playtime.isMaxed ? 'disabled' : ''}
                  title="${playtime.isMaxed ? 'Đã đạt mốc 5.000+ giờ (Vĩnh cửu)' : 'Mốc 5.000+ giờ'}">
            <span class="mode-pill-name">Thời gian chơi</span>
            <span class="mode-pill-desc">${playtime.isMaxed ? 'Đã tối đa (Cấp 10) ✓' : 'Mốc 5.000+ giờ'}</span>
          </button>

          <button type="button" 
                  class="mode-pill-btn ${badgeRunnerState.mode === 'games_played' ? 'active' : ''} ${variety.isMaxed ? 'disabled' : ''}" 
                  onclick="setBadgeRunnerMode('games_played')"
                  ${variety.isMaxed ? 'disabled' : ''}
                  title="${variety.isMaxed ? 'Đã đạt mốc 100+ game (Thuyết phổ quát)' : 'Mốc 100+ game'}">
            <span class="mode-pill-name">Trò chơi đa dạng</span>
            <span class="mode-pill-desc">${variety.isMaxed ? 'Đã tối đa (Cấp 10) ✓' : 'Mốc 100+ game'}</span>
          </button>
        </div>

        <div class="runner-form-grid" ${isVarietyOnly ? 'style="grid-template-columns: 1fr;"' : ''}>
          <div class="form-field">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-lbl">Số lượng game</label>
              ${varietyNeeded > 0 && !variety.isMaxed ? `
                <span style="font-size: 11px; color: var(--text-sub);">Còn thiếu: <strong style="color: #79c0ff;">${varietyNeeded} game</strong></span>
              ` : ''}
            </div>
            <input type="number" class="input-text font-mono" min="1" max="500" step="1" value="${badgeRunnerState.gameCount}" onchange="setBadgeRunnerGames(this.value)" ${badgeRunnerState.isRunning || isCurrentModeMaxed ? 'disabled' : ''}>
            <div class="preset-row">
              <button type="button" class="preset-chip ${badgeRunnerState.gameCount === 10 ? 'active' : ''}" onclick="setBadgeRunnerGames(10)" ${isCurrentModeMaxed ? 'disabled' : ''}>10</button>
              <button type="button" class="preset-chip ${badgeRunnerState.gameCount === 30 ? 'active' : ''}" onclick="setBadgeRunnerGames(30)" ${isCurrentModeMaxed ? 'disabled' : ''}>30</button>
              <button type="button" class="preset-chip ${badgeRunnerState.gameCount === 60 ? 'active' : ''}" onclick="setBadgeRunnerGames(60)" ${isCurrentModeMaxed ? 'disabled' : ''}>60</button>
              <button type="button" class="preset-chip highlight ${badgeRunnerState.gameCount === (varietyNeeded || 100) ? 'active' : ''}" onclick="setRunnerGamesToMax()" ${isCurrentModeMaxed ? 'disabled' : ''} title="Đặt số game vừa đủ đạt mốc cuối Cấp 10 (100 game)">
                Mốc cuối (${varietyNeeded || 100})
              </button>
            </div>
          </div>

          ${!isVarietyOnly ? `
            <div class="form-field">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label class="form-lbl">Số giờ mỗi game</label>
                ${playtimeNeeded > 0 && !playtime.isMaxed ? `
                  <span style="font-size: 11px; color: var(--text-sub);">Còn thiếu: <strong style="color: #f0b232;">${playtimeNeeded.toLocaleString('vi-VN')}h</strong></span>
                ` : ''}
              </div>
              <input type="number" class="input-text font-mono" min="1" max="5000" step="1" value="${badgeRunnerState.hoursPerGame}" onchange="setBadgeRunnerHours(this.value)" ${badgeRunnerState.isRunning || isCurrentModeMaxed ? 'disabled' : ''}>
              <div class="preset-row">
                <button type="button" class="preset-chip ${badgeRunnerState.hoursPerGame === 10 ? 'active' : ''}" onclick="setBadgeRunnerHours(10)" ${isCurrentModeMaxed ? 'disabled' : ''}>10h</button>
                <button type="button" class="preset-chip ${badgeRunnerState.hoursPerGame === 50 ? 'active' : ''}" onclick="setBadgeRunnerHours(50)" ${isCurrentModeMaxed ? 'disabled' : ''}>50h</button>
                <button type="button" class="preset-chip ${badgeRunnerState.hoursPerGame === 200 ? 'active' : ''}" onclick="setBadgeRunnerHours(200)" ${isCurrentModeMaxed ? 'disabled' : ''}>200h</button>
                <button type="button" class="preset-chip highlight ${badgeRunnerState.hoursPerGame === maxHoursForCurrentGames ? 'active' : ''}" onclick="setRunnerHoursToMax()" ${isCurrentModeMaxed ? 'disabled' : ''} title="Đặt số giờ mỗi game vừa đủ chạm mốc cuối 5.000h">
                  Mốc cuối (${maxHoursForCurrentGames}h)
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="runner-footer-bar">
          <div class="runner-summary-chips">
            <span class="runner-summary-chip">
              <span class="runner-chip-lbl">Game</span>
              <span class="runner-chip-val font-mono">${badgeRunnerState.gameCount}</span>
            </span>
            ${!isVarietyOnly ? `
              <span class="runner-summary-chip">
                <span class="runner-chip-lbl">Tổng giờ</span>
                <span class="runner-chip-val font-mono">${estHours}h</span>
              </span>
            ` : ''}
            <span class="runner-summary-chip runner-chip-available" title="Kho game hợp lệ từ Discord CDN có sẵn để cày">
              <span class="runner-chip-lbl">Kho game</span>
              <span class="runner-chip-val font-mono">${(badgeRunnerState.totalGamesAvailable || 25388).toLocaleString('vi-VN')}</span>
            </span>
          </div>
          <div>
            ${badgeRunnerState.isRunning ? `
              <button type="button" class="btn btn-danger btn-sm" onclick="stopBadgeRunner()">Dừng lại</button>
            ` : isBothMaxed ? `
              <button type="button" class="btn btn-secondary btn-sm" disabled style="opacity: 0.65; cursor: not-allowed;">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:inline-block; vertical-align:-2px; margin-right:4px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Đã đạt tối đa cả 2 huy hiệu
              </button>
            ` : isCurrentModeMaxed ? `
              <button type="button" class="btn btn-secondary btn-sm" disabled style="opacity: 0.65; cursor: not-allowed;">
                Huy hiệu này đã đạt tối đa
              </button>
            ` : isQuestActive ? `
              <button type="button" class="btn btn-secondary btn-sm" disabled style="opacity: 0.65; cursor: not-allowed;" title="Đang có nhiệm vụ Quest chạy song song. Vui lòng dừng Quest trước.">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:inline-block; vertical-align:-2px; margin-right:4px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Đang chạy Quest...
              </button>
            ` : `
              <button type="button" class="btn btn-primary btn-sm" onclick="startBadgeRunner()" ${!token ? 'disabled' : ''}>
                Bắt đầu chạy
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Cột phải: Tiến trình & Nhật ký -->
      <div class="card runner-card">
        <div class="runner-card-head">
          <div class="runner-card-title">Tiến Trình &amp; Nhật Ký</div>
          <span class="font-mono" style="font-size: 12px; color: var(--text-sub);">${pct}%</span>
        </div>

        <div class="runner-progress-box">
          <div class="runner-progress-head">
            <span style="color: var(--text-sub);">Đã xử lý: <strong style="color: #fff;">${badgeRunnerState.progressCurrent} / ${badgeRunnerState.progressTotal} game</strong></span>
            <span class="font-mono" style="color: var(--text-main);">+${badgeRunnerState.claimedHours} giờ</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-fill ${pct >= 100 ? 'done' : ''}" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="log-window font-mono runner-mini-console" id="badge-runner-console"></div>
      </div>
    </div>

    <!-- HÀNG 2: Hai bảng mốc cấp độ (10 Cấp) -->
    <div class="runner-tier-boards-layout">
      <!-- BẢNG 1: THỜI GIAN CHƠI (10 CẤP) -->
      <div class="card runner-tier-board-card">
        <!-- Mốc tiến trình chuẩn Discord -->
        <div class="runner-progress-row">
          <div class="runner-progress-art-wrap ${!playtime.owned ? 'locked' : ''}" title="${escapeHtml(playtime.owned ? (playtime.currentTierName || 'Cấp hiện tại') : 'Chưa mở khóa')}">
            ${playtime.curArt ? `
              <img src="${escapeHtml(playtime.curArt)}" alt="" class="runner-progress-art" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ` : ''}
            <div class="runner-progress-art-fallback" style="${playtime.curArt ? 'display:none;' : ''}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.71 4.29a1 1 0 0 0-1.42 0l-7.1 7.1-1.42-1.42a1 1 0 0 0-1.41 1.42l1.41 1.41-5.47 5.48a1 1 0 0 0 0 1.41l1.42 1.42a1 1 0 0 0 1.41 0l5.48-5.47 1.41 1.41a1 1 0 0 0 1.42-1.41l-1.42-1.42 7.1-7.1a1 1 0 0 0 0-1.42Z"/></svg>
            </div>
          </div>

          <div class="runner-progress-center">
            <div class="runner-progress-text">${escapeHtml(playtime.helperText)}</div>
            <div class="runner-progress-track">
              <div class="runner-progress-fill ${playtime.isMaxed ? 'maxed' : ''}" style="width: ${playtime.pct}%"></div>
            </div>
          </div>

          <div class="runner-progress-art-wrap" title="${escapeHtml(playtime.isMaxed ? 'Đã đạt cấp tối đa' : 'Mốc tiếp theo')}">
            ${playtime.nextArt ? `
              <img src="${escapeHtml(playtime.nextArt)}" alt="" class="runner-progress-art" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ` : ''}
            <div class="runner-progress-art-fallback" style="${playtime.nextArt ? 'display:none;' : ''}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.71 4.29a1 1 0 0 0-1.42 0l-7.1 7.1-1.42-1.42a1 1 0 0 0-1.41 1.42l1.41 1.41-5.47 5.48a1 1 0 0 0 0 1.41l1.42 1.42a1 1 0 0 0 1.41 0l5.48-5.47 1.41 1.41a1 1 0 0 0 1.42-1.41l-1.42-1.42 7.1-7.1a1 1 0 0 0 0-1.42Z"/></svg>
            </div>
          </div>
        </div>

        <div class="runner-tier-grid single-row" id="runner-tier-grid-playtime">
          ${playtime.tiers.map(t => `
            <div class="runner-tier-slot ${t.isCurrent ? 'current' : ''} ${t.unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(t.name)} (${escapeHtml(t.time)})">
              <div class="runner-tier-slot-art">
                ${t.icon ? `<img src="${escapeHtml(t.icon)}" alt="" class="runner-tier-slot-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                <svg class="runner-tier-slot-fallback-svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="${t.icon ? 'display:none;' : ''}"><path d="M19.71 4.29a1 1 0 0 0-1.42 0l-7.1 7.1-1.42-1.42a1 1 0 0 0-1.41 1.42l1.41 1.41-5.47 5.48a1 1 0 0 0 0 1.41l1.42 1.42a1 1 0 0 0 1.41 0l5.48-5.47 1.41 1.41a1 1 0 0 0 1.42-1.41l-1.42-1.42 7.1-7.1a1 1 0 0 0 0-1.42Z"/></svg>
              </div>
              <div class="runner-tier-slot-name">${escapeHtml(t.name)}</div>
              <div class="runner-tier-slot-milestone">
                ${!t.unlocked ? `
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.65;"><path fill-rule="evenodd" d="M6 9h1V6a5 5 0 0 1 10 0v3h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm9-3v3H9V6a3 3 0 1 1 6 0Zm-1 8a2 2 0 0 1-1 1.73V18a1 1 0 1 1-2 0v-2.27A2 2 0 1 1 14 14Z" clip-rule="evenodd"/></svg>
                ` : ''}
                <span>${escapeHtml(t.time)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- BẢNG 2: TRÒ CHƠI ĐA DẠNG (10 CẤP) -->
      <div class="card runner-tier-board-card">
        <!-- Mốc tiến trình chuẩn Discord -->
        <div class="runner-progress-row">
          <div class="runner-progress-art-wrap ${!variety.owned ? 'locked' : ''}" title="${escapeHtml(variety.owned ? (variety.currentTierName || 'Cấp hiện tại') : 'Chưa mở khóa')}">
            ${variety.curArt ? `
              <img src="${escapeHtml(variety.curArt)}" alt="" class="runner-progress-art" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ` : ''}
            <div class="runner-progress-art-fallback" style="${variety.curArt ? 'display:none;' : ''}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.5 4H5.5C3.57 4 2 5.57 2 7.5v9C2 18.43 3.57 20 5.5 20h13c1.93 0 3.5-1.57 3.5-3.5v-9C22 5.57 20.43 4 18.5 4ZM8 13.5H6.5V15a.5.5 0 0 1-1 0v-1.5H4a.5.5 0 0 1 0-1h1.5V11a.5.5 0 0 1 1 0v1.5H8a.5.5 0 0 1 0 1Zm7.5.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm2.5-3a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"/></svg>
            </div>
          </div>

          <div class="runner-progress-center">
            <div class="runner-progress-text">${escapeHtml(variety.helperText)}</div>
            <div class="runner-progress-track">
              <div class="runner-progress-fill ${variety.isMaxed ? 'maxed' : ''}" style="width: ${variety.pct}%"></div>
            </div>
          </div>

          <div class="runner-progress-art-wrap" title="${escapeHtml(variety.isMaxed ? 'Đã đạt cấp tối đa' : 'Mốc tiếp theo')}">
            ${variety.nextArt ? `
              <img src="${escapeHtml(variety.nextArt)}" alt="" class="runner-progress-art" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ` : ''}
            <div class="runner-progress-art-fallback" style="${variety.nextArt ? 'display:none;' : ''}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.5 4H5.5C3.57 4 2 5.57 2 7.5v9C2 18.43 3.57 20 5.5 20h13c1.93 0 3.5-1.57 3.5-3.5v-9C22 5.57 20.43 4 18.5 4ZM8 13.5H6.5V15a.5.5 0 0 1-1 0v-1.5H4a.5.5 0 0 1 0-1h1.5V11a.5.5 0 0 1 1 0v1.5H8a.5.5 0 0 1 0 1Zm7.5.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm2.5-3a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"/></svg>
            </div>
          </div>
        </div>

        <div class="runner-tier-grid single-row" id="runner-tier-grid-variety">
          ${variety.tiers.map(t => `
            <div class="runner-tier-slot ${t.isCurrent ? 'current' : ''} ${t.unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(t.name)} (${escapeHtml(t.time)})">
              <div class="runner-tier-slot-art">
                ${t.icon ? `<img src="${escapeHtml(t.icon)}" alt="" class="runner-tier-slot-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                <svg class="runner-tier-slot-fallback-svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="${t.icon ? 'display:none;' : ''}"><path d="M18.5 4H5.5C3.57 4 2 5.57 2 7.5v9C2 18.43 3.57 20 5.5 20h13c1.93 0 3.5-1.57 3.5-3.5v-9C22 5.57 20.43 4 18.5 4ZM8 13.5H6.5V15a.5.5 0 0 1-1 0v-1.5H4a.5.5 0 0 1 0-1h1.5V11a.5.5 0 0 1 1 0v1.5H8a.5.5 0 0 1 0 1Zm7.5.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm2.5-3a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"/></svg>
              </div>
              <div class="runner-tier-slot-name">${escapeHtml(t.name)}</div>
              <div class="runner-tier-slot-milestone">
                ${!t.unlocked ? `
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.65;"><path fill-rule="evenodd" d="M6 9h1V6a5 5 0 0 1 10 0v3h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm9-3v3H9V6a3 3 0 1 1 6 0Zm-1 8a2 2 0 0 1-1 1.73V18a1 1 0 1 1-2 0v-2.27A2 2 0 1 1 14 14Z" clip-rule="evenodd"/></svg>
                ` : ''}
                <span>${escapeHtml(t.time)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  renderBadgeRunnerLogsOnly();
  setTimeout(() => {
    if (typeof window.autoScrollRunnerTiers === 'function') {
      window.autoScrollRunnerTiers();
    }
  }, 80);
}

window.renderPlaytime = renderBadgeRunner;
window.renderBadgeRunner = renderBadgeRunner;
