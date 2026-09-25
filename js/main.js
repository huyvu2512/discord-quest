/**
 * MAIN CONTROLLER (js/main.js)
 * Điều phối xử lý HÀNG ĐỢI LẦN LƯỢT (Sequential Queue), check token, skeleton loading.
 */

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindActionButtons();
  bindTokenChecking();
  initIPFetcher();

  // Đảm bảo luôn tự động chọn tài khoản nếu đã có tài khoản lưu trong máy
  if (state.accounts.length > 0 && (!state.activeAccId || !state.accounts.some(a => a.id === state.activeAccId))) {
    state.activeAccId = state.accounts[0].id;
    saveState();
  }

  updateNavGating();
  renderAll();
  checkSessionOnStartup();
  syncQuestsFromDiscord(false);

  // Kích hoạt tab ban đầu theo URL đường dẫn (VD: /accounts, /quests, hoặc / cho trang chủ)
  const initialTab = getTabFromUrl();
  window.switchTabTo(initialTab, false);

  window.addEventListener("popstate", () => {
    const tab = getTabFromUrl();
    window.switchTabTo(tab, false);
  });

  // Vòng lặp tiến trình thật: CHỈ GỬI TIẾN TRÌNH CHO ĐÚNG 1 QUEST ĐANG CHẠY (Lần lượt)
  let isSendingProgress = false;
  setInterval(async () => {
    if (state.accounts.length === 0 || isSendingProgress) return;

    const current = state.quests.find(q => q.status === "running");
    if (!current) return;

    const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
    if (!acc || !acc.token) return;

    isSendingProgress = true;
    try {
      // 1. Tự động enroll nếu quest chưa được ghi nhận đã enroll
      if (!current.enrolledAt) {
        addLog("info", `[Auto] Tự động nhận Quest "${current.name}" trên Discord...`);
        const enrollRes = await fetch("/api/quests/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: acc.token, questId: current.id })
        });
        const enrollData = await enrollRes.json();
        if (enrollRes.ok && enrollData.success) {
          current.enrolledAt = new Date().toISOString();
          addLog("success", `[Auto] Nhận Quest "${current.name}" thành công.`);
        } else {
          // Bắt trường hợp Quest đã hết hạn hoặc không thể nhận trên Discord -> XÓA HẲN KHỎI DANH SÁCH
          const isExp = enrollData.isExpired || enrollData.error?.includes("hết hạn") || enrollData.error?.includes("expired") || enrollData.code === 260017;
          addLog("error", `[Đã lọc bỏ] "${current.name}" ${isExp ? 'đã hết hạn trên Discord' : (enrollData.error || 'không thể tham gia')}. Đã xóa khỏi danh sách.`);
          
          // Xóa ngay lập tức khỏi state.quests để không còn xuất hiện trong nhóm nhiệm vụ
          state.quests = state.quests.filter(item => item.id !== current.id);

          // Tự động kích hoạt quest hợp lệ tiếp theo trong hàng đợi
          const nextQ = state.quests.find(q => (q.status === "queued" || q.status === "pending") && !q.isExpired);
          if (nextQ) {
            nextQ.status = "running";
            addLog("info", `[Hàng đợi] Tự động chuyển sang: "${nextQ.name}"...`);
          } else {
            const btnRun = document.getElementById("btn-run-all");
            const btnStop = document.getElementById("btn-stop-all");
            btnRun?.classList.remove("hidden");
            btnStop?.classList.add("hidden");
            addLog("info", `[Auto] Đã hoàn tất hoặc không còn quest hợp lệ trong hàng đợi.`);
          }
          saveState();
          renderCounters();
          if (state.activeTab === "runner") renderRunner();
          if (state.activeTab === "quests") renderQuests();
          return; // Dừng lại, không gửi heartbeat vô ích
        }
      }

      // 2. Gửi tiến độ thật (Heartbeat hoặc Video Progress)
      const nextTimestamp = Math.min(current.targetSec, current.progSec + 7);
      const isTerminal = nextTimestamp >= current.targetSec;

      const progRes = await fetch("/api/quests/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: acc.token,
          questId: current.id,
          taskType: current.taskType,
          applicationId: current.applicationId,
          timestamp: nextTimestamp,
          terminal: isTerminal
        })
      });

      const progData = await progRes.json();
      if (progRes.ok && progData.success) {
        const uStatus = progData.user_status;
        const discordProg = uStatus?.progress?.[current.taskType]?.value;
        if (typeof discordProg === 'number') {
          current.progSec = Math.min(current.targetSec, discordProg);
        } else {
          current.progSec = nextTimestamp;
        }

        const isCompleted = uStatus?.completed_at || (current.progSec >= current.targetSec);

        if (isCompleted) {
          current.status = "completed";
          current.progSec = current.targetSec;
          addLog("success", `★ Hoàn thành nhiệm vụ "${current.name}" (100%)!`);
          toast(`Hoàn thành: "${current.name}"! Bấm "Nhận quà ↗" để mở Discord`, "success");

          // Tự động chuyển tiếp sang quest tiếp theo trong hàng đợi
          const nextQ = state.quests.find(item => (item.status === "queued" || item.status === "pending") && item.id !== current.id);
          if (nextQ) {
            nextQ.status = "running";
            addLog("info", `[Hàng đợi] Tự động chuyển tiếp sang: "${nextQ.name}"...`);
            toast(`Bắt đầu: ${nextQ.name}`, "info");
            if (typeof window.startQuest === 'function') {
              window.startQuest(nextQ.id);
            }
          } else {
            addLog("success", `★ Toàn bộ nhiệm vụ trong hàng đợi đã hoàn tất!`);
          }
        } else {
          addLog("info", `[Tiến độ] "${current.name}": ${fmtSec(current.progSec)} / ${fmtSec(current.targetSec)}`);
        }
      } else {
        addLog("error", `[Tiến độ] Gửi thất bại cho "${current.name}": ${progData.error || 'Chưa thể cập nhật tiến trình'}`);
        // Nếu nhiệm vụ gặp lỗi không hợp lệ hoặc hết hạn -> XÓA HẲN
        if (progData.error?.includes("hết hạn") || progData.error?.includes("expired") || progData.status === 400) {
          addLog("error", `[Đã lọc bỏ] "${current.name}" đã hết hạn trên Discord. Đã xóa khỏi danh sách.`);
          state.quests = state.quests.filter(item => item.id !== current.id);
          const nextQ = state.quests.find(q => (q.status === "queued" || q.status === "pending") && !q.isExpired);
          if (nextQ) {
            nextQ.status = "running";
            addLog("info", `[Hàng đợi] Tự động chuyển tiếp sang: "${nextQ.name}"...`);
          }
          if (state.activeTab === "quests") renderQuests();
        }
      }
    } catch (err) {
      console.warn("Lỗi gửi tiến độ:", err);
    } finally {
      isSendingProgress = false;
      saveState();
      renderCounters();
      if (state.activeTab === "runner") renderRunner();
      if (state.activeTab === "rewards") renderRewards();
      if (state.activeTab === "quests") renderQuests();
    }
  }, 6000);
});

