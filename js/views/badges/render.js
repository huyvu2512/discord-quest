/**
 * BADGES VIEW RENDERER & HELPERS (js/views/badges/render.js)
 */

const BADGE_RARITY_LABELS = {
  2: 'Hiếm',
  3: 'Sử thi',
  4: 'Cực hiếm',
  5: 'Huyền thoại'
};

const BADGE_ACTION_MAP = {
  21: { actionTab: 'playtime', actionText: 'Chạy huy hiệu Trò chơi đa dạng ➔' },
  20: { actionTab: 'playtime', actionText: 'Chạy huy hiệu Thời gian chơi ➔' },
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

      <!-- 3. Thanh chuyển hướng sang tab Chạy huy hiệu -->
      <div class="card badges-bottom-banner" onclick="window.switchTabTo('playtime')">
        <div class="badges-bottom-banner-left">
          <div class="badges-bottom-banner-icon">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div class="badges-bottom-banner-text">
            <div class="badges-bottom-banner-title">Chạy huy hiệu Thời gian chơi &amp; Trò chơi đa dạng</div>
            <div class="badges-bottom-banner-sub">Mở khóa mốc 5.000+ giờ chơi và 100+ trò chơi tự động</div>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.switchTabTo('playtime')">Mở Chạy Huy Hiệu ➔</button>
      </div>
    </div>
  `;
}

window.renderBadges = renderBadges;
