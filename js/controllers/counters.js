/**
 * CONTROLLER: BỘ ĐẾM, SIDEBAR & ĐIỀU PHỐI RENDER (js/controllers/counters.js)
 */

function extractCompletedQuestsFromBadges(user) {
  const badges = Array.isArray(user?.directoryBadges) ? user.directoryBadges : [];
  const questBadge = badges.find(b => Number(b.badge_id) === 14 || b.id === 'quest_completed');
  if (!questBadge) return null;

  let count = null;
  if (Array.isArray(questBadge.progress) && questBadge.progress.length > 0 && Number.isFinite(Number(questBadge.progress[0].current))) {
    count = Number(questBadge.progress[0].current);
  } else if (typeof questBadge.info_label === 'string') {
    const m = questBadge.info_label.match(/(\d[\d.,]*)/);
    if (m) {
      const parsed = parseInt(m[1].replace(/[.,]/g, ''), 10);
      if (Number.isFinite(parsed)) count = parsed;
    }
  }

  const iconUrl = questBadge.simple_icon_url || questBadge.simple_icon_raster_url || null;
  return { count, iconUrl };
}

function renderCounters() {
  const hasAcc = state.accounts.length > 0;
  const currentAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const activeOrbs = (currentAcc && currentAcc.orbs != null) ? currentAcc.orbs : 0;
  const orbsEl = document.getElementById("nav-orbs");
  if (orbsEl) orbsEl.textContent = hasAcc ? `${activeOrbs.toLocaleString()} Orbs` : "—";

  const completedQuestsEl = document.getElementById("nav-completed-quests");
  const questBadgeIconEl = document.getElementById("nav-quest-badge-icon");
  const questBadgeFallbackEl = document.getElementById("nav-quest-badge-fallback");

  let completedQuests = currentAcc && currentAcc.completedQuestsTotal != null ? currentAcc.completedQuestsTotal : null;
  let questIconUrl = currentAcc && currentAcc.questBadgeIconUrl ? currentAcc.questBadgeIconUrl : null;

  if (typeof badgeProfileState !== 'undefined' && badgeProfileState?.user && currentAcc && !badgeProfileState.customToken) {
    const sameUser = !badgeProfileState.user.id || !currentAcc.id || String(badgeProfileState.user.id) === String(currentAcc.id);
    if (sameUser) {
      const extracted = extractCompletedQuestsFromBadges(badgeProfileState.user);
      if (extracted) {
        if (extracted.count != null) {
          completedQuests = extracted.count;
          currentAcc.completedQuestsTotal = extracted.count;
        }
        if (extracted.iconUrl) {
          questIconUrl = extracted.iconUrl;
          currentAcc.questBadgeIconUrl = extracted.iconUrl;
        }
      }
    }
  }

  if (completedQuestsEl) {
    completedQuestsEl.textContent = (hasAcc && completedQuests != null) ? `${completedQuests.toLocaleString()} Quest` : "—";
  }
  if (questBadgeIconEl && questBadgeFallbackEl) {
    if (hasAcc && questIconUrl) {
      if (questBadgeIconEl.src !== questIconUrl) questBadgeIconEl.src = questIconUrl;
      questBadgeIconEl.style.display = "block";
      questBadgeFallbackEl.style.display = "none";
    } else {
      questBadgeIconEl.style.display = "none";
      questBadgeFallbackEl.style.display = "";
    }
  }

  const runningCount = state.quests.filter(q => q.status === "running").length;
  const queuedCount = state.quests.filter(q => q.status === "queued").length;

  const btnRunAll = document.getElementById("btn-run-all");
  const btnStopAll = document.getElementById("btn-stop-all");
  if (btnRunAll && btnStopAll) {
    if (state.isRunningAll) {
      btnRunAll.classList.add("hidden");
      btnStopAll.classList.remove("hidden");
    } else {
      btnRunAll.classList.remove("hidden");
      btnStopAll.classList.add("hidden");
      if (typeof window.isPlaytimeRunning === 'function' && window.isPlaytimeRunning()) {
        btnRunAll.title = "Đang chạy Playtime, vui lòng dừng Playtime trước khi chạy Quest";
      } else {
        btnRunAll.title = "";
      }
    }
  }

  const countRunning = document.getElementById("count-running");
  if (countRunning) {
    const val = hasAcc ? runningCount : 0;
    countRunning.textContent = val;
    countRunning.style.display = val > 0 ? "inline-flex" : "none";
  }

  const countAll = document.getElementById("count-all");
  if (countAll) {
    if (!hasAcc || state.isSyncingQuests) {
      countAll.style.display = "none";
    } else {
      const now = Date.now();
      const val = state.quests.filter(q => {
        if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord')) return false;
        const isExpired = q.isExpired || (q.expiresAt && new Date(q.expiresAt).getTime() <= now);
        if (isExpired) return false;
        return q.status !== "completed" && q.status !== "claimed";
      }).length;
      countAll.textContent = val;
      countAll.style.display = val > 0 ? "inline-flex" : "none";
    }
  }

  const countRewards = document.getElementById("count-rewards");
  if (countRewards) {
    if (!hasAcc || state.isSyncingQuests) {
      countRewards.style.display = "none";
    } else {
      const rewardCount = typeof getRewardItems === "function" 
        ? getRewardItems().length 
        : state.quests.filter(q => q.hasGiftCode || q.code).length;
      countRewards.textContent = rewardCount;
      countRewards.style.display = rewardCount > 0 ? "inline-flex" : "none";
    }
  }

  const sumProgress = document.getElementById("summary-progress-text");
  if (sumProgress) {
    if (!hasAcc) {
      sumProgress.textContent = "Chưa kết nối tài khoản";
    } else if (state.isSyncingQuests) {
      sumProgress.innerHTML = `<span class="skeleton" style="width: 220px; height: 12px; display: inline-block; vertical-align: middle;"></span>`;
    } else {
      const now = Date.now();
      const validQuests = state.quests.filter(q => {
        if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord')) return false;
        const isExpired = q.isExpired || (q.expiresAt && new Date(q.expiresAt).getTime() <= now);
        return !isExpired;
      });
      const done = validQuests.filter(q => q.status === "completed" || q.status === "claimed").length;
      sumProgress.textContent = `${runningCount} đang chạy • ${queuedCount} trong hàng đợi • ${done}/${validQuests.length} xong`;
    }
  }
}

