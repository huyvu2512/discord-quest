/**
 * VIEW: QUEST & TIẾN ĐỘ AUTO (js/views/quests.js)
 * Quản lý danh sách nhiệm vụ Discord, điều phối hàng đợi và nhận thưởng
 */

// Định dạng ngày hết hạn ngắn gọn: .../... (DD/MM)
function formatExpiryShort(expiresAt) {
  if (!expiresAt) return "--/--";
  try {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) return "--/--";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return "--/--";
  }
}

// Định dạng đầy đủ ngày tháng năm khi hover chuột
function formatExpiryFull(expiresAt) {
  if (!expiresAt) return "Không có hạn";
  try {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) return "Không rõ hạn";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return expiresAt;
  }
}

function renderQuests() {
  const tbody = document.getElementById("quests-tbody");
  if (!tbody) return;

  if (state.accounts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-title">Tính năng đang khóa</div>
            <div class="empty-desc">Chưa có tài khoản nào được xác thực để tải danh sách Quest.</div>
            <button class="btn btn-primary btn-sm" onclick="switchTabTo('accounts')">Đến mục Tài khoản ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // MẶC ĐỊNH KHI ĐANG TẢI/ĐỒNG BỘ TỪ DISCORD: Hiện Skeleton shimmer, load xong API mới hiện danh sách
  if (state.isSyncingQuests) {
    showTableSkeleton("quests-tbody", 4, 7);
    return;
  }

  // Sắp xếp: Chưa làm (running, queued, pending) lên đầu -> Xong chưa nhận (completed) ở giữa -> Xong đã nhận (claimed) xuống dưới cùng
  const now = Date.now();
  const activeQuests = [...state.quests]
    .filter(q => {
      // 1. Loại bỏ các quest rác/ảo không có tên hoặc không có ứng dụng nhiệm vụ
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord') && q.status !== 'claimed' && q.status !== 'completed') return false;
      // 2. Ẩn tất cả nhiệm vụ đã hết hạn hẳn (dù là claimed hay pending)
      const isExpired = q.isExpired || (q.expiresAt && new Date(q.expiresAt).getTime() <= now);
      if (isExpired) return false;
      return true;
    })
    .sort((a, b) => {
      // 1. PHÂN NHÓM CHÍNH:
      // Nhóm 1: Chưa làm xong (running, queued, pending) -> LÊN ĐẦU TIÊN
      // Nhóm 2: Đã làm xong nhưng chưa nhận thưởng (completed) -> XẾP DƯỚI CÁC QUEST CHƯA LÀM
      // Nhóm 3: Đã làm và đã nhận quà (claimed) -> DƯỚI CÙNG
      const getTier = (status) => {
        if (status === 'running' || status === 'queued' || status === 'pending') return 1;
        if (status === 'completed') return 2;
        if (status === 'claimed') return 3;
        return 4;
      };

      const tierA = getTier(a.status);
      const tierB = getTier(b.status);
      if (tierA !== tierB) return tierA - tierB;

      // 2. TRONG NHÓM 1: CHƯA LÀM HOẶC ĐANG LÀM (running, queued, pending)
      if (tierA === 1) {
        // Đang chạy ưu tiên lên trên cùng
        const runA = a.status === 'running' ? 0 : 1;
        const runB = b.status === 'running' ? 0 : 1;
        if (runA !== runB) return runA - runB;

        // Sắp hết hạn lên trước để kịp làm!
        const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        if (expA !== expB) return expA - expB;

        // Ưu tiên Xem Video trước (18s / 1-2 phút) lên trên cùng trước các game PC 15 phút
        const isVideoA = a.taskType?.includes('VIDEO') ? 0 : 1;
        const isVideoB = b.taskType?.includes('VIDEO') ? 0 : 1;
        if (isVideoA !== isVideoB) return isVideoA - isVideoB;

        // Nếu cùng là video: ưu tiên thời lượng nhanh hơn (18s trước 134s)
        if (isVideoA === 0 && (a.targetSec !== b.targetSec)) {
          return (a.targetSec || 0) - (b.targetSec || 0);
        }

        // Nhiệm vụ mới hơn lên trên
        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      }

      // 3. TRONG NHÓM 2: ĐÃ LÀM XONG NHƯNG CHƯA NHẬN THƯỞNG (completed)
      if (tierA === 2) {
        // Sắp hết hạn lên trước để kịp nhận quà!
        const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        if (expA !== expB) return expA - expB;

        const isVideoA = a.taskType?.includes('VIDEO') ? 0 : 1;
        const isVideoB = b.taskType?.includes('VIDEO') ? 0 : 1;
        if (isVideoA !== isVideoB) return isVideoA - isVideoB;

        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      }

      // 3. TRONG NHÓM ĐÃ LÀM RỒI (claimed):
      // 3.1 Còn hạn (chưa hết hạn) ở trên, Đã hết hạn (màu đỏ) tống xuống dưới cùng
      const now = Date.now();
      const isExpiredA = a.isExpired || (a.expiresAt && new Date(a.expiresAt).getTime() <= now) ? 1 : 0;
      const isExpiredB = b.isExpired || (b.expiresAt && new Date(b.expiresAt).getTime() <= now) ? 1 : 0;
      if (isExpiredA !== isExpiredB) return isExpiredA - isExpiredB;

      // 3.2 Nếu cùng còn hạn: sắp xếp theo hạn chót tăng dần (expiresAt)
      if (!isExpiredA) {
        const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        if (expA !== expB) return expA - expB;
      }

      // 3.3 Nếu cùng đã hết hạn: nhiệm vụ hết hạn gần đây nhất lên trước, hết hạn từ rất lâu (tháng 5, 8) tống xuống dưới cùng
      const expA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
      const expB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      if (expA !== expB) return expB - expA;

      // 3.4 Fallback theo thời điểm nhận/hoàn thành hoặc ID Snowflake
      const timeA = a.claimedAt ? new Date(a.claimedAt).getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const timeB = b.claimedAt ? new Date(b.claimedAt).getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
      if (timeA !== timeB) return timeB - timeA;

      return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
    });

  const hasRunning = (state.quests || []).some(q => q.status === "running");
  const isRunningAll = Boolean(state.isRunningAll);
  let queueOrder = 1;

  if (activeQuests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-title">Chưa có nhiệm vụ trong hàng đợi</div>
            <div class="empty-desc">Tài khoản hiện tại chưa tải danh sách Quest từ Discord. Bấm nút bên dưới để quét danh sách nhiệm vụ thật.</div>
            <button class="btn btn-primary btn-sm" onclick="syncQuestsFromDiscord(true)">Quét Quest Ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = activeQuests.map(q => {
    const isDone = q.status === "completed" || q.status === "claimed" || (q.targetSec > 0 && q.progSec >= q.targetSec);
    if (isDone) {
      q.progSec = q.targetSec;
      if (q.status !== "claimed") {
        q.status = "completed";
      }
    }
    const pct = isDone ? 100 : Math.min(99, Math.floor((q.progSec / q.targetSec) * 100));
    const remain = isDone ? 0 : Math.max(0, q.targetSec - q.progSec);

    const isExpiredQuest = q.isExpired || (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now());
    const expShort = formatExpiryShort(q.expiresAt);
    const expFull = formatExpiryFull(q.expiresAt);

    let actionBtn = "";
    const questUrl = q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home');

    if (q.status === "running") {
      actionBtn = `<button class="btn btn-secondary btn-sm" onclick="pauseQuest('${q.id}')">Tạm dừng</button>`;
    } else if (q.status === "completed") {
      actionBtn = `<a href="${questUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Nhận quà</a>`;
    } else if (q.status === "claimed") {
      actionBtn = `
        <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
          <span class="col-hide-mobile" style="font-size: 11px; color: var(--text-muted); padding: 4px 6px;">Hoàn thành</span>
          <a href="${questUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; justify-content: center; height: 32px; width: 32px; padding: 0; border-radius: 6px; flex-shrink: 0;" title="Mở nhiệm vụ trên Discord">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          </a>
        </div>
      `;
    } else if (isRunningAll) {
      // Chạy tất cả: ẩn nút chạy, hiện Hàng chờ #...
      actionBtn = `<span class="tag tag-pending font-mono" style="display: inline-flex; align-items: center; justify-content: center; height: 28px; padding: 0 10px; font-size: 11.5px; border-radius: 6px; font-weight: 500;">Hàng chờ #${queueOrder++}</span>`;
    } else if (hasRunning) {
      // Chạy từng cái 1: khóa nút chạy của các quest còn lại
      actionBtn = `<button class="btn btn-secondary btn-run btn-sm" disabled style="opacity: 0.45; cursor: not-allowed;" title="Tạm dừng nhiệm vụ đang chạy để chọn nhiệm vụ này">Chạy</button>`;
    } else {
      // Chưa có quest nào chạy: cho phép chọn chạy bình thường
      actionBtn = `<button class="btn btn-secondary btn-run btn-sm" onclick="startQuest('${q.id}')">Chạy</button>`;
    }

    return `
      <tr>
        <td>
          <div class="quest-name-cell" title="${escapeHtml(q.name)}">${escapeHtml(q.name)}</div>
          <div class="quest-sub-cell" title="${escapeHtml(q.publisher)}">
            <span>${escapeHtml(q.publisher)}</span>
          </div>
        </td>
        <td class="col-hide-mobile"><span class="tag tag-pending">${escapeHtml(q.typeName)}</span></td>
        <td class="quest-reward-cell col-hide-mobile" title="${escapeHtml(q.reward)}">${escapeHtml(q.reward)}</td>
        <td class="quest-expiry-cell font-mono" style="font-size: 11.5px; color: ${isExpiredQuest ? 'var(--red)' : 'var(--text-sub)'}; white-space: nowrap;" title="Hạn chót: ${escapeHtml(expFull)}">
          ${isExpiredQuest ? `<span style="color: var(--red); font-weight: 600;">${expShort}</span>` : expShort}
        </td>
        <td class="quest-progress-cell">
          <div class="progress-wrap">
            <div class="progress-track">
              <div class="progress-bar-fill ${isDone ? 'done' : ''}" style="width: ${pct}%"></div>
            </div>
            <div class="progress-label">
              <span>${pct}%</span>
              <span>${fmtSec(q.progSec)} / ${fmtSec(q.targetSec)}</span>
            </div>
          </div>
        </td>
        <td class="col-hide-mobile font-mono" style="color: ${isDone ? 'var(--green)' : 'var(--text-main)'}; font-size: 12px;">
          ${isDone ? 'Hoàn thành' : fmtSec(remain)}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          ${actionBtn}
        </td>
      </tr>
    `;
  }).join("");
}

// Bắt đầu 1 quest (chạy đơn lẻ theo yêu cầu người dùng, không tự động nối đuôi)
window.startQuest = function(id) {
  // Tắt chế độ Chạy Tất Cả
  state.isRunningAll = false;

  // Đưa toàn bộ các quest khác đang chạy hoặc trong hàng đợi về pending
  state.quests.forEach(q => {
    if ((q.status === "running" || q.status === "queued") && q.id !== id) {
      q.status = "pending";
    }
  });

  const target = state.quests.find(x => x.id === id);
  if (!target) return;
  target.status = "running";
  target._runStartedAt = Date.now();
  target._baseProgSec = target.progSec || 0;

  const btnRun = document.getElementById("btn-run-all");
  const btnStop = document.getElementById("btn-stop-all");
  btnRun?.classList.remove("hidden");
  btnStop?.classList.add("hidden");

  addLog("info", `[Bắt đầu] Đã kích hoạt chạy "${target.name}".`);
  toast(`Bắt đầu chạy: ${target.name}`, "info");
  saveState();
  if (typeof renderAll === 'function') renderAll();

  // Kích hoạt ngay nhịp tick tập trung trong main.js
  if (typeof window.triggerRunnerTick === 'function') {
    window.triggerRunnerTick();
  }
};

window.prioritizeQuest = function(id) {
  window.startQuest(id);
};

window.pauseQuest = function(id) {
  state.isRunningAll = false;
  const target = state.quests.find(x => x.id === id);
  if (target) {
    target.status = "pending";
    delete target._runStartedAt;
    delete target._baseProgSec;
    addLog("warn", `[Tạm dừng] Đã tạm dừng "${target.name}".`);
    toast(`Đã tạm dừng quest`, "warn");
  }

  // Chuyển toàn bộ các quest còn lại trong hàng đợi về pending
  state.quests.forEach(q => {
    if (q.status === "queued" || q.status === "running") {
      q.status = "pending";
      delete q._runStartedAt;
      delete q._baseProgSec;
    }
  });

  const btnRun = document.getElementById("btn-run-all");
  const btnStop = document.getElementById("btn-stop-all");
  btnRun?.classList.remove("hidden");
  btnStop?.classList.add("hidden");

  saveState();
  if (typeof renderAll === 'function') renderAll();
};

// Bí danh tương thích ngược
window.renderRunner = renderQuests;
