/**
 * CONTROLLER: HÀNG ĐỢI TIẾN TRÌNH & NÚT THAO TÁC (js/controllers/queue.js)
 */

function bindActionButtons() {
  const btnRunAll = document.getElementById("btn-run-all");
  const btnStopAll = document.getElementById("btn-stop-all");

  btnRunAll?.addEventListener("click", () => {
    if (state.accounts.length === 0) {
      toast("Chưa có tài khoản nào được kết nối!", "warn");
      window.switchTabTo("accounts");
      return;
    }

    if (typeof window.isPlaytimeRunning === 'function' && window.isPlaytimeRunning()) {
      toast("Đang có tiến trình cày huy hiệu Playtime! Vui lòng dừng Playtime trước khi chạy Quest.", "warn");
      addLog("warn", "[Quest] Không thể chạy: Tiến trình cày huy hiệu Playtime đang chạy song song.");
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
      if (q.status === "running") {
        if (typeof window.flushQuestProgressOnStop === "function") {
          window.flushQuestProgressOnStop(q);
        }
        q.status = "pending";
        delete q._runStartedAt;
        delete q._baseProgSec;
      } else if (q.status === "queued") {
        q.status = "pending";
        delete q._runStartedAt;
        delete q._baseProgSec;
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
    showTableSkeleton("rewards-tbody", 3, 6);

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

// Vòng lặp tiến trình thật: CHỈ GỬI TIẾN TRÌNH CHO ĐÚNG 1 QUEST ĐANG CHẠY (Lần lượt, Đơn luồng)
let isSendingProgress = false;
let progressTimer = null;

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
      let enrollErrMsg = "";
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
          enrollErrMsg = enrollData.error || "Discord từ chối nhận quest";
        }
      } catch (e) {
        enrollErrMsg = e.message || "Lỗi mạng khi nhận quest";
      }

      if (!enrollSuccess) {
        current.status = "pending";
        current.enrolledAt = null;
        addLog("error", `[Không thể nhận] "${current.name}": ${enrollErrMsg}. Đã tạm dừng.`);
        toast(`Không thể nhận "${current.name}"`, "warn");

        // Ngắt ngay chế độ chạy hàng đợi để không chuỗi sập làm bùng nổ 429 Rate Limit
        state.isRunningAll = false;
        const btnRun = document.getElementById("btn-run-all");
        const btnStop = document.getElementById("btn-stop-all");
        btnRun?.classList.remove("hidden");
        btnStop?.classList.add("hidden");
        return; // Dừng lại, tuyệt đối KHÔNG gửi tiến trình khi chưa đăng ký thành công
      }
    }

    // 2. Gửi tiến độ thật (Heartbeat hoặc Video Progress)
    if (!current._runStartedAt) {
      current._runStartedAt = Date.now();
      current._baseProgSec = current.progSec || 0;
    }
    const elapsedRealSec = Math.floor((Date.now() - current._runStartedAt) / 1000);

    let nextTimestamp;
    if (isVideo) {
      // Không gửi ping ảo nếu vừa mới bấm chạy dưới 5 giây (trừ khi đã có tiến độ trước đó)
      if (elapsedRealSec < 5 && (current.progSec || 0) === 0) {
        return;
      }

      const realSec = Math.min(current.targetSec, (current._baseProgSec || 0) + elapsedRealSec);

      // Nếu đã đủ thời gian targetSec, luôn gửi CHÍNH XÁC targetSec (không dùng jitter âm) để Discord kích hoạt hoàn thành 100%
      if (realSec >= current.targetSec) {
        nextTimestamp = current.targetSec;
      } else {
        // Jitter nhẹ ±0.15s cho số lẻ thập phân tự nhiên giống video player Discord
        const jitter = (Math.random() * 0.3 - 0.15);
        nextTimestamp = Number(Math.max(1, realSec + jitter).toFixed(4));
      }
    } else {
      nextTimestamp = (current._baseProgSec || 0) + elapsedRealSec;
    }

    // QUAN TRỌNG: Gửi terminal: true khi nhiệm vụ game thực tế đã đạt đủ targetSec
    const realProgressSec = (current._baseProgSec || 0) + elapsedRealSec;
    const isTerminal = !isVideo && (realProgressSec >= current.targetSec || current.progSec >= current.targetSec);

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
        // Luôn cập nhật tiến độ thực tế theo phản hồi chính xác từ Discord API
        current.progSec = Math.min(current.targetSec, discordProg);
        current._baseProgSec = current.progSec;
        current._runStartedAt = Date.now();
      } else if (isVideo) {
        current.progSec = Math.min(current.targetSec, Math.ceil(nextTimestamp));
      }

      // BẮT BUỘC KIỂM TRA CHẶT CHẼ THEO DISCORD API:
      // Tuyệt đối không tự ý đổi thành completed dựa trên bộ đếm local!
      // Chỉ hoàn thành khi Discord API trả về xác nhận thật sự:
      const isCompleted = Boolean(uStatus?.completed_at) || 
        (typeof discordProg === 'number' && discordProg >= current.targetSec) ||
        (isVideo && progRes.ok && progData.success && nextTimestamp >= current.targetSec);

      if (isCompleted) {
        current.status = "completed";
        current.progSec = current.targetSec;
        current.completedAt = uStatus?.completed_at || new Date().toISOString();
        delete current._runStartedAt;
        delete current._baseProgSec;

        addLog("success", `Hoàn thành nhiệm vụ "${current.name}" (100%)!`);
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
            addLog("success", `Toàn bộ nhiệm vụ trong hàng đợi đã hoàn tất!`);
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

      const errText = String(progData.error || '').toLowerCase();
      if (errText.includes('không đăng ký') || errText.includes('not enrolled') || progData.status === 404) {
        current.enrolledAt = null;
      }

      // Tạm dừng hàng đợi để tránh lặp sang quest tiếp theo gây rate limit hàng loạt
      state.isRunningAll = false;
      const btnRun = document.getElementById("btn-run-all");
      const btnStop = document.getElementById("btn-stop-all");
      btnRun?.classList.remove("hidden");
      btnStop?.classList.add("hidden");
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
    
    // Nếu nhiệm vụ game đang ở những giây cuối (còn <= 15s), tự động rút ngắn delay để gửi terminal heartbeat đúng lúc
    if (current && !isVideo && current.targetSec) {
      const elapsedRealSec = current._runStartedAt ? Math.floor((Date.now() - current._runStartedAt) / 1000) : 0;
      const realSec = (current._baseProgSec || 0) + elapsedRealSec;
      const remainSec = current.targetSec - Math.max(current.progSec || 0, realSec);
      if (remainSec <= 15) {
        return Math.max(3000, Math.max(0, remainSec) * 1000 + 1000);
      }
    }

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

function scheduleNextProgressTick(delayMs) {
  if (progressTimer) clearTimeout(progressTimer);
  const current = state.quests.find(q => q.status === "running");
  const delay = typeof delayMs === 'number' ? delayMs : (current ? getRunnerDelayMs(current) : 5000);
  progressTimer = setTimeout(async () => {
    await runSingleProgressTick();
    scheduleNextProgressTick();
  }, delay);
}

// Gắn hàm global để khi lưu cài đặt có thể cập nhật nhịp tick ngay
window.rescheduleProgressTick = function() {
  scheduleNextProgressTick(1000);
};

// Gửi ngay tiến độ hiện tại lên Discord khi người dùng bấm Tạm dừng / Dừng để không bị lệch giây
window.flushQuestProgressOnStop = async function(quest) {
  if (!quest || !quest.enrolledAt) return;
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (!acc || !acc.token) return;

  const elapsedRealSec = quest._runStartedAt ? Math.floor((Date.now() - quest._runStartedAt) / 1000) : 0;
  const exactSec = Math.min(
    quest.targetSec || 0,
    Math.max(quest.progSec || 0, (quest._baseProgSec || 0) + elapsedRealSec)
  );
  if (exactSec <= 0) return;

  quest.progSec = exactSec;
  const isVideo = quest.taskType === 'WATCH_VIDEO' || quest.taskType === 'WATCH_VIDEO_ON_MOBILE' || (typeof quest.taskType === 'string' && quest.taskType.includes('VIDEO'));
  const timestamp = isVideo ? Number(Math.max(1, exactSec).toFixed(4)) : exactSec;
  const isTerminal = !isVideo && exactSec >= (quest.targetSec || 0);

  try {
    const res = await fetch("/api/quests/progress", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: acc.token,
        questId: quest.id,
        taskType: quest.taskType,
        applicationId: quest.applicationId,
        timestamp,
        terminal: isTerminal,
        trafficMetadataSealed: quest.trafficMetadataSealed
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      const uStatus = data.user_status;
      let discordProg = uStatus?.progress?.[quest.taskType]?.value;
      if (typeof discordProg !== 'number' && uStatus?.progress) {
        const firstProg = Object.values(uStatus.progress)[0];
        if (firstProg && typeof firstProg.value === 'number') discordProg = firstProg.value;
      }
      if (typeof discordProg === 'number') {
        quest.progSec = Math.min(quest.targetSec, discordProg);
      }
      if (uStatus?.completed_at || (typeof discordProg === 'number' && discordProg >= quest.targetSec)) {
        quest.status = "completed";
        quest.progSec = quest.targetSec;
        quest.completedAt = uStatus?.completed_at || new Date().toISOString();
      }
      addLog("info", `[Đồng bộ dừng] Đã lưu tiến độ "${quest.name}": ${fmtSec(quest.progSec)} / ${fmtSec(quest.targetSec)}`);
      saveState();
      renderCounters();
      if (state.activeTab === "quests" || state.activeTab === "runner") renderQuests();
    }
  } catch {}
};

// Khởi chạy nhịp tick thủ công ngay lập tức khi bấm nút (có mutex bảo vệ chống gọi kép)
window.triggerRunnerTick = function() {
  if (!isSendingProgress) {
    if (progressTimer) clearTimeout(progressTimer);
    runSingleProgressTick().finally(() => {
      scheduleNextProgressTick();
    });
  }
};

function initQuestQueueRunner() {
  // Khởi chạy nhịp tick động
  scheduleNextProgressTick(3000);

  // Nhịp cập nhật thời gian thực từng giây (1s) cho giao diện người dùng
  setInterval(() => {
    const current = state.quests.find(q => q.status === "running");
    if (!current) return;

    if (!current._runStartedAt) {
      current._runStartedAt = Date.now();
      current._baseProgSec = current.progSec || 0;
    }

    const elapsedRealSec = Math.floor((Date.now() - current._runStartedAt) / 1000);
    // Giao diện tự động đếm giây khi đang chạy, nhưng BẮT BUỘC chỉ đếm tới tối đa targetSec - 1.
    // Giây cuối cùng (100% / Hoàn thành) PHẢI do Discord API phản hồi xác nhận.
    const maxSimulatedSec = Math.max(0, (current.targetSec || 1) - 1);
    const calculatedSec = Math.min(maxSimulatedSec, (current._baseProgSec || 0) + elapsedRealSec);

    if (calculatedSec !== current.progSec && calculatedSec <= maxSimulatedSec) {
      current.progSec = calculatedSec;
      if ((state.activeTab === "quests" || state.activeTab === "runner") && typeof renderQuests === "function") {
        renderQuests();
      }
    }
  }, 1000);
}
