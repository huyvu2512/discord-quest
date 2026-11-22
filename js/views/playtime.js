/**
 * VIEW: THỜI GIAN CHƠI (js/views/playtime.js)
 * Tự động cày huy hiệu Thời gian chơi (Game Time) & Trò chơi đa dạng (Game Variety)
 * thông qua Discord Science API (/api/badges/science).
 * Hiển thị trực quan 2 bảng 10 cấp độ và tự động khóa chạy khi đã đạt cấp tối đa.
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

window.isPlaytimeRunning = function() {
  return Boolean(typeof badgeRunnerState !== 'undefined' && badgeRunnerState.isRunning);
};

function pushRunnerLog(level, text) {
  const time = new Date().toTimeString().split(' ')[0];
  badgeRunnerState.logs.push({ time, level, text });
  if (badgeRunnerState.logs.length > 150) badgeRunnerState.logs.shift();
  
  // Gửi trực tiếp vào hệ thống /logs chung toàn app
  const fn = typeof addLog === 'function' ? addLog : (typeof window.addLog === 'function' ? window.addLog : null);
  if (fn) {
    fn(level, `[Playtime] ${text}`);
  }
  renderBadgeRunnerLogsOnly();
}

function renderBadgeRunnerLogsOnly() {
  const box = document.getElementById('badge-runner-console');
  if (!box) return;
  box.innerHTML = badgeRunnerState.logs.map(l => `
    <div class="log-entry">
      <span class="log-time">[${l.time}]</span>
      <span class="log-lvl-${l.level}">[${l.level.toUpperCase()}]</span>
      <span class="log-msg">${escapeHtml(l.text)}</span>
    </div>
  `).join('');
  box.scrollTop = box.scrollHeight;
}

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
      helperText: 'thêm 1 giờ chơi nữa',
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
    helperText: isMaxed ? '5.000+ giờ (Đã tối đa)' : (prog?.progress_helper_text || `${curVal} / ${threshold} giờ`),
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
      helperText: '2 trò chơi nữa',
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
    helperText: isMaxed ? '100+ game (Đã tối đa)' : (prog?.progress_helper_text || `${curVal} / ${threshold} trò chơi`),
    infoLabel: isMaxed ? 'Đã đạt cấp tối đa Thuyết phổ quát' : (b.info_label || (b.owned ? 'Đang tích lũy' : 'Chưa mở khóa')),
    tiers: mappedTiers
  };
}

window.setBadgeRunnerMode = function(mode) {
  if (badgeRunnerState.isRunning) return;
  const playtime = getPlaytimeStatus();
  const variety = getVarietyStatus();

  if (mode === 'playtime' && playtime.isMaxed) {
    toast('Huy hiệu Thời gian chơi đã đạt cấp tối đa (Cấp 10)!', 'info');
    return;
  }
  if (mode === 'games_played' && variety.isMaxed) {
    toast('Huy hiệu Trò chơi đa dạng đã đạt cấp tối đa (Cấp 10)!', 'info');
    return;
  }
  if (mode === 'both' && (playtime.isMaxed || variety.isMaxed)) {
    toast('Một trong hai huy hiệu đã đạt tối đa, chỉ cần cày huy hiệu còn lại!', 'info');
    return;
  }

  badgeRunnerState.mode = mode;
  renderBadgeRunner();
};

window.setBadgeRunnerGames = function(val) {
  if (badgeRunnerState.isRunning) return;
  badgeRunnerState.gameCount = Math.max(1, Math.min(parseInt(val, 10) || 1, 500));
  renderBadgeRunner();
};

window.setBadgeRunnerHours = function(val) {
  if (badgeRunnerState.isRunning) return;
  badgeRunnerState.hoursPerGame = Math.max(1, Math.min(parseInt(val, 10) || 1, 5000));
  renderBadgeRunner();
};

window.setRunnerHoursToMax = function() {
  if (badgeRunnerState.isRunning) return;
  const playtime = getPlaytimeStatus();
  const playtimeNeeded = Math.max(0, 5000 - Math.floor(playtime.currentValue || 0));
  const games = Math.max(1, badgeRunnerState.gameCount || 10);
  badgeRunnerState.hoursPerGame = Math.max(1, Math.ceil(playtimeNeeded / games));
  renderBadgeRunner();
};

window.setRunnerGamesToMax = function() {
  if (badgeRunnerState.isRunning) return;
  const variety = getVarietyStatus();
  const varietyNeeded = Math.max(0, 100 - (variety.currentValue || 0));
  badgeRunnerState.gameCount = Math.max(1, varietyNeeded || 100);
  renderBadgeRunner();
};

window.setRunnerAutoFitMax = function() {
  if (badgeRunnerState.isRunning) return;
  const playtime = getPlaytimeStatus();
  const variety = getVarietyStatus();

  const playtimeNeeded = Math.max(0, 5000 - Math.floor(playtime.currentValue || 0));
  const varietyNeeded = Math.max(0, 100 - (variety.currentValue || 0));

  if (badgeRunnerState.mode === 'games_played') {
    badgeRunnerState.gameCount = Math.max(1, varietyNeeded || 100);
  } else if (badgeRunnerState.mode === 'playtime') {
    const games = Math.max(1, Math.min(badgeRunnerState.gameCount, 100));
    badgeRunnerState.hoursPerGame = Math.max(1, Math.ceil(playtimeNeeded / games));
  } else {
    // Mode both: Cần cả số game đạt 100 và số giờ đạt 5000h
    const targetGames = varietyNeeded > 0 ? Math.max(1, Math.min(varietyNeeded, 100)) : 10;
    badgeRunnerState.gameCount = targetGames;
    badgeRunnerState.hoursPerGame = Math.max(1, Math.ceil(playtimeNeeded / targetGames));
  }

  const est = (badgeRunnerState.gameCount * badgeRunnerState.hoursPerGame).toLocaleString('vi-VN');
  toast(`Đã tự động tính vừa đủ mốc cuối Cấp 10: ${badgeRunnerState.gameCount} game x ${badgeRunnerState.hoursPerGame}h = ${est}h`, 'success');
  renderBadgeRunner();
};

window.onBadgeRunnerTokenInput = function(val) {
  badgeRunnerState.customToken = val;
};

window.stopBadgeRunner = function() {
  if (!badgeRunnerState.isRunning) return;
  badgeRunnerState.shouldStop = true;
  pushRunnerLog('warn', 'Đang yêu cầu dừng sau đợt gửi hiện tại...');
};

window.startBadgeRunner = async function() {
  if (badgeRunnerState.isRunning) return;

  if (typeof window.isQuestRunning === 'function' && window.isQuestRunning()) {
    toast('Nhiệm vụ Quest đang chạy! Vui lòng dừng Quest trước khi chạy Playtime.', 'warn');
    pushRunnerLog('warn', 'Không thể khởi chạy: Đang có nhiệm vụ Quest chạy song song.');
    return;
  }

  const token = getBadgeRunnerToken();
  if (!token) {
    toast('Vui lòng kết nối tài khoản hoặc nhập Token trước!', 'warn');
    return;
  }

  const playtime = getPlaytimeStatus();
  const variety = getVarietyStatus();

  if (playtime.isMaxed && variety.isMaxed) {
    toast('Tài khoản đã đạt cấp tối đa cho cả 2 huy hiệu!', 'info');
    return;
  }

  if (badgeRunnerState.mode === 'playtime' && playtime.isMaxed) {
    toast('Huy hiệu Thời gian chơi đã đạt tối đa, vui lòng chọn Trò chơi đa dạng!', 'warn');
    return;
  }

  if (badgeRunnerState.mode === 'games_played' && variety.isMaxed) {
    toast('Huy hiệu Trò chơi đa dạng đã đạt tối đa, vui lòng chọn Thời gian chơi!', 'warn');
    return;
  }

  const gameCount = Math.max(1, Math.min(parseInt(badgeRunnerState.gameCount, 10) || 10, 500));
  const hoursPerGame = badgeRunnerState.mode === 'games_played' ? 0.016 : Math.max(1, Math.min(parseInt(badgeRunnerState.hoursPerGame, 10) || 10, 5000));

  badgeRunnerState.isRunning = true;
  badgeRunnerState.shouldStop = false;
  badgeRunnerState.progressCurrent = 0;
  badgeRunnerState.progressTotal = gameCount;
  badgeRunnerState.claimedHours = 0;
  renderBadgeRunner();
  if (typeof renderAll === 'function') renderAll();

  try {
    const gamesRes = await fetch(`/api/badges/games?limit=${gameCount}&random=true`);
    const gamesData = await gamesRes.json();
    if (!gamesRes.ok || !gamesData.success || !Array.isArray(gamesData.games) || gamesData.games.length === 0) {
      throw new Error(gamesData.error || 'Không thể tải danh sách game từ Discord');
    }

    badgeRunnerState.totalGamesAvailable = gamesData.total || gamesData.games.length;
    const selectedGames = gamesData.games.slice(0, gameCount);
    badgeRunnerState.progressTotal = selectedGames.length;

    pushRunnerLog('info', `Bắt đầu cày ${selectedGames.length} game...`);

    let analyticsToken = '';
    let heartbeatSession = '';
    let launchSignature = '';
    let seqOffset = 0;

    for (let i = 0; i < selectedGames.length; i++) {
      if (badgeRunnerState.shouldStop) {
        pushRunnerLog('warn', 'Đã dừng theo yêu cầu.');
        break;
      }

      const game = selectedGames[i];
      const gameIdx = i + 1;
      const totalGames = selectedGames.length;
      const gameTitle = game.name || `Game #${gameIdx}`;
      const hourTag = badgeRunnerState.mode === 'games_played' ? '' : ` (+${hoursPerGame}h)`;

      const sciRes = await fetch('/api/badges/science', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          games: [game],
          hoursPerGame,
          mode: badgeRunnerState.mode,
          analyticsToken,
          heartbeatSession,
          launchSignature,
          seqOffset
        })
      });

      const sciData = await sciRes.json();

      if (!sciRes.ok || !sciData.success) {
        if (sciData.isRateLimited) {
          const waitSec = Math.ceil(sciData.retryAfter || 5);
          pushRunnerLog('warn', `Bị giới hạn tốc độ, tạm chờ ${waitSec}s...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          i--;
          continue;
        }
        throw new Error(sciData.error || `Lỗi HTTP ${sciRes.status}`);
      }

      analyticsToken = sciData.analyticsToken || analyticsToken;
      heartbeatSession = sciData.heartbeatSession || heartbeatSession;
      launchSignature = sciData.launchSignature || launchSignature;
      seqOffset = sciData.nextSeq || seqOffset;

      badgeRunnerState.progressCurrent += (sciData.gamesProcessed || 1);
      badgeRunnerState.claimedHours = Number((badgeRunnerState.claimedHours + (sciData.hoursAdded || (badgeRunnerState.mode === 'games_played' ? 0.016 : hoursPerGame))).toFixed(2));
      pushRunnerLog('success', `[${gameIdx}/${totalGames}] Hoàn tất: ${gameTitle}${hourTag}`);
      renderBadgeRunner();

      if (i < selectedGames.length - 1 && !badgeRunnerState.shouldStop) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!badgeRunnerState.shouldStop) {
      const summaryHourTag = badgeRunnerState.mode === 'games_played' ? '' : ` (+${badgeRunnerState.claimedHours}h)`;
      toast(`Hoàn tất cày ${badgeRunnerState.progressCurrent} game${summaryHourTag}!`, 'success');
      pushRunnerLog('success', `Hoàn tất ${badgeRunnerState.progressCurrent} game${summaryHourTag}.`);
      if (typeof window.loadBadgeProfile === 'function') {
        await window.loadBadgeProfile(true);
      }
    }
  } catch (err) {
    toast(err.message || 'Lỗi khi chạy huy hiệu', 'error');
    pushRunnerLog('error', err.message || 'Lỗi không xác định');
  } finally {
    badgeRunnerState.isRunning = false;
    badgeRunnerState.shouldStop = false;
    renderBadgeRunner();
    if (typeof renderAll === 'function') renderAll();
  }
};

window.autoScrollRunnerTiers = function() {
  ['playtime', 'variety'].forEach(type => {
    const grid = document.getElementById(`runner-tier-grid-${type}`);
    if (!grid) return;
    
    // Tự động tìm mốc mà tài khoản đã đạt được
    const activeSlot = grid.querySelector('.runner-tier-slot.current') 
      || grid.querySelector('.runner-tier-slot.unlocked:last-of-type');
    
    if (activeSlot) {
      const slotLeft = activeSlot.offsetLeft;
      const slotWidth = activeSlot.offsetWidth;
      const gridWidth = grid.clientWidth;
      
      // Nếu mốc này vượt qua 5 ô đầu tiên, web tự động cuộn mượt sang mốc đó
      if (slotLeft + slotWidth > gridWidth) {
        const targetScroll = slotLeft - (gridWidth / 2) + (slotWidth / 2);
        grid.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
        return;
      }
    }
    
    // Mặc định ở mốc đầu hoặc chưa mở khóa
    grid.scrollTo({ left: 0, behavior: 'smooth' });
  });
};

function renderBadgeRunner() {
  const root = document.getElementById('playtime-view-root') || document.getElementById('badge-runner-view-root');
  if (!root) return;

  const token = getBadgeRunnerToken();
  const activeAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];

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
          <div class="runner-card-acc">
            Tài khoản: <strong>${escapeHtml(activeAcc?.username || 'Chưa kết nối')}</strong>
          </div>
        </div>

        ${isBothMaxed ? `
          <div class="runner-maxed-banner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span>Tài khoản này đã mở khóa tối đa tất cả 10 cấp của cả 2 huy hiệu!</span>
          </div>
        ` : isQuestActive ? `
          <div class="runner-warning-banner" style="background: rgba(240, 178, 50, 0.12); border: 1px solid rgba(240, 178, 50, 0.35); border-radius: 6px; padding: 7px 10px; margin-bottom: 12px; font-size: 11.5px; color: #f0b232; display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex-shrink: 0;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <span>Đang có nhiệm vụ Quest chạy song song. Vui lòng dừng Quest trước khi bắt đầu cày Playtime.</span>
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
