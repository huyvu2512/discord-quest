/**
 * VIEW: LẤY HUY HIỆU (js/views/badges.js)
 * Quản lý & nhận huy hiệu HypeSquad (Bravery, Brilliance, Balance) và xem danh sách huy hiệu tài khoản
 */

const HYPESQUAD_HOUSES = [
  {
    id: 1,
    key: 'bravery',
    name: 'Bravery',
    viName: 'Quả Cảm',
    desc: 'Dũng cảm, quyết đoán và không bao giờ chùn bước trước thử thách.',
    icon: '/badges/bravery.png'
  },
  {
    id: 2,
    key: 'brilliance',
    name: 'Brilliance',
    viName: 'Lỗi Lạc',
    desc: 'Sáng tạo, đầy ý tưởng đột phá và tham vọng bền bỉ.',
    icon: '/badges/brilliance.png'
  },
  {
    id: 3,
    key: 'balance',
    name: 'Balance',
    viName: 'Cân Bằng',
    desc: 'Điềm tĩnh, hòa hợp và luôn duy trì trật tự trong mọi tình huống.',
    icon: '/badges/balance.png'
  }
];

let badgeProfileState = {
  loading: false,
  submitting: false,
  selectedHouseId: 2,
  currentHouseId: 0,
  user: null,
  lastCheckedToken: null,
  customToken: '',
  modalOpen: false,
  selectedModalBadgeId: null
};

function getBadgeActiveToken() {
  const custom = (badgeProfileState.customToken || '').trim().replace(/^"|"$/g, '');
  if (custom) return custom;
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  return acc?.token || '';
}