// Chuyển tab với hiệu ứng Skeleton Loading & Điều hướng URL theo miền /
window.switchTabTo = function(tab, updateHistory = true) {
  const validTabs = ["home", "accounts", "runner", "quests", "rewards", "logs", "settings"];
  if (!validTabs.includes(tab)) tab = "home";

  if (state.accounts.length === 0 && (tab === "runner" || tab === "quests" || tab === "rewards")) {
    toast("Vui lòng thêm tài khoản trước!", "warn");
    tab = "accounts";
  }

  state.activeTab = tab;

  // Cập nhật đường dẫn URL trên thanh địa chỉ trình duyệt
  if (updateHistory) {
    const targetPath = tab === "home" ? "/" : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, "", targetPath);
    }
  }

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("active", c.id === `tab-${tab}`));
  renderSidebarUser();

  // Kích hoạt Skeleton loading cho bảng tương ứng
  if (tab === "accounts") showTableSkeleton("accounts-tbody", 2, 6);
  if (tab === "runner") showTableSkeleton("runner-tbody", 4, 6);
  if (tab === "quests") showTableSkeleton("quests-tbody", 5, 6);
  if (tab === "rewards") showTableSkeleton("rewards-tbody", 2, 6);

  setTimeout(() => {
    renderAll();
  }, 280);
};

function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      window.switchTabTo(tab);
    });
  });
}

// Khóa hoặc mở các tab dựa trên việc đã có tài khoản hay chưa
function updateNavGating() {
  const hasAccount = state.accounts.length > 0;
  const lockedTabs = ["runner", "quests", "rewards"];

  lockedTabs.forEach(tabName => {
    const btn = document.getElementById(`nav-btn-${tabName}`);
    if (btn) {
      btn.classList.toggle("disabled", !hasAccount);
      btn.title = hasAccount ? "" : "Cần kết nối tài khoản trước";
    }
  });

  const btnRefresh = document.getElementById("btn-refresh");
  const btnRunAll = document.getElementById("btn-run-all");
  if (btnRefresh) btnRefresh.disabled = !hasAccount;
  if (btnRunAll) btnRunAll.disabled = !hasAccount;
}

