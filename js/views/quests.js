/**
 * VIEW: TẤT CẢ QUEST (js/views/quests.js)
 */

function renderQuests() {
  const tbody = document.getElementById("quests-tbody");
  if (!tbody) return;

  if (state.accounts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Kho Quest đang khóa</div>
            <div class="empty-desc">Cần có ít nhất 1 tài khoản Discord hợp lệ để tải và hiển thị kho nhiệm vụ.</div>
            <button class="btn btn-primary btn-sm" onclick="switchTabTo('accounts')">Đến mục Tài khoản ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const filtered = state.quests.filter(q => {
    if (state.filter === "pending" && (q.status === "completed" || q.status === "claimed")) return false;
    if (state.filter === "completed" && q.status !== "completed") return false;
    if (state.filter === "claimed" && q.status !== "claimed") return false;
    if (state.search && !q.name.toLowerCase().includes(state.search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Không tìm thấy Quest nào</div>
            <div class="empty-desc">${state.quests.length === 0 ? 'Chưa có dữ liệu nhiệm vụ từ Discord. Bấm nút bên dưới để quét danh sách nhiệm vụ thật.' : 'Không có quest nào khớp với bộ lọc hoặc từ khóa tìm kiếm.'}</div>
            ${state.quests.length === 0 ? `<button class="btn btn-primary btn-sm" onclick="syncQuestsFromDiscord(true)">Quét Quest Ngay</button>` : ''}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Sắp xếp: Chưa làm (running, queued, pending) lên đầu -> Xong chưa nhận (completed) ở giữa -> Xong đã nhận (claimed) xuống dưới cùng
  const sortedFiltered = [...filtered].sort((a, b) => {
    const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
    return (order[a.status] || 99) - (order[b.status] || 99);
  });

  tbody.innerHTML = sortedFiltered.map(q => {
    let tagHtml = "";
    let actionHtml = "";
    const questUrl = q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home');

    if (q.status === "claimed") {
      tagHtml = `<span class="tag tag-claimed">Hoàn thành</span>`;
      actionHtml = `<span style="font-size: 11px; color: var(--text-muted); padding: 4px 6px;">Hoàn thành</span>`;
    } else if (q.status === "completed") {
      tagHtml = `<span class="tag tag-completed">Chờ claim</span>`;
      actionHtml = `<button class="btn btn-primary btn-sm" onclick="claimQuest('${q.id}')">Nhận quà</button>`;
    } else if (q.status === "running") {
      tagHtml = `<span class="tag tag-running">● Đang chạy</span>`;
      actionHtml = `<a href="${questUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Link ↗</a>`;
    } else {
      // Chưa làm (pending, queued)
      tagHtml = `<span class="tag tag-pending">Chưa làm</span>`;
      actionHtml = `<a href="${questUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Link ↗</a>`;
    }

    return `
      <tr>
        <td>
          <div class="quest-name-cell" title="${escapeHtml(q.name)}">${escapeHtml(q.name)}</div>
        </td>
        <td class="col-hide-mobile" style="color: var(--text-sub);">${escapeHtml(q.publisher)}</td>
        <td class="col-hide-mobile">${escapeHtml(q.typeName)} (${fmtSec(q.targetSec)})</td>
        <td class="quest-reward-cell" title="${escapeHtml(q.reward)}">${escapeHtml(q.reward)}</td>
        <td>${tagHtml}</td>
        <td style="text-align: right; white-space: nowrap;">
          ${actionHtml}
        </td>
      </tr>
    `;
  }).join("");
}
