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

  // MẶC ĐỊNH KHI VỪA VÀO WEB: Bật trạng thái đồng bộ để hiện Skeleton, chỉ hiện danh sách khi API tải xong
  if (state.accounts.length > 0) {
    state.isSyncingQuests = true;
  }

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

  // Vòng lặp tiến trình thật: CHỈ GỬI TIẾN TRÌNH CHO ĐÚNG 1 QUEST ĐANG CHẠY (Lần lượt, Đơn luồng)
  let isSendingProgress = false;

  async function runSingleProgressTick() {
    if (state.accounts.length === 0 || isSendingProgress) return;

    const current = state.quests.find(q => q.status === "running");
    if (!current) return;

    const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
    if (!acc || !acc.token) return;

    isSendingProgress = true;
    try {
      // 1. Tự động enroll nếu quest chưa được ghi nhận đã enroll trên Discord
      const isVideo = current.taskType === 'WATCH_VIDEO' || current.taskType === 'WATCH_VIDEO_ON_MOBILE' || (typeof current.taskType === 'string' && current.taskType.includes('VIDEO'));

      if (!current.enrolledAt) {
        addLog("info", `[Auto] Nhận Quest "${current.name}" trên Discord...`);
        let enrollSuccess = false;
        try {
          const enrollRes = await fetch("/api/quests/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: acc.token,
              questId: current.id,
              taskType: current.taskType,
              trafficMetadataSealed: current.trafficMetadataSealed
            })
          });
          const enrollData = await enrollRes.json().catch(() => ({}));

          // Bắt trường hợp dính HTTP 429 Rate Limit từ Discord
          if (enrollData.status === 429 || enrollData.isRateLimited) {
            current.status = "pending";
            state.isRunningAll = false;
            const btnRun = document.getElementById("btn-run-all");
            const btnStop = document.getElementById("btn-stop-all");
            btnRun?.classList.remove("hidden");
            btnStop?.classList.add("hidden");

            const waitSec = Math.ceil(enrollData.retryAfter || 5);
            addLog("warn", `[Rate Limit] Discord giới hạn tốc độ (chờ ${waitSec}s). Đã tạm dừng.`);
            toast(`Discord giới hạn thao tác (chờ ${waitSec}s)`, "warn");
            return;
          }

          if (enrollRes.ok && (enrollData.success || enrollData.alreadyEnrolled || enrollData.code === 260017)) {
            enrollSuccess = true;
            current.enrolledAt = new Date().toISOString();
            addLog("success", `[Auto] Nhận Quest "${current.name}" thành công (đã tham gia).`);
          } else {
            addLog("info", `[Auto] Chuẩn bị phát tiến trình cho "${current.name}"...`);
          }
        } catch {
          addLog("info", `[Auto] Chuẩn bị phát tiến trình cho "${current.name}"...`);
        }

        if (!enrollSuccess) {
          if (isVideo) {
            // Nhiệm vụ video: Discord không bắt buộc enroll trước qua API enroll, tiếp tục gửi tiến trình video
            current.enrolledAt = new Date().toISOString();
          } else {
            // Nhiệm vụ game nếu không thể tham gia thì mới tạm dừng
            current.status = "pending";
            addLog("error", `[Không thể nhận] "${current.name}". Đã tạm dừng.`);
            toast(`Không thể nhận "${current.name}"`, "warn");

            if (state.isRunningAll) {
              const nextQ = state.quests.find(q => q.status === "queued" && !q.isExpired);
              if (nextQ) {
                nextQ.status = "running";
                nextQ._runStartedAt = Date.now();
                nextQ._baseProgSec = nextQ.progSec || 0;
                addLog("info", `[Hàng đợi] Tự động chuyển sang: "${nextQ.name}"...`);
              } else {
                state.isRunningAll = false;
                const btnRun = document.getElementById("btn-run-all");
                const btnStop = document.getElementById("btn-stop-all");
                btnRun?.classList.remove("hidden");
                btnStop?.classList.add("hidden");
                addLog("info", `[Auto] Đã hoàn tất hoặc không còn quest hợp lệ trong hàng đợi.`);
              }
            }
            return; // Dừng lại, không gửi heartbeat/progress
          }
        }
      }

      // 2. Gửi tiến độ thật (Heartbeat hoặc Video Progress)
      let nextTimestamp;
      if (isVideo) {
        if (!current._runStartedAt) {
          current._runStartedAt = Date.now();
          current._baseProgSec = current.progSec || 0;
        }

        // Tính toán đúng thời gian thực tế đã trôi qua kể từ khi bắt đầu chạy
        const elapsedRealSec = Math.floor((Date.now() - current._runStartedAt) / 1000);
        
        // Không gửi ping ảo nếu vừa mới bấm chạy dưới 5 giây (trừ khi đã có tiến độ trước đó)
        if (elapsedRealSec < 5 && (current.progSec || 0) === 0) {
          return;
        }

        const realSec = Math.min(current.targetSec, (current._baseProgSec || 0) + elapsedRealSec);
        current.progSec = realSec;

        // Nếu đã đủ thời gian targetSec, luôn gửi CHÍNH XÁC targetSec (không dùng jitter âm) để Discord kích hoạt hoàn thành 100%
        if (realSec >= current.targetSec) {
          nextTimestamp = current.targetSec;
        } else {
          // Jitter nhẹ ±0.15s cho số lẻ thập phân tự nhiên giống video player Discord
          const jitter = (Math.random() * 0.3 - 0.15);
          nextTimestamp = Number(Math.max(1, realSec + jitter).toFixed(4));
        }
      } else {
        nextTimestamp = current.progSec;
      }

      // QUAN TRỌNG: Gửi terminal: true khi nhiệm vụ game đã chạm mốc targetSec
      const isTerminal = !isVideo && (current.progSec >= current.targetSec);

      const progRes = await fetch("/api/quests/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: acc.token,
          questId: current.id,
          taskType: current.taskType,
          applicationId: current.applicationId,
          timestamp: nextTimestamp,
          terminal: isTerminal,
          trafficMetadataSealed: current.trafficMetadataSealed
        })
      });

      const progData = await progRes.json().catch(() => ({}));

      // Bắt HTTP 429 khi gửi tiến trình
      if (progData.status === 429 || progData.isRateLimited) {
        current.status = "pending";
        state.isRunningAll = false;
        const btnRun = document.getElementById("btn-run-all");
        const btnStop = document.getElementById("btn-stop-all");
        btnRun?.classList.remove("hidden");
        btnStop?.classList.add("hidden");

        const waitSec = Math.ceil(progData.retryAfter || 5);
        addLog("warn", `[Rate Limit] Gửi tiến độ chạm giới hạn Discord (chờ ${waitSec}s). Đã tạm dừng.`);
        toast(`Discord giới hạn thao tác: Thử lại sau ${waitSec}s`, "warn");
        return;
      }

      if (progRes.ok && progData.success) {
        const uStatus = progData.user_status;
        let discordProg = uStatus?.progress?.[current.taskType]?.value;
        if (typeof discordProg !== 'number' && uStatus?.progress) {
          const firstProg = Object.values(uStatus.progress)[0];
          if (firstProg && typeof firstProg.value === 'number') {
            discordProg = firstProg.value;
          }
        }
        if (typeof discordProg === 'number') {
          // Tuyệt đối không để giá trị làm tròn của Discord kéo lùi tiến trình về targetSec - 1
          if (discordProg >= current.progSec) {
            current.progSec = Math.min(current.targetSec, discordProg);
            current._baseProgSec = current.progSec;
            current._runStartedAt = Date.now();
          }
        } else if (isVideo) {
          current.progSec = Math.min(current.targetSec, Math.ceil(nextTimestamp));
        }

        const isCompleted = Boolean(uStatus?.completed_at) || (current.progSec >= current.targetSec);

        if (isCompleted) {
          current.status = "completed";
          current.progSec = current.targetSec;
          delete current._runStartedAt;
          delete current._baseProgSec;

          addLog("success", `★ Hoàn thành nhiệm vụ "${current.name}" (100%)!`);
          toast(`Hoàn thành: "${current.name}"!`, "success");

          // CHỈ TỰ ĐỘNG CHUYỂN TIẾP KHI NGƯỜI DÙNG BẬT CHẾ ĐỘ "CHẠY TẤT CẢ" (state.isRunningAll === true)
          if (state.isRunningAll) {
            const nextQ = state.quests.find(item => item.status === "queued" && item.id !== current.id && !item.isExpired);
            if (nextQ) {
              nextQ.status = "running";
              nextQ._runStartedAt = Date.now();
              nextQ._baseProgSec = nextQ.progSec || 0;
              addLog("info", `[Hàng đợi] Tự động chuyển tiếp sang: "${nextQ.name}"...`);
              toast(`Bắt đầu: ${nextQ.name}`, "info");
            } else {
              state.isRunningAll = false;
              const btnRun = document.getElementById("btn-run-all");
              const btnStop = document.getElementById("btn-stop-all");
              btnRun?.classList.remove("hidden");
              btnStop?.classList.add("hidden");
              addLog("success", `★ Toàn bộ nhiệm vụ trong hàng đợi đã hoàn tất!`);
            }
          } else {
            // Khi chạy đơn lẻ 1 quest -> Xong là DỪNG LẠI hoàn toàn, không tự ý chạy quest khác!
            addLog("info", `[Hoàn thành] Đã xong nhiệm vụ "${current.name}".`);
          }
        } else {
          addLog("info", `[Tiến độ${isVideo ? ' Video' : ''}] "${current.name}": ${fmtSec(current.progSec)} / ${fmtSec(current.targetSec)}`);
        }
      } else {
        addLog("error", `[Tiến độ] Gửi thất bại cho "${current.name}": ${progData.error || 'Chưa thể cập nhật tiến trình'}`);
        current.status = "pending"; // Tạm dừng quest, tuyệt đối KHÔNG xóa khỏi danh sách
        toast(`Tạm dừng "${current.name}": ${progData.error || 'Lỗi Discord'}`, "warn");
        if (state.isRunningAll) {
          const nextQ = state.quests.find(q => q.status === "queued" && !q.isExpired);
          if (nextQ) {
            nextQ.status = "running";
            nextQ._runStartedAt = Date.now();
            nextQ._baseProgSec = nextQ.progSec || 0;
            addLog("info", `[Hàng đợi] Tự động chuyển tiếp sang: "${nextQ.name}"...`);
          } else {
            state.isRunningAll = false;
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi gửi tiến độ:", err);
    } finally {
      isSendingProgress = false;
      saveState();
      renderCounters();
      if (state.activeTab === "quests" || state.activeTab === "runner") renderQuests();
      if (state.activeTab === "rewards") renderRewards();
    }
  }

  // Lấy khoảng thời gian delay động từ Cài đặt người dùng (dqt_settings)
  function getRunnerDelayMs(current) {
    try {
      const raw = localStorage.getItem("dqt_settings");
      const s = raw ? JSON.parse(raw) : {};
      const isVideo = current ? (current.taskType === 'WATCH_VIDEO' || current.taskType === 'WATCH_VIDEO_ON_MOBILE' || (typeof current.taskType === 'string' && current.taskType.includes('VIDEO'))) : true;
      let baseSec = isVideo ? (parseInt(s.videoInterval, 10) || 7) : (parseInt(s.gameInterval, 10) || 20);
      if (s.randomJitter !== false) {
        // Lệch ngẫu nhiên ±1s cho video, ±2s cho game để giả lập người thật
        const delta = isVideo ? (Math.random() * 2 - 1) : (Math.random() * 4 - 2);
        baseSec = Math.max(3, baseSec + delta);
      }
      return Math.round(baseSec * 1000);
    } catch {
      return 6000;
    }
  }

  let progressTimer = null;
  function scheduleNextProgressTick(delayMs) {
    if (progressTimer) clearTimeout(progressTimer);
    const current = state.quests.find(q => q.status === "running");
    const delay = typeof delayMs === 'number' ? delayMs : (current ? getRunnerDelayMs(current) : 5000);
    progressTimer = setTimeout(async () => {
      await runSingleProgressTick();
      scheduleNextProgressTick();
    }, delay);
  }

  // Khởi chạy nhịp tick động
  scheduleNextProgressTick(3000);

  // Gắn hàm global để khi lưu cài đặt có thể cập nhật nhịp tick ngay
  window.rescheduleProgressTick = function() {
    scheduleNextProgressTick(1000);
  };

  // Nhịp cập nhật thời gian thực từng giây (1s) cho giao diện người dùng
  setInterval(() => {
    const current = state.quests.find(q => q.status === "running");
    if (!current) return;

    if (!current._runStartedAt) {
      current._runStartedAt = Date.now();
      current._baseProgSec = current.progSec || 0;
    }

    const elapsedRealSec = Math.floor((Date.now() - current._runStartedAt) / 1000);
    const calculatedSec = Math.min(current.targetSec, (current._baseProgSec || 0) + elapsedRealSec);

    if (calculatedSec !== current.progSec && calculatedSec <= current.targetSec) {
      current.progSec = calculatedSec;
      if ((state.activeTab === "quests" || state.activeTab === "runner") && typeof renderQuests === "function") {
        renderQuests();
      }
    }
  }, 1000);

  // Khởi chạy nhịp tick thủ công ngay lập tức khi bấm nút (có mutex bảo vệ chống gọi kép)
  window.triggerRunnerTick = function() {
    if (!isSendingProgress) {
      if (progressTimer) clearTimeout(progressTimer);
      runSingleProgressTick().finally(() => {
        scheduleNextProgressTick();
      });
    }
  };
});

