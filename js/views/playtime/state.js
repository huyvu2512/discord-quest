/**
 * PLAYTIME RUNNER STATE & TIER STATUS HELPERS (js/views/playtime/state.js)
 */

const FALLBACK_PLAYTIME_TIERS = [
  { key: 'recreational', name: 'Giải Trí', milestone_text: '1 giờ', hours: 1 },
  { key: 'amateur', name: 'Giải trí', milestone_text: '5 giờ', hours: 5 },
  { key: 'regular', name: 'Gắn bó', milestone_text: '20 giờ', hours: 20 },
  { key: 'passionate', name: 'Tâm huyết', milestone_text: '75 giờ', hours: 75 },
  { key: 'serious', name: 'Nghiêm túc', milestone_text: '150 giờ', hours: 150 },
  { key: 'devoted', name: 'Tận hiến', milestone_text: '300 giờ', hours: 300 },
  { key: 'veteran', name: 'Lão luyện', milestone_text: '500 giờ', hours: 500 },
  { key: 'hardcore', name: 'Sắt đá', milestone_text: '1.000 giờ', hours: 1000 },
  { key: 'resolute', name: 'Kiên định', milestone_text: '2.000 giờ', hours: 2000 },
  { key: 'eternal', name: 'Vĩnh cửu', milestone_text: '5.000+ giờ', hours: 5000 }
];

const FALLBACK_VARIETY_TIERS = [
  { key: 'sampler', name: 'Người dùng thử', milestone_text: '2 trò chơi', games: 2 },
  { key: 'dabbler', name: 'Người chơi qua', milestone_text: '5 trò chơi', games: 5 },
  { key: 'enthusiast', name: 'Người đam mê', milestone_text: '10 trò chơi', games: 10 },
  { key: 'scout', name: 'Trinh Sát', milestone_text: '15 trò chơi', games: 15 },
  { key: 'explorer', name: 'Người khám phá', milestone_text: '20 trò chơi', games: 20 },
  { key: 'adventurer', name: 'Nhà Thám Hiểm', milestone_text: '30 trò chơi', games: 30 },
  { key: 'voyager', name: 'Nhà du hành', milestone_text: '40 trò chơi', games: 40 },
  { key: 'distinct', name: 'Người khác biệt', milestone_text: '60 trò chơi', games: 60 },
  { key: 'versatile', name: 'Người đa tài', milestone_text: '80 trò chơi', games: 80 },
  { key: 'universalist', name: 'Thuyết phổ quát', milestone_text: '100+ trò chơi', games: 100 }
];

let badgeRunnerState = {
  mode: 'both', // 'both' | 'playtime' | 'games_played'
  realtimeMode: true, // true = heartbeat 60s/nhịp thật; false = gửi nhanh (chủ yếu cho Trò chơi đa dạng)
  gameCount: 10,
  hoursPerGame: 50,
  customToken: '',
  isRunning: false,
  shouldStop: false,
  totalGamesAvailable: 25388,
  progressCurrent: 0,
  progressTotal: 0,
  claimedHours: 0,
  logs: [
    { time: new Date().toTimeString().split(' ')[0], level: 'info', text: 'Sẵn sàng. Chọn chế độ và bấm Bắt đầu.' }
  ]
};

let isFetchingGamesCount = false;
async function loadAvailableGamesCount() {
  if (isFetchingGamesCount) return;
  isFetchingGamesCount = true;
  try {
    const res = await fetch('/api/badges/games?limit=1');
    const data = await res.json();
    if (res.ok && data.success && data.total) {
      badgeRunnerState.totalGamesAvailable = data.total;
      renderBadgeRunner();
    }
  } catch {}
}

function getBadgeRunnerToken() {
  const custom = (badgeRunnerState.customToken || '').trim().replace(/^"|"$/g, '');
  if (custom) return custom;
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  return acc?.token || '';
}