function renderSidebarUser() {
  const box = document.getElementById("sidebar-account-box");
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const nameEl = document.getElementById("sidebar-acc-name");
  const tagEl = document.getElementById("sidebar-acc-tag");
  const initialsEl = document.getElementById("sidebar-avatar-initials");
  const avatarImg = document.getElementById("sidebar-avatar-img");

  if (!acc) {
    if (box) box.style.display = "none";
    return;
  }

  if (box) box.style.display = "flex";
  if (nameEl) nameEl.textContent = acc.username;
  if (tagEl) tagEl.textContent = acc.tag;

  if (acc.avatar) {
    if (avatarImg) {
      avatarImg.src = acc.avatar;
      avatarImg.classList.remove("hidden");
    }
    if (initialsEl) initialsEl.classList.add("hidden");
  } else {
    if (avatarImg) avatarImg.classList.add("hidden");
    if (initialsEl) {
      initialsEl.classList.remove("hidden");
      initialsEl.textContent = (acc.username || "U").slice(0, 2).toUpperCase();
    }
  }
}

function renderAll() {
  if (typeof updateNavGating === "function") updateNavGating();
  renderCounters();
  renderSidebarUser();
  if (typeof renderAccounts === "function") renderAccounts();
  if (typeof renderQuests === "function") renderQuests();
  if (typeof renderRewards === "function") renderRewards();
  if (state.activeTab === "badges" && typeof renderBadges === "function") renderBadges();
  if (state.activeTab === "playtime") {
    if (typeof renderPlaytime === "function") renderPlaytime();
    else if (typeof renderBadgeRunner === "function") renderBadgeRunner();
  }
  if (typeof renderLogs === "function") renderLogs();
  if (typeof renderHome === "function") renderHome();
  if (typeof window.translateDomTree === "function") window.translateDomTree(document.body);
}