function bindActionButtons() {
  const btnRunAll = document.getElementById("btn-run-all");
  const btnStopAll = document.getElementById("btn-stop-all");

  btnRunAll?.addEventListener("click", () => {
    if (state.accounts.length === 0) {
      toast("Vui lòng thêm tài khoản trước!", "warn");
      window.switchTabTo("accounts");
      return;
    }

    let hasRunning = state.quests.some(q => q.status === "running");

    state.quests.forEach(q => {
      if (q.status === "pending" && !q.isExpired) q.status = "queued";
    });

    if (!hasRunning) {
      const first = state.quests.find(q => q.status === "queued" && !q.isExpired);
      if (first) {
        first.status = "running";
        addLog("info", `[Hàng đợi] Bắt đầu chạy nhiệm vụ đầu tiên: "${first.name}"...`);
      }
    }

    btnRunAll.classList.add("hidden");
    btnStopAll.classList.remove("hidden");
    addLog("info", "Đã kích hoạt chế độ: Chạy lần lượt từng quest theo thứ tự hàng đợi.");
    toast("Bắt đầu chạy lần lượt theo hàng đợi", "info");
    saveState();
    renderAll();
  });

  btnStopAll?.addEventListener("click", () => {
    state.quests.forEach(q => {
      if (q.status === "running" || q.status === "queued") {
        q.status = "pending";
      }
    });
    btnStopAll.classList.add("hidden");
    btnRunAll.classList.remove("hidden");
    addLog("warn", "Đã dừng toàn bộ hàng đợi tự động.");
    toast("Đã dừng hàng đợi", "warn");
    saveState();
    renderAll();
  });

  // Quét Quest có Skeleton Loading
  document.getElementById("btn-refresh")?.addEventListener("click", async () => {
    if (state.accounts.length === 0) return;

    const btn = document.getElementById("btn-refresh");
    btn.classList.add("loading");
    btn.innerHTML = `<span class="spinner"></span> Đang quét...`;

    // Hiển thị Skeleton loading trên cả 2 bảng
    showTableSkeleton("runner-tbody", 4, 6);
    showTableSkeleton("quests-tbody", 5, 6);

    await window.syncQuestsFromDiscord(true);

    btn.classList.remove("loading");
    btn.innerHTML = `Quét Quest`;
  });

  // Filter Buttons
  document.querySelectorAll(".btn-filter").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".btn-filter").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      state.filter = b.dataset.filter;
      showTableSkeleton("quests-tbody", 3, 6);
      setTimeout(() => renderQuests(), 200);
    });
  });

  // Search input
  document.getElementById("input-quest-search")?.addEventListener("input", e => {
    state.search = e.target.value.toLowerCase();
    renderQuests();
  });

  // Khởi tạo điều khiển Custom Select & Tải Log
  if (typeof initLogControls === "function") {
    initLogControls();
  }

  // Khởi tạo Cài Đặt Hệ Thống
  bindSettings();

  // Modal open/close
  const modal = document.getElementById("modal-add-account");
  document.getElementById("btn-open-add-account")?.addEventListener("click", () => {
    modal.classList.add("open");
    resetTokenCheckForm();
  });
  document.getElementById("btn-close-modal")?.addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("btn-cancel-modal")?.addEventListener("click", () => modal.classList.remove("open"));

  // Đóng modal khi bấm ra ngoài khung (backdrop)
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });

  // Đóng modal khi nhấn phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("open")) {
      modal.classList.remove("open");
    }
  });

  document.getElementById("link-guide-token")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("token-guide-box")?.classList.toggle("hidden");
  });

  const copySnippet = () => {
    const input = document.getElementById("code-token-snippet");
    if (!input) return;
    navigator.clipboard.writeText(input.value).then(() => {
      toast("Đã copy lệnh Console vào Clipboard!", "success");
    }).catch(() => {
      input.select();
      document.execCommand("copy");
      toast("Đã copy lệnh Console vào Clipboard!", "success");
    });
  };

  document.getElementById("btn-copy-token-snippet")?.addEventListener("click", copySnippet);
  document.getElementById("code-token-snippet")?.addEventListener("click", copySnippet);
}

// ==================== CÀI ĐẶT HỆ THỐNG ====================
window.stepSetting = function(id, delta, min, max) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = parseInt(el.value, 10) || min;
  val = Math.max(min, Math.min(max, val + delta));
  el.value = val;
};

