/**
 * BADGES DIRECTORY MODAL (js/views/badges/modal.js)
 * Hộp thoại "Huy hiệu của bạn" chuẩn Discord
 */

window.openBadgesModal = function(targetBadgeId = null) {
  badgeProfileState.modalOpen = true;
  if (targetBadgeId !== null && targetBadgeId !== undefined && typeof targetBadgeId === 'number' && targetBadgeId > 0) {
    badgeProfileState.selectedModalBadgeId = targetBadgeId;
  } else if (typeof targetBadgeId === 'string' && /^\d+$/.test(targetBadgeId)) {
    badgeProfileState.selectedModalBadgeId = Number(targetBadgeId);
  }
  renderBadgesModal();
};

window.closeBadgesModal = function() {
  badgeProfileState.modalOpen = false;
  const el = document.getElementById('modal-profile-badges');
  if (el) el.classList.remove('open');
};

window.selectModalBadge = function(badgeId) {
  badgeProfileState.selectedModalBadgeId = Number(badgeId);
  renderBadgesModal();
};

function renderBadgesModal() {
  let modal = document.getElementById('modal-profile-badges');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-profile-badges';
    modal.className = 'modal-backdrop';
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closeBadgesModal();
    });
    document.body.appendChild(modal);
  }

  if (!badgeProfileState.modalOpen) {
    modal.classList.remove('open');
    return;
  }

  const rawDir = Array.isArray(badgeProfileState.user?.directoryBadges)
    ? badgeProfileState.user.directoryBadges
    : [];

  // Phân loại giống hệt Discord: Đang sở hữu vs Có thể mở khóa
  const ownedList = rawDir.filter(b => b.owned === true);
  const earnableList = rawDir.filter(b => !b.owned && b.is_earnable === true);
  const visibleList = [...ownedList, ...earnableList];

  // Nếu API /users/@me/badges chưa có dữ liệu hoặc tài khoản chưa tải xong
  if (visibleList.length === 0) {
    const fallbackBadges = badgeProfileState.user?.badges || [];
    modal.innerHTML = `
      <div class="modal modal-profile-badges-dialog">
        <div class="badges-modal-layout">
          <div class="badges-directory-panel">
            <div class="badges-directory-header">
              <h1 class="badges-directory-title">Huy hiệu của bạn</h1>
              <div class="badges-directory-sub">Duyệt huy hiệu của bạn và khám phá những món mới mà bạn có thể mở khóa.</div>
            </div>
            <div class="badges-directory-content">
              ${badgeProfileState.loading
                ? `<div style="padding: 20px 4px; color: var(--text-sub); font-size: 13px;">Đang tải danh mục huy hiệu từ Discord...</div>`
                : (fallbackBadges.length > 0
                  ? `<div class="badges-slots-grid">
                      ${fallbackBadges.map(b => {
                        const src = getBadgeIconSrc(b);
                        return `
                          <div class="badge-slot-item" title="${escapeHtml(b.description || b.name)}">
                            ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(b.name)}" class="badge-slot-icon">` : `<span style="font-size:11px;color:#fff;">${escapeHtml(b.name.slice(0,2))}</span>`}
                          </div>
                        `;
                      }).join('')}
                    </div>`
                  : `<div style="padding: 20px 4px; color: var(--text-sub); font-size: 13px;">Tài khoản này chưa có dữ liệu Danh Mục Huy Hiệu từ Discord.</div>`)}
            </div>
          </div>
          <div class="badges-detail-panel">
            <button type="button" class="badges-detail-close-btn" onclick="closeBadgesModal()" title="Đóng">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19.3 20.7a1 1 0 0 0 1.4-1.4L13.42 12l7.3-7.3a1 1 0 0 0-1.42-1.4L12 10.58l-7.3-7.3a1 1 0 0 0-1.4 1.42L10.58 12l-7.3 7.3a1 1 0 1 0 1.42 1.4L12 13.42l7.3 7.3Z"/>
              </svg>
            </button>
            <div class="badges-detail-scroller" style="display:flex;align-items:center;justify-content:center;color:var(--text-sub);font-size:13px;text-align:center;">
              ${badgeProfileState.loading ? 'Đang kết nối Discord API (/users/@me/badges)...' : 'Không lấy được dữ liệu chi tiết từ /users/@me/badges cho tài khoản này. Hãy bấm Làm mới để thử lại.'}
            </div>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('open');
    return;
  }

  let selectedRaw = visibleList.find(b => b.badge_id === badgeProfileState.selectedModalBadgeId);
  if (!selectedRaw) {
    selectedRaw = visibleList[0];
    badgeProfileState.selectedModalBadgeId = selectedRaw.badge_id;
  }

  const detail = buildDirectoryBadgeDetail(selectedRaw);

  modal.innerHTML = `
    <div class="modal modal-profile-badges-dialog">
      <div class="badges-modal-layout">
        <!-- CỘT TRÁI: DIRECTORY PANEL -->
        <div class="badges-directory-panel">
          <div class="badges-directory-header">
            <h1 class="badges-directory-title">Huy hiệu của bạn</h1>
            <div class="badges-directory-sub">Duyệt huy hiệu của bạn và khám phá những món mới mà bạn có thể mở khóa.</div>
          </div>

          <div class="badges-directory-content">
            <!-- MỤC 1: HUY HIỆU CỦA BẠN (SỞ HỮU) -->
            ${ownedList.length > 0 ? `
              <div class="badges-slots-grid">
                ${ownedList.map(b => {
                  const isSelected = b.badge_id === detail.badge_id;
                  const iconSrc = b.simple_icon_url || b.simple_icon_raster_url || '';
                  const slotTitle = b.name || `Badge #${b.badge_id}`;
                  return `
                    <div class="badge-slot-item ${isSelected ? 'selected' : ''}" onclick="selectModalBadge(${b.badge_id})" title="${escapeHtml(slotTitle)}" role="tab" aria-selected="${isSelected}">
                      <img src="${escapeHtml(iconSrc)}" alt="${escapeHtml(slotTitle)}" class="badge-slot-icon">
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="font-size: 12px; color: var(--text-sub); margin-bottom: 16px;">Tài khoản này chưa mở khóa huy hiệu nào.</div>
            `}

            <!-- MỤC 2: CÓ THỂ MỞ KHÓA -->
            ${earnableList.length > 0 ? `
              <div class="badges-section-label">Có thể mở khóa</div>
              <div class="badges-slots-grid">
                ${earnableList.map(b => {
                  const isSelected = b.badge_id === detail.badge_id;
                  const iconSrc = b.simple_icon_url || b.simple_icon_raster_url || '';
                  const slotTitle = b.name || `Badge #${b.badge_id}`;
                  return `
                    <div class="badge-slot-item ${isSelected ? 'selected' : ''}" onclick="selectModalBadge(${b.badge_id})" title="${escapeHtml(slotTitle)}" role="tab" aria-selected="${isSelected}">
                      <img src="${escapeHtml(iconSrc)}" alt="${escapeHtml(slotTitle)}" class="badge-slot-icon">
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- CỘT PHẢI: DETAIL PANEL -->
        <div class="badges-detail-panel">
          <button type="button" class="badges-detail-close-btn" onclick="closeBadgesModal()" title="Đóng">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19.3 20.7a1 1 0 0 0 1.4-1.4L13.42 12l7.3-7.3a1 1 0 0 0-1.42-1.4L12 10.58l-7.3-7.3a1 1 0 0 0-1.4 1.42L10.58 12l-7.3 7.3a1 1 0 1 0 1.42 1.4L12 13.42l7.3 7.3Z"/>
            </svg>
          </button>

          <div class="badges-detail-scroller">
            <!-- 1. Hero Graphic -->
            <div class="badge-hero-graphic-wrap">
              <img src="${escapeHtml(detail.graphic)}" alt="${escapeHtml(detail.title)}" class="badge-hero-graphic">
            </div>

            <!-- 2. Badge Identity -->
            <div class="badge-identity-wrap">
              ${detail.eyebrow ? `<div class="badge-category-eyebrow">${escapeHtml(detail.eyebrow)}</div>` : ''}
              <h2 class="badge-detail-title">${escapeHtml(detail.title)}</h2>
              <div class="badge-accessory-row">
                <span>${escapeHtml(detail.timeText || 'Đã mở khóa')}</span>
                ${detail.dateText ? `
                  <span class="badge-accessory-dot"></span>
                  <span>${escapeHtml(detail.dateText)}</span>
                ` : ''}
                ${detail.rarity ? `
                  <span class="badge-accessory-dot"></span>
                  <span class="badge-rarity-pill">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M10.16 4.06a2.13 2.13 0 0 1 3.68 0l8 13.77c.81 1.41-.2 3.17-1.84 3.17H4a2.11 2.11 0 0 1-1.84-3.17l8-13.77Z"/></svg>
                    <span>${escapeHtml(detail.rarity)}</span>
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- 3. Description Card -->
            <div class="badge-desc-card">
              ${detail.hasProgress && detail.progress ? `
                <div class="badge-progress-section">
                  <div class="badge-progress-title">Tiến trình của bạn</div>
                  <div class="badge-progress-row">
                    <img src="${escapeHtml(detail.progress.curArt)}" alt="" class="badge-level-art">
                    <div class="badge-progress-center">
                      <div class="badge-progress-time">${escapeHtml(detail.progress.timeText)}</div>
                      <div class="badge-track">
                        <div class="badge-fill" style="width: ${detail.progress.pct}%;"></div>
                      </div>
                    </div>
                    <img src="${escapeHtml(detail.progress.nextArt)}" alt="" class="badge-level-art">
                  </div>
                </div>
                <div class="badge-divider"></div>
              ` : ''}

              ${detail.legacyLabel ? `
                <div class="badge-legacy-label">${escapeHtml(detail.legacyLabel)}</div>
              ` : ''}

              ${detail.desc ? `
                <div class="badge-desc-text">
                  ${escapeHtml(detail.desc)}
                </div>
              ` : ''}

              ${detail.actionTab || detail.actionUrl ? `
                <div>
                  <button type="button" class="${detail.btnClass || 'badge-action-btn'}" onclick="${detail.actionUrl ? `window.open('${detail.actionUrl}', '_blank')` : `window.switchTabTo('${detail.actionTab}'); closeBadgesModal();`}">
                    ${escapeHtml(detail.actionText || 'Mở tab liên quan')}
                  </button>
                </div>
              ` : ''}

              ${detail.tiers && detail.tiers.length > 0 ? `
                <div class="badge-divider"></div>
                <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">${escapeHtml(detail.tierLabel)}</div>
                <div class="badge-tier-timeline-grid">
                  ${detail.tiers.map(t => `
                    <div class="badge-tier-timeline-item ${t.isCurrent ? 'active' : ''} ${!t.unlocked ? 'locked' : ''}">
                      <img src="${escapeHtml(t.icon)}" alt="${escapeHtml(t.name || t.time)}" class="badge-tier-timeline-icon">
                      ${t.name ? `<div class="badge-tier-timeline-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>` : ''}
                      ${t.time ? `
                        <div class="badge-tier-timeline-desc">
                          ${!t.unlocked ? `
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M6 9h1V6a5 5 0 0 1 10 0v3h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm9-3v3H9V6a3 3 0 1 1 6 0Zm-1 8a2 2 0 0 1-1 1.73V18a1 1 0 1 1-2 0v-2.27A2 2 0 1 1 14 14Z" clip-rule="evenodd"/></svg>
                          ` : ''}
                          <span>${escapeHtml(t.time)}</span>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open');
}
