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
  const trText = typeof window.translateDynamicText === 'function' ? window.translateDynamicText : (s => s);
  box.innerHTML = badgeRunnerState.logs.map(l => `
    <div class="log-entry">
      <span class="log-time">[${l.time}]</span>
      <span class="log-lvl-${l.level}">[${l.level.toUpperCase()}]</span>
      <span class="log-msg">${escapeHtml(trText(l.text))}</span>
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
    const usedIds = new Set(getPlaytimeUsedGames(token));
    const fetchLimit = Math.min(500, Math.max(gameCount + Math.min(usedIds.size, 250), gameCount * 2));
    const gamesRes = await fetch(`/api/badges/games?limit=${fetchLimit}&random=true`);
    const gamesData = await gamesRes.json();
    if (!gamesRes.ok || !gamesData.success || !Array.isArray(gamesData.games) || gamesData.games.length === 0) {
      throw new Error(gamesData.error || 'Không thể tải danh sách game từ Discord');
    }

    badgeRunnerState.totalGamesAvailable = gamesData.total || gamesData.games.length;
    const freshGames = gamesData.games.filter(g => !usedIds.has(String(g.id)));
    const fallbackUsedGames = gamesData.games.filter(g => usedIds.has(String(g.id)));
    const selectedGames = [...freshGames, ...fallbackUsedGames].slice(0, gameCount);
    badgeRunnerState.progressTotal = selectedGames.length;

    const skippedCount = Math.max(0, selectedGames.length - freshGames.length);
    if (usedIds.size > 0 && skippedCount === 0) {
      pushRunnerLog('info', `Bắt đầu cày ${selectedGames.length} game mới (đã lọc ${usedIds.size} game từng chạy)...`);
    } else if (skippedCount > 0) {
      pushRunnerLog('info', `Bắt đầu cày ${selectedGames.length} game (${freshGames.length} game mới, ${skippedCount} game bổ sung)...`);
    } else {
      pushRunnerLog('info', `Bắt đầu cày ${selectedGames.length} game...`);
    }

    let analyticsToken = '';
    let heartbeatSession = '';
    let launchSignature = '';
    let clientLaunchId = '';
    let seqOffset = 0;

    const postScience = async (payload) => {
      while (true) {
        const sciRes = await fetch('/api/badges/science', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            analyticsToken,
            heartbeatSession,
            launchSignature,
            clientLaunchId,
            seqOffset,
            ...payload
          })
        });
        const sciData = await sciRes.json();
        if (sciRes.ok && sciData.success) {
          analyticsToken = sciData.analyticsToken || analyticsToken;
          heartbeatSession = sciData.heartbeatSession || heartbeatSession;
          launchSignature = sciData.launchSignature || launchSignature;
          clientLaunchId = sciData.clientLaunchId || clientLaunchId;
          seqOffset = sciData.nextSeq || seqOffset;
          return sciData;
        }
        if (sciData.isRateLimited) {
          const waitSec = Math.ceil(sciData.retryAfter || 5);
          pushRunnerLog('warn', `Bị giới hạn tốc độ, tạm chờ ${waitSec}s...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }
        throw new Error(sciData.error || `Lỗi HTTP ${sciRes.status}`);
      }
    };

    const useRealtime = badgeRunnerState.mode !== 'games_played' && Boolean(badgeRunnerState.realtimeMode);
    const burstGames = useRealtime
      ? (badgeRunnerState.mode === 'both' ? selectedGames.slice(0, -1) : [])
      : selectedGames;

    for (let i = 0; i < burstGames.length; i++) {
      if (badgeRunnerState.shouldStop) {
        pushRunnerLog('warn', 'Đã dừng theo yêu cầu.');
        break;
      }

      const game = burstGames[i];
      const gameIdx = i + 1;
      const totalGames = selectedGames.length;
      const gameTitle = game.name || `Game #${gameIdx}`;
      const burstMode = useRealtime ? 'games_played' : badgeRunnerState.mode;
      const hourTag = burstMode === 'games_played' ? '' : ` (+${hoursPerGame}h)`;

      const sciData = await postScience({
        action: 'burst',
        games: [game],
        hoursPerGame,
        mode: burstMode
      });

      addPlaytimeUsedGames(token, [game.id]);

      badgeRunnerState.progressCurrent += (sciData.gamesProcessed || 1);
      badgeRunnerState.claimedHours = Number((badgeRunnerState.claimedHours + (sciData.hoursAdded || (burstMode === 'games_played' ? 0.016 : hoursPerGame))).toFixed(2));
      pushRunnerLog('success', `[${gameIdx}/${totalGames}] Hoàn tất: ${gameTitle}${hourTag}`);
      renderBadgeRunner();

      if (i < burstGames.length - 1 && !badgeRunnerState.shouldStop) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (useRealtime && !badgeRunnerState.shouldStop) {
      const rtGame = selectedGames[selectedGames.length - 1];
      const targetSec = Math.max(60, Math.round(hoursPerGame * 3600));
      const startRes = await postScience({
        action: 'start',
        games: [rtGame],
        mode: badgeRunnerState.mode
      });
      const sessionId = startRes.sessionId;
      addPlaytimeUsedGames(token, [rtGame.id]);

      pushRunnerLog('info', `Bắt đầu treo heartbeat thật (60s/nhịp) cho "${rtGame.name}" (mục tiêu ${hoursPerGame}h)...`);

      let elapsedSec = 0;
      let sinceLastHbSec = 0;
      const HEARTBEAT_INTERVAL_SEC = 60;

      while (elapsedSec < targetSec && !badgeRunnerState.shouldStop) {
        await new Promise(r => setTimeout(r, 1000));
        elapsedSec += 1;
        sinceLastHbSec += 1;

        if (sinceLastHbSec >= HEARTBEAT_INTERVAL_SEC && elapsedSec < targetSec && !badgeRunnerState.shouldStop) {
          await postScience({
            action: 'heartbeat',
            games: [rtGame],
            sessionId,
            durationMs: sinceLastHbSec * 1000,
            mode: badgeRunnerState.mode
          });
          badgeRunnerState.claimedHours = Number((badgeRunnerState.claimedHours + (sinceLastHbSec / 3600)).toFixed(2));
          pushRunnerLog('success', `[Heartbeat] ${rtGame.name}: +${Math.round(elapsedSec / 60)} phút`);
          sinceLastHbSec = 0;
          renderBadgeRunner();
        }
      }

      if (sinceLastHbSec > 0) {
        await postScience({
          action: 'stop',
          games: [rtGame],
          sessionId,
          durationMs: sinceLastHbSec * 1000,
          mode: badgeRunnerState.mode
        });
        badgeRunnerState.claimedHours = Number((badgeRunnerState.claimedHours + (sinceLastHbSec / 3600)).toFixed(2));
      }

      badgeRunnerState.progressCurrent += 1;
      pushRunnerLog('success', `Đã kết thúc phiên treo "${rtGame.name}" (+${(elapsedSec / 3600).toFixed(2)}h).`);
      renderBadgeRunner();
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