function bindSettings() {
  const btnSave = document.getElementById("btn-save-settings");
  const btnReset = document.getElementById("btn-reset-settings");

  // Load saved settings từ localStorage
  try {
    const raw = localStorage.getItem("dqt_settings");
    if (raw) {
      const s = JSON.parse(raw);
      if (s.autoClaim !== undefined) {
        const el = document.getElementById("set-auto-claim");
        if (el) el.checked = s.autoClaim;
      }
      if (s.autoEnroll !== undefined) {
        const el = document.getElementById("set-auto-enroll");
        if (el) el.checked = s.autoEnroll;
      }
      if (s.videoInterval !== undefined) {
        const el = document.getElementById("set-video-interval");
        if (el) el.value = s.videoInterval;
      }
      if (s.gameInterval !== undefined) {
        const el = document.getElementById("set-game-interval");
        if (el) el.value = s.gameInterval;
      }
      if (s.randomJitter !== undefined) {
        const el = document.getElementById("set-random-jitter");
        if (el) el.checked = s.randomJitter;
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc cài đặt:", e);
  }

  btnSave?.addEventListener("click", () => {
    const s = {
      autoClaim: document.getElementById("set-auto-claim")?.checked ?? true,
      autoEnroll: document.getElementById("set-auto-enroll")?.checked ?? true,
      videoInterval: parseInt(document.getElementById("set-video-interval")?.value, 10) || 7,
      gameInterval: parseInt(document.getElementById("set-game-interval")?.value, 10) || 60,
      randomJitter: document.getElementById("set-random-jitter")?.checked ?? true
    };
    localStorage.setItem("dqt_settings", JSON.stringify(s));
    toast("Đã lưu cài đặt hệ thống!", "success");
    addLog("info", `[Cài đặt] Đã lưu: AutoClaim=${s.autoClaim ? 'Bật' : 'Tắt'}, Video=${s.videoInterval}s, Game=${s.gameInterval}s`);
  });

  btnReset?.addEventListener("click", () => {
    const claimEl = document.getElementById("set-auto-claim");
    const enrollEl = document.getElementById("set-auto-enroll");
    const videoEl = document.getElementById("set-video-interval");
    const gameEl = document.getElementById("set-game-interval");
    const jitterEl = document.getElementById("set-random-jitter");

    if (claimEl) claimEl.checked = true;
    if (enrollEl) enrollEl.checked = true;
    if (videoEl) videoEl.value = 7;
    if (gameEl) gameEl.value = 60;
    if (jitterEl) jitterEl.checked = true;

    localStorage.removeItem("dqt_settings");
    toast("Đã khôi phục cài đặt mặc định!", "info");
    addLog("info", "[Cài đặt] Đã khôi phục thông số khuyến nghị ban đầu.");
  });
}

// Logic kiểm tra và xác thực Token Discord qua API thực tế
function bindTokenChecking() {
  const btnSubmit = document.getElementById("btn-confirm-add-account");
  const tokenInput = document.getElementById("input-account-token");

  btnSubmit?.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      toast("Vui lòng nhập Token!", "warn");
      tokenInput.focus();
      return;
    }

    btnSubmit.classList.add("loading");
    btnSubmit.innerHTML = `<span class="spinner"></span> Đang xác thực với Discord...`;

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        btnSubmit.classList.remove("loading");
        btnSubmit.innerHTML = `Kiểm Tra`;
        toast(data.error || "Token không hợp lệ hoặc đã hết hạn!", "error");
        return;
      }

      const u = data.user;
      const existing = state.accounts.find(a => a.id === u.id);
      if (existing) {
        existing.token = token;
        existing.username = u.username;
        existing.tag = u.tag;
        existing.avatar = u.avatar;
        state.activeAccId = existing.id;
        toast(`Đã cập nhật Token: @${u.username}`, "success");
        addLog("success", `Đã cập nhật Token cho @${u.username}.`);
      } else {
        const newAccount = {
          id: u.id,
          username: u.username,
          tag: u.tag,
          avatar: u.avatar,
          orbs: 0,
          status: "active",
          ipType: "Mạng nhà",
          token: token,
          completedCount: 0
        };
        state.accounts.push(newAccount);
        state.activeAccId = newAccount.id;
        toast(`Xác thực thành công: @${u.username}`, "success");
        addLog("success", `Xác thực thành công tài khoản @${u.username} (${u.tag}).`);
      }

      saveState();

      btnSubmit.classList.remove("loading");
      btnSubmit.innerHTML = `Kiểm Tra`;
      tokenInput.value = "";
      document.getElementById("modal-add-account")?.classList.remove("open");

      updateNavGating();
      
      // Hiệu ứng skeleton loading khi cập nhật danh sách
      showTableSkeleton("accounts-tbody", 2, 6);
      setTimeout(async () => {
        renderAll();
        if (typeof window.switchTabTo === "function") {
          window.switchTabTo("runner");
        }
        await window.syncQuestsFromDiscord(true);
      }, 300);
    } catch (err) {
      btnSubmit.classList.remove("loading");
      btnSubmit.innerHTML = `Kiểm Tra`;
      toast("Lỗi kết nối API xác thực: " + err.message, "error");
    }
  });
}