// Chuyển tab với hiệu ứng Skeleton Loading & Điều hướng URL theo miền /
window.switchTabTo = function(tab, updateHistory = true) {
  if (tab === "runner") tab = "quests";
  const validTabs = ["home", "accounts", "quests", "rewards", "logs", "settings"];
  if (!validTabs.includes(tab)) tab = "home";

  if (state.accounts.length === 0 && (tab === "quests" || tab === "rewards")) {
    toast("Chưa có tài khoản nào được kết nối!", "warn");
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
  if (tab === "quests") showTableSkeleton("quests-tbody", 4, 7);
  if (tab === "rewards") showTableSkeleton("rewards-tbody", 3, 5);

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
  const lockedTabs = ["quests", "rewards"];

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
      toast("Chưa có tài khoản nào được kết nối!", "warn");
      window.switchTabTo("accounts");
      return;
    }

    state.isRunningAll = true;
    let hasRunning = state.quests.some(q => q.status === "running");

    state.quests.forEach(q => {
      if (q.status === "pending" && !q.isExpired) q.status = "queued";
    });

    if (!hasRunning) {
      const first = state.quests.find(q => q.status === "queued" && !q.isExpired);
      if (first) {
        first.status = "running";
        first._runStartedAt = Date.now();
        first._baseProgSec = first.progSec || 0;
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
    state.isRunningAll = false;
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

    // Hiển thị Skeleton loading trên bảng Quest & Mã quà
    showTableSkeleton("quests-tbody", 4, 7);
    showTableSkeleton("rewards-tbody", 3, 5);

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

  // Modal Thêm Nhiệm Vụ Bằng Link / ID
  const questModal = document.getElementById("modal-add-quest");
  const openQuestModal = () => {
    questModal?.classList.add("open");
    const input = document.getElementById("input-custom-quest");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 100);
    }
  };
  window.openAddQuestModal = openQuestModal;
  document.getElementById("btn-open-add-quest")?.addEventListener("click", openQuestModal);
  document.getElementById("btn-close-quest-modal")?.addEventListener("click", () => questModal?.classList.remove("open"));
  document.getElementById("btn-cancel-quest-modal")?.addEventListener("click", () => questModal?.classList.remove("open"));

  questModal?.addEventListener("click", (e) => {
    if (e.target === questModal) questModal.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && questModal?.classList.contains("open")) {
      questModal.classList.remove("open");
    }
  });


  document.getElementById("btn-submit-custom-quest")?.addEventListener("click", async () => {
    const input = document.getElementById("input-custom-quest");
    const rawVal = input?.value?.trim() || "";
    if (!rawVal) {
      toast("Chưa nhập Link hoặc ID Quest Discord", "warning");
      return;
    }
    const cleanId = rawVal.replace(/.*\/quests\//, '').replace(/\D/g, '');
    if (!cleanId || cleanId.length < 15) {
      toast("ID Quest không hợp lệ (phải là dãy số Snowflake Discord)", "error");
      return;
    }

    try {
      let customIds = JSON.parse(localStorage.getItem('custom_quest_ids') || '[]');
      if (!customIds.includes(cleanId)) {
        customIds.push(cleanId);
        localStorage.setItem('custom_quest_ids', JSON.stringify(customIds));
      }
      questModal?.classList.remove("open");
      toast(`Đã thêm Quest ${cleanId}! Đang đồng bộ...`, "success");
      addLog("success", `[Thêm Quest] Đã lưu ID: ${cleanId}, tiến hành quét ngay.`);
      await syncQuestsFromDiscord(true);
    } catch (err) {
      toast(`Lỗi thêm quest: ${err.message}`, "error");
    }
  });

  document.getElementById("input-custom-quest")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("btn-submit-custom-quest")?.click();
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
        const val = s.gameInterval === 60 ? 20 : s.gameInterval;
        if (el) el.value = val;
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
      gameInterval: parseInt(document.getElementById("set-game-interval")?.value, 10) || 20,
      randomJitter: document.getElementById("set-random-jitter")?.checked ?? true
    };
    localStorage.setItem("dqt_settings", JSON.stringify(s));
    toast("Đã lưu cài đặt hệ thống!", "success");
    addLog("info", `[Cài đặt] Đã lưu: AutoClaim=${s.autoClaim ? 'Bật' : 'Tắt'}, Video=${s.videoInterval}s, Game=${s.gameInterval}s`);
    if (typeof window.rescheduleProgressTick === 'function') {
      window.rescheduleProgressTick();
    }
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
    if (gameEl) gameEl.value = 20;
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
      toast("Chưa nhập Token!", "warn");
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
          window.switchTabTo("quests");
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
      toast(`Phiên của @${acc.username} đã hết hạn.`, "warn");
      
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
    if (state.isRunningAll) {
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
    if (!hasAcc || state.isSyncingQuests) {
      countAll.style.display = "none";
    } else {
      const val = state.quests.length;
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

  if (statQuests) {
    if (!hasAcc) statQuests.textContent = "0";
    else if (state.isSyncingQuests) statQuests.innerHTML = `<span class="skeleton" style="width: 28px; height: 18px; display: inline-block;"></span>`;
    else statQuests.textContent = availableQuests.length;
  }
  if (badgeQuestCount) {
    if (!hasAcc || state.isSyncingQuests) badgeQuestCount.textContent = "0";
    else badgeQuestCount.textContent = state.quests.length;
  }
  if (statRunning) statRunning.textContent = runningQuest ? "1" : "0";
  if (statRunningText) statRunningText.textContent = runningQuest ? runningQuest.name : "Chưa chạy";
  
  const giftRewardCount = typeof getRewardItems === "function" ? getRewardItems().length : state.rewards.length;
  if (statRewards) {
    if (!hasAcc) statRewards.textContent = "0";
    else if (state.isSyncingQuests) statRewards.innerHTML = `<span class="skeleton" style="width: 28px; height: 18px; display: inline-block;"></span>`;
    else statRewards.textContent = giftRewardCount;
  }
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
    } else if (state.isSyncingQuests) {
      questsPreview.innerHTML = `
        <div style="padding: 12px 0; display: flex; flex-direction: column; gap: 8px;">
          <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px;"></div>
          <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px;"></div>
          <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px;"></div>
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

      const hasRunning = state.quests.some(q => q.status === "running");
      const isRunningAll = !!state.isRunningAll;
      let homeQueueOrder = 1;

      questsPreview.innerHTML = sorted.map(q => {
        let actionBtn = "";
        const questUrl = q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home');

        if (q.status === "running") {
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="pauseQuest('${q.id}')">Tạm dừng</button>`;
        } else if (q.status === "completed") {
          actionBtn = `<a href="${questUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Nhận quà</a>`;
        } else if (q.status === "claimed") {
          actionBtn = `<span class="tag tag-claimed">Hoàn thành</span>`;
        } else if (isRunningAll) {
          actionBtn = `<span class="tag tag-pending font-mono" style="font-size: 11px; padding: 4px 8px;">Hàng chờ #${homeQueueOrder++}</span>`;
        } else if (hasRunning) {
          actionBtn = `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.45; cursor: not-allowed;" title="Tạm dừng nhiệm vụ đang chạy để chọn nhiệm vụ này">Chạy</button>`;
        } else {
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="startQuest('${q.id}')">Chạy</button>`;
        }

        const iconLetter = (q.name || "Q").trim().charAt(0).toUpperCase();

        return `
          <div class="home-quest-row">
            <div class="quest-row-avatar">${iconLetter}</div>
            <div class="quest-row-main">
              <div class="quest-row-title" title="${escapeHtml(q.name)}">${escapeHtml(q.name)}</div>
              <div class="quest-row-sub">
                <span class="quest-row-desc" title="${escapeHtml(q.publisher || 'Discord')}">${escapeHtml(q.publisher || 'Discord')}</span>
              </div>
            </div>
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

  state.isSyncingQuests = true;
  renderCounters();

  // Luôn hiển thị Skeleton Shimmer khi đang tải/đồng bộ, tuyệt đối KHÔNG hiện danh sách cũ
  if (state.activeTab === "quests" || state.activeTab === "runner") showTableSkeleton("quests-tbody", 4, 7);
  if (state.activeTab === "rewards") showTableSkeleton("rewards-tbody", 3, 5);

  addLog("info", `[Đồng bộ] Gửi GET /api/quests (@${acc.username})...`);

  try {
    let customIds = [];
    try {
      customIds = JSON.parse(localStorage.getItem('custom_quest_ids') || '[]');
    } catch {}
    const customParam = customIds.length > 0 ? `&customIds=${encodeURIComponent(customIds.join(','))}` : '';
    const res = await fetch(`/api/quests?token=${encodeURIComponent(acc.token)}${customParam}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      addLog("error", `[Đồng bộ] Thất bại: ${data.error || 'Lỗi không xác định'}`);
      if (showToasts) toast(data.error || "Không thể đồng bộ Quest từ Discord", "error");
      return;
    }

    // Cập nhật số dư Orbs thật từ Discord
    acc.orbs = data.balance ?? acc.orbs ?? 0;

    const rawQuests = data.quests || [];
    // LỌC BỎ NGAY TỪ KHI QUÉT: Nhiệm vụ hết hạn hoặc không hợp lệ mà chưa làm thì loại bỏ hoàn toàn
    const validQuests = rawQuests.filter(q => {
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord') && q.status !== 'claimed' && q.status !== 'completed') return false;
      if (q.status === "claimed" || q.status === "completed") return true;
      if (q.isExpired) return false;
      if (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now()) return false;
      return true;
    });

    const currentRunningId = state.quests.find(q => q.status === "running")?.id;
    const currentQueuedIds = new Set(state.quests.filter(q => q.status === "queued").map(q => q.id));

    // Nạp danh sách nhiệm vụ mới chuẩn từ API (đã được sắp xếp ổn định từ Backend)
    // QUAN TRỌNG: Bảo toàn mã code đã lưu vì Discord /quests/@me/claimed không gửi mã code dạng văn bản trực tiếp
    state.quests = validQuests.map(nq => {
      const prevQ = state.quests.find(q => q.id === nq.id);
      const savedR = state.rewards.find(r => (r.id && r.id === nq.id) || (r.code && nq.code && r.code === nq.code));

      const existingCode = nq.code || prevQ?.code || savedR?.code || null;
      if (existingCode) {
        nq.code = existingCode;
        nq.hasGiftCode = true;
      }

      // 100% SỐNG TỪ DISCORD API: Không ép trạng thái ảo từ cache, lấy chuẩn theo API
      if (currentRunningId === nq.id && nq.status !== "completed" && nq.status !== "claimed") {
        nq.status = "running";
        if (prevQ?._runStartedAt) nq._runStartedAt = prevQ._runStartedAt;
        if (typeof prevQ?._baseProgSec === 'number') nq._baseProgSec = prevQ._baseProgSec;
      } else if (currentQueuedIds.has(nq.id) && nq.status !== "completed" && nq.status !== "claimed") {
        nq.status = "queued";
      }
      return nq;
    });

    // Luôn bảo toàn các Gift code trong state.rewards
    state.quests.forEach(q => {
      if (q.code) {
        const existR = state.rewards.find(r => r.code === q.code || (r.questName && q.name && r.questName.toLowerCase() === q.name.toLowerCase()));
        if (!existR) {
          state.rewards.unshift({
            id: q.id,
            questName: q.name,
            account: acc.username,
            type: q.reward || "Gift Code",
            code: q.code,
            discordUrl: `https://discord.com/quests/${q.id}`,
            expiry: "Còn hạn dùng"
          });
        } else {
          existR.code = q.code;
          if (q.id && !existR.id) existR.id = q.id;
        }
      }
    });

    addLog("success", `[Đồng bộ] Đã tải ${state.quests.length} Quest & ${acc.orbs.toLocaleString()} Orbs từ Discord.`);
    if (showToasts) toast(`Đã đồng bộ ${state.quests.length} quest từ Discord!`, "success");
  } catch (err) {
    addLog("error", `[Đồng bộ] Lỗi mạng: ${err.message}`);
    if (showToasts) toast("Lỗi kết nối khi đồng bộ Quest", "error");
  } finally {
    state.isSyncingQuests = false;
    saveState();
    renderAll();
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