const PLAYTIME_USED_GAMES_STORAGE_KEY = 'dq_playtime_used_games_v1';

function getPlaytimeAccountKey(token) {
  try {
    const raw = String(token || '').trim().split('.')[0];
    if (raw) {
      const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
      const pad = '='.repeat((4 - (b64.length % 4)) % 4);
      const uid = atob(b64 + pad).trim();
      if (/^\d+$/.test(uid)) return uid;
    }
  } catch {}
  return state.activeAccId || 'default';
}

function readAllPlaytimeUsedGames() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAYTIME_USED_GAMES_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getPlaytimeUsedGames(token) {
  const key = getPlaytimeAccountKey(token || getBadgeRunnerToken());
  const map = readAllPlaytimeUsedGames();
  return Array.isArray(map[key]) ? map[key] : [];
}

function addPlaytimeUsedGames(token, gameIds) {
  if (!Array.isArray(gameIds) || gameIds.length === 0) return;
  const key = getPlaytimeAccountKey(token || getBadgeRunnerToken());
  const map = readAllPlaytimeUsedGames();
  const current = new Set(Array.isArray(map[key]) ? map[key].map(String) : []);
  for (const id of gameIds) {
    if (id != null && String(id)) current.add(String(id));
  }
  map[key] = Array.from(current);
  try {
    localStorage.setItem(PLAYTIME_USED_GAMES_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

window.resetPlaytimeUsedGames = function() {
  if (badgeRunnerState.isRunning) return;
  const token = getBadgeRunnerToken();
  const key = getPlaytimeAccountKey(token);
  const map = readAllPlaytimeUsedGames();
  const prevCount = Array.isArray(map[key]) ? map[key].length : 0;
  delete map[key];
  try {
    localStorage.setItem(PLAYTIME_USED_GAMES_STORAGE_KEY, JSON.stringify(map));
  } catch {}
  toast(prevCount > 0 ? `Đã đặt lại danh sách ${prevCount} game đã cày!` : 'Danh sách game đã cày đang trống.', 'info');
  if (typeof renderBadgeRunner === 'function') renderBadgeRunner();
};

window.isPlaytimeRunning = function() {
  return Boolean(typeof badgeRunnerState !== 'undefined' && badgeRunnerState.isRunning);
};

function getDirectoryBadge(badgeId) {
  const dir = Array.isArray(badgeProfileState?.user?.directoryBadges)
    ? badgeProfileState.user.directoryBadges
    : [];
  return dir.find(b => Number(b.badge_id) === Number(badgeId)) || null;
}

function checkIsBadgeMaxed(b) {
  if (!b) return false;
  const tiers = Array.isArray(b.tiers) ? b.tiers : [];
  if (tiers.length > 0) {
    const lastTier = tiers[tiers.length - 1];
    if (lastTier && (lastTier.owned === true || lastTier.key === b.current_tier)) return true;
  }
  if (b.owned && !b.next_tier && b.current_tier) return true;
  if (b.current_tier === 'eternal' || b.current_tier === 'universalist') return true;
  if (Array.isArray(b.progress) && b.progress.length > 0) {
    const cur = Number(b.progress[0].current || 0);
    if (Number(b.badge_id) === 20 && cur >= 5000) return true;
    if (Number(b.badge_id) === 21 && cur >= 100) return true;
  }
  return false;
}

function extractTierIcon(tier, fallbackBadge) {
  if (!tier) return fallbackBadge?.simple_icon_url || fallbackBadge?.simple_icon_raster_url || null;
  return tier.simple_icon_url || tier.simple_icon_raster_url || tier.icon || fallbackBadge?.simple_icon_url || fallbackBadge?.simple_icon_raster_url || null;
}

function getPlaytimeStatus() {
  const b = getDirectoryBadge(20);
  const fallbackTiers = FALLBACK_PLAYTIME_TIERS;
  const isMaxed = checkIsBadgeMaxed(b);

  if (!b) {
    return {
      name: 'Thời gian chơi',
      badgeId: 20,
      owned: false,
      isMaxed: false,
      currentTierKey: null,
      currentTierName: null,
      currentTierIndex: -1,
      currentValue: 0,
      nextValue: 1,
      pct: 0,
      curArt: null,
      nextArt: null,
      helperText: '0 / 1 giờ',
      infoLabel: 'Chưa mở khóa',
      tiers: fallbackTiers.map(t => ({
        key: t.key,
        name: t.name,
        time: t.milestone_text,
        unlocked: false,
        isCurrent: false,
        icon: null
      }))
    };
  }

  const rawTiers = Array.isArray(b.tiers) && b.tiers.length > 0 ? b.tiers : fallbackTiers;
  const currentKey = b.current_tier || null;
  const curIndex = currentKey ? rawTiers.findIndex(t => t.key === currentKey) : -1;

  const prog = Array.isArray(b.progress) && b.progress.length > 0 ? b.progress[0] : null;
  const curVal = prog ? Number(prog.current || 0) : (b.owned ? (curIndex >= 0 ? (fallbackTiers[curIndex]?.hours || 1) : 0) : 0);
  const threshold = prog ? Number(prog.threshold || 5000) : (isMaxed ? 5000 : 1);
  const floor = prog ? Number(prog.floor || 0) : 0;
  const pct = isMaxed ? 100 : Math.min(100, Math.max(0, Math.round(((curVal - floor) / Math.max(1, threshold - floor)) * 100)));

  const mappedTiers = rawTiers.map((t, idx) => {
    const isOwned = Boolean(t.owned) || isMaxed || (b.owned && curIndex >= 0 && idx <= curIndex);
    const isCur = Boolean(b.owned && ((currentKey && t.key === currentKey) || (isMaxed && idx === rawTiers.length - 1)));
    const fb = fallbackTiers[idx] || {};
    return {
      key: t.key || fb.key,
      name: t.name || fb.name,
      time: t.milestone_text || fb.milestone_text,
      unlocked: isOwned,
      isCurrent: isCur,
      icon: t.simple_icon_url || t.simple_icon_raster_url || b.simple_icon_url || null
    };
  });

  const curTierObj = mappedTiers.find(t => t.isCurrent) || (curIndex >= 0 ? mappedTiers[curIndex] : null);

  let curArt = null;
  let nextArt = null;
  if (isMaxed) {
    curArt = extractTierIcon(rawTiers[rawTiers.length - 1], b);
    nextArt = curArt;
  } else if (!b.owned || curIndex < 0) {
    curArt = extractTierIcon(rawTiers[0], b);
    nextArt = extractTierIcon(rawTiers[0], b);
  } else {
    curArt = extractTierIcon(rawTiers[curIndex], b);
    const nextIdx = Math.min(curIndex + 1, rawTiers.length - 1);
    nextArt = extractTierIcon(rawTiers[nextIdx], b);
  }

  return {
    name: b.name || 'Thời gian chơi',
    badgeId: 20,
    owned: Boolean(b.owned),
    isMaxed,
    currentTierKey: currentKey,
    currentTierName: curTierObj?.name || null,
    currentTierIndex: isMaxed ? mappedTiers.length - 1 : curIndex,
    currentValue: curVal,
    nextValue: threshold,
    pct,
    curArt,
    nextArt,
    helperText: isMaxed ? '5.000+ giờ (Đã tối đa)' : `${Math.floor(curVal).toLocaleString('vi-VN')} / ${threshold.toLocaleString('vi-VN')} giờ`,
    infoLabel: isMaxed ? 'Đã đạt cấp tối đa Vĩnh cửu' : (b.info_label || (b.owned ? 'Đang tích lũy' : 'Chưa mở khóa')),
    tiers: mappedTiers
  };
}

function getVarietyStatus() {
  const b = getDirectoryBadge(21);
  const fallbackTiers = FALLBACK_VARIETY_TIERS;
  const isMaxed = checkIsBadgeMaxed(b);

  if (!b) {
    return {
      name: 'Trò chơi đa dạng',
      badgeId: 21,
      owned: false,
      isMaxed: false,
      currentTierKey: null,
      currentTierName: null,
      currentTierIndex: -1,
      currentValue: 0,
      nextValue: 2,
      pct: 0,
      curArt: null,
      nextArt: null,
      helperText: '0 / 2 trò chơi',
      infoLabel: 'Chưa mở khóa',
      tiers: fallbackTiers.map(t => ({
        key: t.key,
        name: t.name,
        time: t.milestone_text,
        unlocked: false,
        isCurrent: false,
        icon: null
      }))
    };
  }

  const rawTiers = Array.isArray(b.tiers) && b.tiers.length > 0 ? b.tiers : fallbackTiers;
  const currentKey = b.current_tier || null;
  const curIndex = currentKey ? rawTiers.findIndex(t => t.key === currentKey) : -1;

  const prog = Array.isArray(b.progress) && b.progress.length > 0 ? b.progress[0] : null;
  const curVal = prog ? Number(prog.current || 0) : (b.owned ? (curIndex >= 0 ? (fallbackTiers[curIndex]?.games || 2) : 0) : 0);
  const threshold = prog ? Number(prog.threshold || 100) : (isMaxed ? 100 : 2);
  const floor = prog ? Number(prog.floor || 0) : 0;
  const pct = isMaxed ? 100 : Math.min(100, Math.max(0, Math.round(((curVal - floor) / Math.max(1, threshold - floor)) * 100)));

  const mappedTiers = rawTiers.map((t, idx) => {
    const isOwned = Boolean(t.owned) || isMaxed || (b.owned && curIndex >= 0 && idx <= curIndex);
    const isCur = Boolean(b.owned && ((currentKey && t.key === currentKey) || (isMaxed && idx === rawTiers.length - 1)));
    const fb = fallbackTiers[idx] || {};
    return {
      key: t.key || fb.key,
      name: t.name || fb.name,
      time: t.milestone_text || fb.milestone_text,
      unlocked: isOwned,
      isCurrent: isCur,
      icon: t.simple_icon_url || t.simple_icon_raster_url || b.simple_icon_url || null
    };
  });

  const curTierObj = mappedTiers.find(t => t.isCurrent) || (curIndex >= 0 ? mappedTiers[curIndex] : null);

  let curArt = null;
  let nextArt = null;
  if (isMaxed) {
    curArt = extractTierIcon(rawTiers[rawTiers.length - 1], b);
    nextArt = curArt;
  } else if (!b.owned || curIndex < 0) {
    curArt = extractTierIcon(rawTiers[0], b);
    nextArt = extractTierIcon(rawTiers[0], b);
  } else {
    curArt = extractTierIcon(rawTiers[curIndex], b);
    const nextIdx = Math.min(curIndex + 1, rawTiers.length - 1);
    nextArt = extractTierIcon(rawTiers[nextIdx], b);
  }

  return {
    name: b.name || 'Trò chơi đa dạng',
    badgeId: 21,
    owned: Boolean(b.owned),
    isMaxed,
    currentTierKey: currentKey,
    currentTierName: curTierObj?.name || null,
    currentTierIndex: isMaxed ? mappedTiers.length - 1 : curIndex,
    currentValue: curVal,
    nextValue: threshold,
    pct,
    curArt,
    nextArt,
    helperText: isMaxed ? '100+ trò chơi (Đã tối đa)' : `${Math.floor(curVal).toLocaleString('vi-VN')} / ${threshold.toLocaleString('vi-VN')} trò chơi`,
    infoLabel: isMaxed ? 'Đã đạt cấp tối đa Thuyết phổ quát' : (b.info_label || (b.owned ? 'Đang tích lũy' : 'Chưa mở khóa')),
    tiers: mappedTiers
  };
}