// Tự động kiểm tra và làm mới phiên token khi người dùng tải lại web
async function checkSessionOnStartup() {
  if (state.accounts.length === 0) return;

  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (!acc || !acc.token) return;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: acc.token })
    });

    const data = await res.json();

    if (data.expired || res.status === 401) {
      addLog("warn", `[HỆ THỐNG] Phiên của @${acc.username} đã hết hạn. Đã tự động đăng xuất.`);
      toast(`Phiên của @${acc.username} đã hết hạn. Vui lòng kết nối lại.`, "warn");
      
      // Tự động xóa tài khoản hết hạn khỏi bộ nhớ
      state.accounts = state.accounts.filter(a => a.id !== acc.id);
      state.activeAccId = state.accounts.length > 0 ? state.accounts[0].id : null;
      saveState();
      updateNavGating();
      renderAll();
      if (typeof window.switchTabTo === 'function') {
        window.switchTabTo("accounts");
      }
      return;
    }

    if (data.success && data.valid && data.user) {
      // Cập nhật thông tin mới nhất từ Discord nếu có thay đổi
      acc.username = data.user.username;
      acc.tag = data.user.tag;
      acc.avatar = data.user.avatar;
      saveState();
      renderSidebarUser();
      addLog("info", `[HỆ THỐNG] Tự động xác thực phiên: @${acc.username}`);
    }
  } catch (err) {
    console.warn("Lỗi kiểm tra phiên:", err);
  }
}

function resetTokenCheckForm() {
  const tokenInput = document.getElementById("input-account-token");
  if (tokenInput) tokenInput.value = "";
  const btn = document.getElementById("btn-confirm-add-account");
  if (btn) {
    btn.classList.remove("loading");
    btn.innerHTML = `Kiểm Tra`;
  }
}

