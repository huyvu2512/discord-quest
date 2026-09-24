/**
 * VIEW: MÃ QUÀ TẶNG & GIFT CODES (js/views/rewards.js)
 */

function renderRewards() {
  const tbody = document.getElementById("rewards-tbody");
  if (!tbody) return;

  if (state.rewards.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-title">Chưa có mã quà tặng nào</div>
            <div class="empty-desc">Khi bạn hoặc hệ thống tự động hoàn thành & nhận thưởng Quest có gift code, mã sẽ được lưu tại đây.</div>
            <button class="btn btn-secondary btn-sm" onclick="switchTabTo('runner')">Xem Tiến Độ Auto</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.rewards.map(r => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${escapeHtml(r.questName)}</td>
      <td class="col-hide-mobile" style="color: var(--text-sub);">${escapeHtml(r.account)}</td>
      <td class="col-hide-mobile"><span class="tag tag-completed">${escapeHtml(r.type)}</span></td>
      <td>
        <span class="font-mono" style="background: rgba(0,0,0,0.3); padding: 3px 6px; border-radius: 4px; user-select: all;">${escapeHtml(r.code)}</span>
        <button class="btn btn-secondary btn-sm" onclick="copyCode('${r.code}')" style="margin-left: 6px;">Copy</button>
      </td>
      <td class="col-hide-mobile" style="color: var(--text-muted); font-size: 12px;">${r.expiry}</td>
      <td style="text-align: right;">
        <a href="${r.link}" target="_blank" class="btn btn-secondary btn-sm">Mở web nhận</a>
      </td>
    </tr>
  `).join("");
}

window.copyCode = function(text) {
  navigator.clipboard.writeText(text);
  toast(`Đã chép mã: ${text}`, "success");
};
