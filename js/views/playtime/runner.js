/**
 * PLAYTIME RUNNER EXECUTION ENGINE (js/views/playtime/runner.js)
 */

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
      pushRunnerLog('success', `Hoàn tất ${badgeRunnerState.progressCurrent} game${summaryHourTag}. Discord đồng bộ huy hiệu ngầm (có thể mất vài phút đến vài giờ).`);
      if (typeof window.loadBadgeProfile === 'function') {
        await window.loadBadgeProfile(true);
        setTimeout(() => {
          if (!badgeRunnerState.isRunning && typeof window.loadBadgeProfile === 'function') {
            window.loadBadgeProfile(true);
          }
        }, 6000);
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