window.loadBadgeProfile = async function(force = false) {
  const token = getBadgeActiveToken();
  if (!token) {
    badgeProfileState.user = null;
    badgeProfileState.currentHouseId = 0;
    renderBadges();
    return;
  }

  if (!force && badgeProfileState.lastCheckedToken === token) {
    return;
  }

  badgeProfileState.lastCheckedToken = token;
  badgeProfileState.selectedModalBadgeId = null;
  badgeProfileState.loading = true;
  renderBadges();

  try {
    const res = await fetch(`/api/badges/hypesquad?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      badgeProfileState.user = data.user;
      badgeProfileState.currentHouseId = data.user.houseId || 0;
      if (data.user.houseId) {
        badgeProfileState.selectedHouseId = data.user.houseId;
      }
    } else {
      badgeProfileState.user = null;
      badgeProfileState.currentHouseId = 0;
      if (force || state.activeTab === 'badges') {
        toast(data.error || 'Không thể kiểm tra huy hiệu tài khoản', 'error');
      }
    }
  } catch (err) {
    if (force || state.activeTab === 'badges') {
      toast(`Lỗi kết nối: ${err.message}`, 'error');
    }
  } finally {
    badgeProfileState.loading = false;
    renderBadges();
    if (state.activeTab === 'playtime' || state.activeTab === 'games') {
      if (typeof renderPlaytime === 'function') renderPlaytime();
      else if (typeof renderBadgeRunner === 'function') renderBadgeRunner();
    }
    if (badgeProfileState.modalOpen) {
      renderBadgesModal();
    }
  }
};

window.selectHypeSquadHouse = function(houseId) {
  badgeProfileState.selectedHouseId = houseId;
  renderBadges();
};

window.onBadgeCustomTokenInput = function(val) {
  badgeProfileState.customToken = val;
};

window.claimHypeSquadBadge = async function() {
  const token = getBadgeActiveToken();
  if (!token) {
    toast('Vui lòng kết nối tài khoản hoặc nhập Token trước!', 'warn');
    return;
  }

  const houseId = badgeProfileState.selectedHouseId;
  if (![1, 2, 3].includes(houseId)) {
    toast('Vui lòng chọn 1 ngôi nhà HypeSquad', 'warn');
    return;
  }

  badgeProfileState.submitting = true;
  renderBadges();

  try {
    const res = await fetch('/api/badges/hypesquad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, houseId })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      badgeProfileState.currentHouseId = houseId;
      toast(data.message || 'Lấy huy hiệu HypeSquad thành công!', 'success');
      if (typeof addLog === 'function') {
        addLog('success', `[Huy hiệu] ${data.message}`);
      }
      setTimeout(() => window.loadBadgeProfile(true), 600);
    } else {
      toast(data.error || 'Không thể lấy huy hiệu HypeSquad', 'error');
      if (typeof addLog === 'function') {
        addLog('error', `[Huy hiệu] Lỗi: ${data.error}`);
      }
    }
  } catch (err) {
    toast(`Lỗi kết nối: ${err.message}`, 'error');
  } finally {
    badgeProfileState.submitting = false;
    renderBadges();
  }
};

window.leaveHypeSquadBadge = async function() {
  const token = getBadgeActiveToken();
  if (!token) return;

  badgeProfileState.submitting = true;
  renderBadges();

  try {
    const res = await fetch('/api/badges/hypesquad', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'leave' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      badgeProfileState.currentHouseId = 0;
      toast(data.message || 'Đã rời khỏi HypeSquad!', 'info');
      if (typeof addLog === 'function') addLog('info', '[Huy hiệu] Đã rời khỏi HypeSquad House.');
      setTimeout(() => window.loadBadgeProfile(true), 600);
    } else {
      toast(data.error || 'Không thể rời HypeSquad', 'error');
    }
  } catch (err) {
    toast(`Lỗi kết nối: ${err.message}`, 'error');
  } finally {
    badgeProfileState.submitting = false;
    renderBadges();
  }
};

const BADGE_RARITY_LABELS = {
  2: 'Hiếm',
  3: 'Sử thi',
  4: 'Cực hiếm',
  5: 'Huyền thoại'
};

const BADGE_ACTION_MAP = {
  21: { actionTab: 'playtime', actionText: 'Mở công cụ cày Trò chơi đa dạng ➔' },
  20: { actionTab: 'playtime', actionText: 'Mở công cụ cày Thời gian chơi ➔' },
  14: { actionTab: 'quests', actionText: 'Trang chủ Nhiệm Vụ' },
  16: { actionTab: 'rewards', actionText: 'Cửa Hàng Orb' },
  1: { btnClass: 'badge-nitro-btn', actionUrl: 'https://discord.com/nitro', actionText: 'Nhận Nitro' },
  12: { btnClass: 'btn btn-primary', actionUrl: 'https://discord.com', actionText: 'Nâng cấp một máy chủ' },
  17: { btnClass: 'btn btn-primary', actionTab: 'rewards', actionText: 'Tặng Quà' }
};

function formatDiscordBadgeDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = String(d.getFullYear()).slice(-2);
  return `Đã mở khóa ${day}/${month}/${year}`;
}

function buildDirectoryBadgeDetail(b) {
  const tiers = Array.isArray(b.tiers) ? b.tiers : [];
  const curTier = b.current_tier ? tiers.find(t => t.key === b.current_tier) : null;
  const nextTier = b.next_tier ? tiers.find(t => t.key === b.next_tier) : null;
  const action = BADGE_ACTION_MAP[b.badge_id] || {};

  const icon = b.simple_icon_url || b.simple_icon_raster_url || '';
  const graphic = (b.owned && curTier?.complex_icon_static_url)
    || b.complex_icon_static_url
    || nextTier?.complex_icon_static_url
    || (b.owned && curTier?.simple_icon_url)
    || b.simple_icon_url
    || b.simple_icon_raster_url
    || '';

  const hasNamedCurrentTier = Boolean(b.owned && curTier && curTier.name);
  const eyebrow = hasNamedCurrentTier ? b.name : null;
  const title = hasNamedCurrentTier ? curTier.name : (b.name || `Badge #${b.badge_id}`);

  const rawDate = (b.current_tier && b.tier_obtained_at?.[b.current_tier]) || b.obtained_at || null;
  const formattedDate = b.owned ? formatDiscordBadgeDate(rawDate) : '';

  const timeText = b.info_label || (b.owned ? 'Đã mở khóa' : 'Chưa được mở khóa');
  let dateText = '';
  if (b.owned) {
    if (formattedDate) {
      dateText = formattedDate;
    } else if (b.info_label) {
      dateText = 'Đã mở khóa';
    }
  }

  const effectiveRarity = curTier?.rarity ?? b.rarity ?? 1;
  const rarity = BADGE_RARITY_LABELS[effectiveRarity] || null;

  let progress = null;
  const p = Array.isArray(b.progress) && b.progress.length > 0 ? b.progress[0] : null;
  if (p && nextTier && (b.owned || Number(p.current) > 0)) {
    const floor = Number(p.floor ?? 0);
    const threshold = Number(p.threshold ?? 1);
    const current = Number(p.current ?? 0);
    const span = Math.max(1, threshold - floor);
    const pct = Math.min(100, Math.max(0, Math.round(((current - floor) / span) * 100)));
    progress = {
      curArt: curTier?.simple_icon_url || b.simple_icon_url || icon,
      nextArt: nextTier?.simple_icon_url || b.simple_icon_url || icon,
      timeText: p.progress_helper_text || `${current} / ${threshold}`,
      pct
    };
  }

  const legacyLabel = (b.owned && !b.is_earnable) ? 'Huy Hiệu Kiểu Cũ' : null;
  const desc = b.description || b.leveling_instructions || '';

  const mappedTiers = tiers.map(t => ({
    key: t.key,
    name: t.name || '',
    time: t.milestone_text || '',
    unlocked: Boolean(t.owned),
    isCurrent: Boolean(b.current_tier && t.key === b.current_tier),
    icon: t.simple_icon_url || t.simple_icon_raster_url || icon
  }));

  return {
    badge_id: b.badge_id,
    name: hasNamedCurrentTier ? `${b.name}, ${curTier.name}` : (b.name || ''),
    eyebrow,
    title,
    icon,
    graphic,
    timeText,
    dateText,
    rarity,
    hasProgress: Boolean(progress),
    progress,
    legacyLabel,
    desc,
    btnClass: action.btnClass || null,
    actionTab: action.actionTab || null,
    actionUrl: action.actionUrl || null,
    actionText: action.actionText || null,
    tierLabel: mappedTiers.length > 0 ? `Tất cả các mốc ${b.name} (${mappedTiers.length} Cấp):` : null,
    tiers: mappedTiers
  };
}

function getBadgeIconSrc(b) {
  if (b.houseId) {
    const h = HYPESQUAD_HOUSES.find(x => x.id === b.houseId);
    if (h) return h.icon;
  }
  if (b.id && b.id.startsWith('hypesquad_house_')) {
    const hid = Number(b.id.replace('hypesquad_house_', ''));
    const h = HYPESQUAD_HOUSES.find(x => x.id === hid);
    if (h) return h.icon;
  }
  return b.fullIconUrl || b.iconUrl || null;
}

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

function renderBadges() {
  const root = document.getElementById('badges-view-root');
  if (!root) return;

  const activeAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const token = getBadgeActiveToken();

  // Tự động nạp thông tin huy hiệu khi người dùng mở tab Lấy huy hiệu hoặc Chạy huy hiệu (1 lần cho mỗi token)
  if ((state.activeTab === 'badges' || state.activeTab === 'playtime' || state.activeTab === 'games') && token && badgeProfileState.lastCheckedToken !== token && !badgeProfileState.loading) {
    window.loadBadgeProfile(false);
  }

  const u = badgeProfileState.user;
  const displayName = u?.username || activeAcc?.username || 'Chưa chọn tài khoản';
  const rawUsername = u?.rawUsername || activeAcc?.tag?.replace(/^@/, '') || activeAcc?.rawUsername || '';
  const avatarUrl = u?.avatar || activeAcc?.avatar || '';
  const dirOwned = Array.isArray(u?.directoryBadges)
    ? u.directoryBadges.filter(b => b.owned && !b.hidden)
    : [];
  const badgesList = dirOwned.length > 0
    ? dirOwned.map(b => ({
        id: String(b.badge_id),
        badge_id: b.badge_id,
        name: b.name || `Badge #${b.badge_id}`,
        description: b.info_label || b.name || '',
        iconUrl: b.simple_icon_url || b.simple_icon_raster_url || null,
        fullIconUrl: b.simple_icon_url || b.simple_icon_raster_url || null
      }))
    : (u?.badges || []);
  const visibleBadges = badgesList.slice(0, 6);
  const extraCount = badgesList.length > 6 ? badgesList.length - 6 : 0;

  const badgesHtml = badgeProfileState.loading
    ? `<span class="skeleton" style="width: 96px; height: 26px; display: inline-block; border-radius: 8px; margin-top: 6px;"></span>`
    : (badgesList.length > 0
      ? `
        <div class="discord-profile-badges-bar" onclick="openBadgesModal()" title="Bấm để xem tất cả huy hiệu (${badgesList.length})">
          ${visibleBadges.map(b => {
            const src = getBadgeIconSrc(b);
            const clickAttr = b.badge_id ? `onclick="event.stopPropagation(); openBadgesModal(${b.badge_id})"` : '';
            return src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(b.name)}" class="discord-profile-badge-icon" title="${escapeHtml(b.description || b.name)}" ${clickAttr}>`
              : `<span class="discord-badge-dot" style="width: 10px; height: 10px; background: ${b.color || '#5865F2'};" title="${escapeHtml(b.name)}" ${clickAttr}></span>`;
          }).join('')}
          ${extraCount > 0 ? `<span class="discord-profile-badges-more">+${extraCount}</span>` : ''}
        </div>
      `
      : (Array.isArray(u?.directoryBadges) && u.directoryBadges.length > 0
        ? `<div class="discord-profile-badges-bar" onclick="openBadgesModal()" title="Xem danh mục huy hiệu có thể mở khóa"><span style="font-size: 11px; color: var(--text-sub); padding: 0 4px;">Xem danh mục huy hiệu</span></div>`
        : ''));

  root.innerHTML = `
    <div class="badges-grid">
      <!-- 1. Tài khoản & Huy hiệu hiện tại -->
      <div class="card badge-account-bar">
        <div class="badge-account-left">
          <div class="badge-acc-avatar-wrap">
            ${avatarUrl
              ? `<img src="${escapeHtml(avatarUrl)}" alt="Avatar" class="badge-acc-avatar">`
              : `<div class="acc-avatar-sm" style="width: 48px; height: 48px; font-size: 16px;">${escapeHtml((displayName || 'U').slice(0, 2).toUpperCase())}</div>`}
            ${u?.avatarDecoration ? `<img src="${escapeHtml(u.avatarDecoration)}" alt="" class="badge-acc-decor">` : ''}
          </div>
          <div class="badge-acc-meta">
            <div class="badge-acc-name-row">
              <span class="badge-acc-name">${escapeHtml(displayName)}</span>
              ${rawUsername ? `<span class="badge-acc-handle">@${escapeHtml(rawUsername)}</span>` : ''}
            </div>
            ${badgesHtml}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn-badge-refresh" onclick="loadBadgeProfile(true)" ${badgeProfileState.loading || !token ? 'disabled' : ''}>
            ${badgeProfileState.loading
              ? '<span class="spinner" style="width: 15px; height: 15px;"></span><span>Đang tải...</span>'
              : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg><span>Làm mới</span>'}
          </button>
        </div>
      </div>

      <!-- 2. Chọn ngôi nhà HypeSquad (1-Click) -->
      <div class="card hypesquad-section-card">
        <div class="hypesquad-section-head">
          <div>
            <div class="hypesquad-section-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="color: var(--text-sub); flex-shrink: 0;"><path d="M9.68 13.69L12 11.93l2.31 1.76-.88-2.85L15.75 9h-2.84L12 6.19 11.09 9H8.25l2.31 1.84-.88 2.85zM20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 2.03.76 3.87 2 5.28V23l6-2 6 2v-7.72c1.24-1.41 2-3.25 2-5.28zm-8-6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm0 15l-4 1.02v-3.1c1.18.68 2.54 1.08 4 1.08s2.82-.4 4-1.08v3.1L12 19z"/></svg>
              <span>Discord HypeSquad House</span>
            </div>
            <div class="hypesquad-section-sub">Chọn nhà HypeSquad yêu thích để gắn hoặc đổi huy hiệu trực tiếp trên hồ sơ Discord.</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            ${badgeProfileState.currentHouseId > 0 ? `
              <button class="btn btn-secondary btn-sm" onclick="leaveHypeSquadBadge()" ${badgeProfileState.submitting ? 'disabled' : ''}>
                Rời HypeSquad
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="claimHypeSquadBadge()" ${badgeProfileState.submitting || !token ? 'disabled' : ''}>
              ${badgeProfileState.submitting ? '<span class="spinner"></span> Đang gửi...' : 'Lấy huy hiệu'}
            </button>
          </div>
        </div>

        <div class="hypesquad-houses-grid">
          ${HYPESQUAD_HOUSES.map(h => {
            const isSelected = badgeProfileState.selectedHouseId === h.id;
            const isCurrent = badgeProfileState.currentHouseId === h.id;
            return `
              <div class="house-card ${h.key} ${isSelected ? 'selected' : ''} ${isCurrent ? 'active-house' : ''}" onclick="selectHypeSquadHouse(${h.id})">
                ${isCurrent ? `<span class="house-status-badge">Đang sở hữu</span>` : ''}
                <div class="house-emblem"><img src="${h.icon}" alt="${h.name}" class="house-emblem-img"></div>
                <div class="house-name">${h.name}</div>
                <span class="house-tag-vi">${h.viName}</span>
                <div class="house-desc">${h.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. Thanh điều hướng nhanh tới công cụ cày huy hiệu -->
      <div class="badges-bottom-banner">
        <div class="badges-bottom-banner-text">
          <span style="font-size: 16px;">⚔️</span>
          <span>Bạn muốn cày huy hiệu <strong>Thời gian chơi (5.000+ giờ)</strong> &amp; <strong>Trò chơi đa dạng (100+ game)</strong>?</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.switchTabTo('playtime')">Mở Chạy Huy Hiệu ➔</button>
      </div>
    </div>
  `;
}

window.renderBadges = renderBadges;
