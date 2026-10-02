/**
 * VIEW: TIẾN ĐỘ AUTO LẦN LƯỢT (js/views/runner.js)
 */

function renderRunner() {
  const tbody = document.getElementById("runner-tbody");
  if (!tbody) return;

  if (state.accounts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Tính năng đang khóa</div>
            <div class="empty-desc">Vui lòng thêm và xác thực Token ở mục "1. Tài khoản" để mở khóa tiến độ Auto Quest.</div>
            <button class="btn btn-primary btn-sm" onclick="switchTabTo('accounts')">Đến mục Tài khoản ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // MẶC ĐỊNH KHI ĐANG TẢI/ĐỒNG BỘ TỪ DISCORD: Hiện Skeleton shimmer, load xong API mới hiện danh sách
  if (state.isSyncingQuests) {
    showTableSkeleton("runner-tbody", 4, 6);
    return;
  }

  // Sắp xếp: Chưa làm (running, queued, pending) lên đầu -> Xong chưa nhận (completed) ở giữa -> Xong đã nhận (claimed) xuống dưới cùng
  const activeQuests = [...state.quests]
    .filter(q => {
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord') && q.status !== 'claimed' && q.status !== 'completed') return false;
      if (q.isExpired && q.status !== 'claimed' && q.status !== 'completed') return false;
      if (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now() && q.status !== 'claimed' && q.status !== 'completed') return false;
      return true;
    })
    .sort((a, b) => {
      // 1. Phân nhóm trạng thái chính:
      // 1: running (đang chạy) -> 2: queued (hàng đợi) -> 3: pending (chưa làm) -> 4: completed (chờ nhận quà) -> 5: claimed (đã nhận)
      const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
      const statusDiff = (order[a.status] || 99) - (order[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;

      // 2. TRONG MỤC CHƯA LÀM (running / queued / pending):
      if (a.status === 'running' || a.status === 'queued' || a.status === 'pending') {
        // 2.1 Ưu tiên Xem Video trước (18s / 1-2 phút) lên trên cùng trước các game PC 15 phút
        const isVideoA = a.taskType?.includes('VIDEO') ? 0 : 1;
        const isVideoB = b.taskType?.includes('VIDEO') ? 0 : 1;
        if (isVideoA !== isVideoB) return isVideoA - isVideoB;

        // 2.2 Nếu cùng là video: ưu tiên thời lượng nhanh hơn (18s trước 134s)
        if (isVideoA === 0 && (a.targetSec !== b.targetSec)) {
          return (a.targetSec || 0) - (b.targetSec || 0);
        }

        // 2.3 Nhiệm vụ mới nhất lên trên: theo startsAt hoặc ID Snowflake Discord
        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      }

      // 3. TRONG MỤC CHƯA NHẬN (completed - chờ nhận quà):
      if (a.status === 'completed') {
        // Nhiệm vụ mới hoàn thành gần đây nhất lên trên cùng
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      }

      // 4. TRONG MỤC ĐÃ NHẬN (claimed - hoàn tất):
      if (a.status === 'claimed') {
        // Nhiệm vụ mới nhận gần đây nhất lên trên cùng, nhiệm vụ cũ đẩy xuống dưới
        const timeA = a.claimedAt ? new Date(a.claimedAt).getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
        const timeB = b.claimedAt ? new Date(b.claimedAt).getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      }

      return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
    });
  let queueOrder = 1;

  if (activeQuests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
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
    const isDone = q.status === "completed" || q.status === "claimed";
    if (isDone) {
      q.progSec = q.targetSec;
    }
    const pct = isDone ? 100 : Math.min(99, Math.floor((q.progSec / q.targetSec) * 100));
    const remain = isDone ? 0 : Math.max(0, q.targetSec - q.progSec);

    let statusTag = "";
    let actionBtn = "";

    if (q.status === "running") {
      statusTag = `<span class="tag tag-running">● Đang chạy</span>`;
      actionBtn = `<button class="btn btn-secondary btn-sm" onclick="pauseQuest('${q.id}')">Tạm dừng</button>`;
    } else if (q.status === "queued") {
      statusTag = `<span class="tag tag-pending">Hàng đợi #${queueOrder++}</span>`;
      actionBtn = `<button class="btn btn-secondary btn-run btn-sm" onclick="prioritizeQuest('${q.id}')">Chạy</button>`;
    } else if (q.status === "completed") {
      statusTag = `<span class="tag tag-completed">Chờ nhận quà</span>`;
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="claimQuest('${q.id}')">Nhận quà</button>`;
    } else if (q.status === "claimed") {
      statusTag = `<span class="tag tag-claimed">Hoàn thành</span>`;
      actionBtn = `<span style="font-size: 11px; color: var(--text-muted); padding: 4px 6px;">Hoàn thành</span>`;
    } else {
      statusTag = `<span class="tag tag-pending">Chưa chạy</span>`;
      actionBtn = `<button class="btn btn-secondary btn-run btn-sm" onclick="startQuest('${q.id}')">Chạy</button>`;
    }

    return `
      <tr>
        <td>
          <div class="quest-name-cell" title="${escapeHtml(q.name)}">${escapeHtml(q.name)}</div>
          <div class="quest-sub-cell" title="${escapeHtml(q.publisher)}">${escapeHtml(q.publisher)}</div>
        </td>
        <td class="col-hide-mobile"><span class="tag tag-pending">${escapeHtml(q.typeName)}</span></td>
        <td class="quest-reward-cell" title="${escapeHtml(q.reward)}">${escapeHtml(q.reward)}</td>
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

  addLog("info", `[Bắt đầu] Đã kích hoạt chạy "${target.name}".`);
  toast(`Bắt đầu chạy: ${target.name}`, "info");
  saveState();
  if (typeof renderAll === 'function') renderAll();

  // Kích hoạt ngay nhịp tick tập trung trong main.js (có mutex chống gọi kép / chồng chéo)
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
  if (!target) return;
  target.status = "pending";
  delete target._runStartedAt;
  delete target._baseProgSec;
  addLog("warn", `[Tạm dừng] Đã tạm dừng "${target.name}".`);
  toast(`Đã tạm dừng quest`, "warn");
  saveState();
  if (typeof renderAll === 'function') renderAll();
};

window.claimQuest = function(id) {
  const q = state.quests.find(x => x.id === id);
  if (!q) return;

  const url = q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home');

  // Mở tab Discord trực tiếp để người dùng tự nhận và giải captcha
  window.open(url, '_blank', 'noopener,noreferrer');

  addLog("info", `[Nhận quà] Đã mở link Discord cho "${q.name}". Sau khi bạn nhận quà trên Discord, web sẽ tự đồng bộ trạng thái từ API.`);
  toast(`Đang mở Discord để nhận quà...`, "info");
};
