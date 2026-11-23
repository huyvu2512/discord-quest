/**
 * PLAYTIME RUNNER FORM CONTROLS (js/views/playtime/controls.js)
 */

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

window.refreshPlaytimeStatus = async function() {
  const btn = document.getElementById('btn-refresh-playtime');
  if (btn?.disabled) return;
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px;"></span><span>Đang tải...</span>`;
  }
  try {
    if (typeof window.loadBadgeProfile === 'function') {
      await window.loadBadgeProfile(true);
    }
    if (typeof pushRunnerLog === 'function') {
      pushRunnerLog('info', 'Đã làm mới dữ liệu huy hiệu từ Discord.');
    }
    toast('Đã làm mới trạng thái huy hiệu!', 'success');
  } catch (err) {
    toast(`Lỗi làm mới: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
};
