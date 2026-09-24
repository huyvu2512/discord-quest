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

  // Sắp xếp: Chưa làm (running, queued, pending) lên đầu -> Xong chưa nhận (completed) ở giữa -> Xong đã nhận (claimed) xuống dưới cùng
  const activeQuests = [...state.quests].sort((a, b) => {
    const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
    return (order[a.status] || 99) - (order[b.status] || 99);
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
    const pct = isDone ? 100 : Math.min(100, Math.round((q.progSec / q.targetSec) * 100));
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

// Bắt đầu 1 quest (chỉ cho phép 1 quest chạy tại 1 thời điểm)
window.startQuest = async function(id) {
  state.quests.forEach(q => {
    if (q.status === "running" && q.id !== id) {
      q.status = "queued";
    }
  });

  const target = state.quests.find(x => x.id === id);
  if (!target) return;
  target.status = "running";

  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (acc && acc.token && !target.enrolledAt) {
    addLog("info", `[Nhận nhiệm vụ] Đang gửi POST /quests/${target.id}/enroll...`);
    try {
      const res = await fetch("/api/quests/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: acc.token, questId: target.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        target.enrolledAt = new Date().toISOString();
        addLog("success", `[Nhận nhiệm vụ] Đã nhận quest "${target.name}" trên Discord.`);
      } else {
        addLog("error", `[Nhận nhiệm vụ] Thất bại cho "${target.name}": ${data.error || 'Bỏ qua'}`);
      }
    } catch (err) {
      addLog("error", `Lỗi kết nối enroll: ${err.message}`);
    }
  }

  addLog("info", `[Bắt đầu] Đã kích hoạt chạy "${target.name}".`);
  toast(`Bắt đầu chạy: ${target.name}`, "info");
  saveState();
  if (typeof renderAll === 'function') renderAll();
};

window.prioritizeQuest = function(id) {
  window.startQuest(id);
};

window.pauseQuest = function(id) {
  const target = state.quests.find(x => x.id === id);
  if (!target) return;
  target.status = "queued";
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

  // Tự động chuyển tiếp quest tiếp theo nếu có quest đang chờ trong hàng đợi
  const nextInQueue = state.quests.find(item => item.status === "queued" || item.status === "pending");
  if (nextInQueue && !state.quests.some(item => item.status === "running")) {
    nextInQueue.status = "running";
    addLog("info", `[Hàng đợi] Tự động chuyển sang quest tiếp theo: "${nextInQueue.name}"...`);
    toast(`Chuyển sang: ${nextInQueue.name}`, "info");
    if (typeof window.startQuest === 'function') {
      window.startQuest(nextInQueue.id);
    }
  }

  // Tự động kiểm tra đồng bộ lại sau khi người dùng thao tác trên Discord
  setTimeout(() => {
    if (typeof syncQuestsFromDiscord === 'function') syncQuestsFromDiscord(false);
  }, 6000);
  setTimeout(() => {
    if (typeof syncQuestsFromDiscord === 'function') syncQuestsFromDiscord(false);
  }, 15000);

  saveState();
  if (typeof renderAll === 'function') renderAll();
};