function renderCounters() {
  const hasAcc = state.accounts.length > 0;
  const currentAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const activeOrbs = (currentAcc && currentAcc.orbs != null) ? currentAcc.orbs : 0;
  const orbsEl = document.getElementById("nav-orbs");
  if (orbsEl) orbsEl.textContent = hasAcc ? `${activeOrbs.toLocaleString()} Orbs` : "—";

  const runningCount = state.quests.filter(q => q.status === "running").length;
  const queuedCount = state.quests.filter(q => q.status === "queued").length;

  const btnRunAll = document.getElementById("btn-run-all");
  const btnStopAll = document.getElementById("btn-stop-all");
  if (btnRunAll && btnStopAll) {
    if (runningCount > 0) {
      btnRunAll.classList.add("hidden");
      btnStopAll.classList.remove("hidden");
    } else {
      btnRunAll.classList.remove("hidden");
      btnStopAll.classList.add("hidden");
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
    const val = hasAcc ? state.quests.length : 0;
    countAll.textContent = val;
    countAll.style.display = val > 0 ? "inline-flex" : "none";
  }

  const countRewards = document.getElementById("count-rewards");
  if (countRewards) {
    const rewardCount = typeof getRewardItems === "function" 
      ? getRewardItems().length 
      : state.quests.filter(q => q.hasGiftCode || q.code).length;
    const val = hasAcc ? rewardCount : 0;
    countRewards.textContent = val;
    countRewards.style.display = val > 0 ? "inline-flex" : "none";
  }

  const sumProgress = document.getElementById("summary-progress-text");
  if (sumProgress) {
    if (!hasAcc) {
      sumProgress.textContent = "Chưa kết nối tài khoản";
    } else {
      const done = state.quests.filter(q => q.status === "completed" || q.status === "claimed").length;
      sumProgress.textContent = `${runningCount} đang chạy • ${queuedCount} trong hàng đợi • ${done}/${state.quests.length} xong`;
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
  updateNavGating();
  renderCounters();
  renderSidebarUser();
  renderAccounts();
  renderRunner();
  renderQuests();
  renderRewards();
  renderLogs();
  renderHome();
}

function renderHome() {
  const statQuests = document.getElementById("home-stat-quests");
  const statRunning = document.getElementById("home-stat-running");
  const statRunningText = document.getElementById("home-stat-running-text");
  const statRewards = document.getElementById("home-stat-rewards");
  const statOrbs = document.getElementById("home-stat-orbs");
  const badgeQuestCount = document.getElementById("home-badge-quest-count");
  const questsPreview = document.getElementById("home-quests-preview-list");
  const accountWidget = document.getElementById("home-account-widget");

  const activeAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const hasAcc = !!activeAcc;

  // 1. Thống kê tổng quan (Live Counters)
  const availableQuests = state.quests.filter(q => q.status !== "completed" && q.status !== "claimed");
  const runningQuest = state.quests.find(q => q.status === "running");

  if (statQuests) statQuests.textContent = hasAcc ? availableQuests.length : "0";
  if (badgeQuestCount) badgeQuestCount.textContent = hasAcc ? state.quests.length : "0";
  if (statRunning) statRunning.textContent = runningQuest ? "1" : "0";
  if (statRunningText) statRunningText.textContent = runningQuest ? runningQuest.name : "Chưa chạy";
  const giftRewardCount = typeof getRewardItems === "function" ? getRewardItems().length : state.rewards.length;
  if (statRewards) statRewards.textContent = hasAcc ? giftRewardCount : "0";
  if (statOrbs) statOrbs.textContent = hasAcc ? (activeAcc.orbs ?? 0).toLocaleString() : "0";

  // 2. Danh sách nhiệm vụ nổi bật / mới nhất
  if (questsPreview) {
    if (!hasAcc) {
      questsPreview.innerHTML = `
        <div class="home-empty-state">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <div class="home-empty-title">Chưa kết nối tài khoản Discord</div>
          <div class="home-empty-desc">Thêm Token của bạn để quét danh sách nhiệm vụ thật từ Discord.</div>
          <button class="btn btn-primary btn-sm" onclick="window.switchTabTo('accounts')">+ Thêm Token Ngay</button>
        </div>
      `;
    } else if (state.quests.length === 0) {
      questsPreview.innerHTML = `
        <div class="home-empty-state">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
          <div class="home-empty-title">Chưa quét nhiệm vụ từ Discord</div>
          <div class="home-empty-desc">Nhấn nút bên dưới để đồng bộ toàn bộ Quest khả dụng cho tài khoản @${escapeHtml(activeAcc.username)}.</div>
          <button class="btn btn-primary btn-sm" onclick="syncQuestsFromDiscord(true)">Quét Nhiệm Vụ Ngay</button>
        </div>
      `;
    } else {
      const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
      const sorted = [...state.quests].sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99)).slice(0, 4);

      questsPreview.innerHTML = sorted.map(q => {
        let tagHtml = `<span class="tag tag-pending">Chưa làm</span>`;
        let actionBtn = `<button class="btn btn-secondary btn-sm" onclick="startQuest('${q.id}')">Chạy</button>`;

        if (q.status === "running") {
          tagHtml = `<span class="tag tag-running">● Đang chạy</span>`;
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="pauseQuest('${q.id}')">Tạm dừng</button>`;
        } else if (q.status === "queued") {
          tagHtml = `<span class="tag tag-pending">Hàng đợi</span>`;
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="startQuest('${q.id}')">Chạy</button>`;
        } else if (q.status === "completed") {
          tagHtml = `<span class="tag tag-completed">Chờ claim</span>`;
          actionBtn = `<button class="btn btn-primary btn-sm" onclick="claimQuest('${q.id}')">Nhận quà</button>`;
        } else if (q.status === "claimed") {
          tagHtml = `<span class="tag tag-claimed">Hoàn thành</span>`;
          actionBtn = `<span style="font-size: 11px; color: var(--text-muted); padding: 4px 6px;">Hoàn thành</span>`;
        }

        const iconLetter = (q.name || "Q").trim().charAt(0).toUpperCase();

        return `
          <div class="home-quest-row">
            <div class="quest-row-avatar">${iconLetter}</div>
            <div class="quest-row-main">
              <div class="quest-row-title" title="${escapeHtml(q.name)}">${escapeHtml(q.name)}</div>
              <div class="quest-row-sub">
                <span>${escapeHtml(q.publisher || 'Discord')}</span>
                <span class="quest-sub-dot">•</span>
                <span class="quest-sub-reward">${escapeHtml(q.reward || '+30 Orbs')}</span>
              </div>
            </div>
            <div class="quest-row-status">${tagHtml}</div>
            <div class="quest-row-action">${actionBtn}</div>
          </div>
        `;
      }).join('');
    }
  }

  // 3. Mini Console Logs
  renderHomeLogs();

  // 4. Widget Tài khoản Discord
  if (accountWidget) {
    if (hasAcc) {
      const initials = (activeAcc.username || "U").slice(0, 2).toUpperCase();
      const doneCount = state.quests.filter(q => q.status === "completed" || q.status === "claimed").length;
      accountWidget.innerHTML = `
        <div class="acc-widget-user">
          ${activeAcc.avatar 
            ? `<img src="${activeAcc.avatar}" alt="Avatar" class="acc-widget-avatar">` 
            : `<div class="acc-widget-initials">${initials}</div>`}
          <div class="acc-widget-info">
            <div class="acc-widget-name">${escapeHtml(activeAcc.username)}</div>
            <div class="acc-widget-tag">${escapeHtml(activeAcc.tag || '#0000')}</div>
          </div>
          <div class="acc-widget-badge">
            <span class="dot-online"></span>
            <span>Đã kết nối</span>
          </div>
        </div>
        <div class="acc-widget-metrics">
          <div class="acc-metric-item">
            <span class="metric-num">${(activeAcc.orbs ?? 0).toLocaleString()}</span>
            <span class="metric-label">Số dư Orbs</span>
          </div>
          <div class="acc-metric-item">
            <span class="metric-num">${doneCount} / ${state.quests.length}</span>
            <span class="metric-label">Nhiệm vụ xong</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm acc-widget-btn" onclick="window.switchTabTo('accounts')">
          <span>Quản lý tài khoản</span>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      `;
    } else {
      accountWidget.innerHTML = `
        <div class="acc-widget-empty">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div class="empty-acc-text">Chưa kết nối tài khoản nào</div>
          <button class="btn btn-primary btn-sm" onclick="window.switchTabTo('accounts')">+ Thêm Token Discord</button>
        </div>
      `;
    }
  }
}

function renderHomeLogs() {
  const logsMini = document.getElementById("home-logs-mini");
  if (!logsMini) return;

  if (state.logs.length === 0) {
    logsMini.innerHTML = `
      <div class="home-log-row">
        <span class="log-time">[${new Date().toTimeString().split(' ')[0]}]</span>
        <span class="log-lvl-info">[INFO]</span>
        <span class="log-msg">Hệ thống Discord Quest đã sẵn sàng kết nối.</span>
      </div>
      <div class="home-log-prompt">
        <span class="log-cursor"></span>
        <span>Đang chờ lệnh từ người dùng...</span>
      </div>
    `;
    return;
  }

  const recentLogs = state.logs.slice(-30);
  const logRows = recentLogs.map(l => `
    <div class="home-log-row">
      <span class="log-time">[${l.time}]</span>
      <span class="log-lvl-${l.level}">[${l.level.toUpperCase()}]</span>
      <span class="log-msg">${escapeHtml(l.text)}</span>
    </div>
  `).join('');

  logsMini.innerHTML = logRows + `
    <div class="home-log-prompt">
      <span class="log-cursor"></span>
      <span>Đang lắng nghe tiến trình thời gian thực...</span>
    </div>
  `;
  logsMini.scrollTop = logsMini.scrollHeight;
}

window.renderHome = renderHome;
window.renderHomeLogs = renderHomeLogs;

// ==================== ĐỒNG BỘ DỮ LIỆU QUEST THẬT TỪ DISCORD ====================
window.syncQuestsFromDiscord = async function(showToasts = false) {
  if (state.accounts.length === 0) return;
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (!acc || !acc.token) return;

  addLog("info", `[Đồng bộ] Gửi GET /api/quests (@${acc.username})...`);

  try {
    const res = await fetch(`/api/quests?token=${encodeURIComponent(acc.token)}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      addLog("error", `[Đồng bộ] Thất bại: ${data.error || 'Lỗi không xác định'}`);
      if (showToasts) toast(data.error || "Không thể đồng bộ Quest từ Discord", "error");
      return;
    }

    // Cập nhật số dư Orbs thật từ Discord
    acc.orbs = data.balance ?? acc.orbs ?? 0;

    // Giữ trạng thái running cục bộ nếu người dùng đang chủ động chạy một quest chưa xong
    const currentRunningId = state.quests.find(q => q.status === "running")?.id;

    const rawQuests = data.quests || [];
    // LỌC BỎ NGAY TỪ KHI QUÉT: Nhiệm vụ hết hạn hoặc không hợp lệ mà chưa làm thì loại bỏ hoàn toàn
    const validQuests = rawQuests.filter(q => {
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord') && q.status !== 'claimed' && q.status !== 'completed') return false;
      if (q.status === "claimed" || q.status === "completed") return true;
      if (q.isExpired) return false;
      if (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now()) return false;
      return true;
    });

    state.quests = validQuests.map(nq => {
      if (currentRunningId === nq.id && nq.status !== "completed" && nq.status !== "claimed") {
        nq.status = "running";
      }
      return nq;
    });

    // Thu thập các Gift code đã nhận thưởng vào tab Quà tặng
    state.quests.forEach(q => {
      if (q.code && !state.rewards.some(r => r.code === q.code)) {
        state.rewards.unshift({
          id: `r_${q.id}`,
          questName: q.name,
          account: acc.username,
          type: "Gift Code",
          code: q.code,
          link: "https://discord.com",
          expiry: "30 ngày"
        });
      }
    });

    saveState();
    renderAll();

    addLog("success", `[Đồng bộ] Đã tải ${state.quests.length} Quest & ${acc.orbs.toLocaleString()} Orbs từ Discord.`);
    if (showToasts) toast(`Đã đồng bộ ${state.quests.length} quest từ Discord!`, "success");
  } catch (err) {
    addLog("error", `[Đồng bộ] Lỗi mạng: ${err.message}`);
    if (showToasts) toast("Lỗi kết nối khi đồng bộ Quest", "error");
  }
};

// ==================== FETCH PUBLIC IP ====================
function initIPFetcher() {
  const badge = document.getElementById("header-ip-badge");
  if (badge) {
    badge.addEventListener("click", () => {
      fetchPublicIP(true);
    });
  }
  fetchPublicIP(false);
}

let isFetchingIP = false;

async function fetchPublicIP(isManual = false) {
  if (isFetchingIP) return;
  isFetchingIP = true;

  const ipText = document.getElementById("header-ip-text");
  const ipDot = document.getElementById("header-ip-dot");
  const badge = document.getElementById("header-ip-badge");

  if (!ipText || !ipDot) {
    isFetchingIP = false;
    return;
  }

  // Trạng thái Loading: Dot nhấp nháy vàng + Skeleton shimmer
  ipDot.className = "dot-online loading-dot";
  ipText.innerHTML = `<span class="skeleton" style="width: 100px; height: 13px; display: inline-block;"></span>`;
  if (badge) badge.title = "Đang kiểm tra IP mạng...";

  // Đảm bảo hiệu ứng skeleton hiển thị mượt mà tối thiểu 350ms
  const minLoadTime = new Promise(resolve => setTimeout(resolve, 350));

  let detectedIP = null;
  try {
    const res = await fetch("/api/ip");
    if (res.ok) {
      const data = await res.json();
      detectedIP = data.ip;
    }
  } catch (err) {
    console.error("Lỗi lấy IP:", err);
  }

  await minLoadTime;

  if (detectedIP) {
    ipDot.className = "dot-online";
    ipText.textContent = detectedIP;
    if (badge) badge.title = `IP Mạng: ${detectedIP} (Bấm để kiểm tra lại)`;
    if (isManual) toast(`Đã cập nhật IP: ${detectedIP}`, "success");
    addLog("info", `Kết nối với IP: ${detectedIP}`);
  } else {
    ipDot.className = "dot-online error-dot";
    ipText.textContent = "Không lấy được IP";
    if (badge) badge.title = "Lỗi kết nối. Bấm để thử lại.";
    if (isManual) toast("Không thể lấy IP mạng", "error");
    addLog("error", "Không thể lấy IP mạng");
  }

  isFetchingIP = false;
}

// Đồng bộ chỉ chạy 1 lần khi load trang (F5) hoặc khi người dùng chủ động bấm "Quét Quest"

// ==================== PWA INSTALLATION & NATIVE WEB SHARE ====================
let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
});

window.installPWA = async function() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    const { outcome } = await deferredPwaPrompt.userChoice;
    if (outcome === 'accepted') {
      toast('Đang cài đặt Discord Quest vào màn hình chính...', 'success');
      addLog('success', 'Đã thêm ứng dụng vào màn hình chính thành công!');
    }
    deferredPwaPrompt = null;
  } else {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      toast('Trên iPhone/iPad: Bấm nút Chia sẻ (mũi tên trỏ lên) ở thanh dưới Safari ➔ Chọn "Thêm vào MH chính"', 'info');
    } else {
      toast('Bấm Menu 3 chấm (⋮) trên trình duyệt ➔ Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính"', 'info');
    }
  }
};

window.shareApp = async function() {
  const shareData = {
    title: 'Discord Quest',
    text: 'Tự động hóa tiến trình nhiệm vụ, đồng bộ Orbs và quản lý phần thưởng Discord.',
    url: window.location.origin
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      toast('Đã mở bảng chia sẻ thành công!', 'success');
      return;
    } catch (err) {
      if (err.name !== 'AbortError') console.warn(err);
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    toast('Đã sao chép liên kết web vào bộ nhớ tạm!', 'success');
  } catch {
    toast(`Liên kết: ${shareData.url}`, 'info');
  }
};

// Đăng ký Service Worker cho PWA
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

