/**
 * QUẢN LÝ TRẠNG THÁI & HÀM TIỆN ÍCH (js/state.js)
 */

const savedAccounts = JSON.parse(localStorage.getItem("dqt_accounts") || "[]");
const savedActiveId = localStorage.getItem("dqt_active_acc");
const initialActiveId = savedAccounts.some(a => a.id === savedActiveId)
  ? savedActiveId
  : (savedAccounts[0]?.id || null);

// Xóa bỏ cache cũ khỏi localStorage để 100% dữ liệu luôn lấy sống từ Discord API
try {
  localStorage.removeItem("dqt_quests");
  localStorage.removeItem("dqt_rewards");
} catch {}

function getTabFromUrl() {
  if (typeof window === "undefined") return "home";
  const path = (window.location.pathname || "").replace(/^\/+|\/+$/g, '').toLowerCase();
  if (path === "runner" || path === "quest") return "quests";
  const validTabs = ["accounts", "quests", "rewards", "logs", "settings"];
  return validTabs.includes(path) ? path : "home";
}

const state = {
  accounts: savedAccounts,
  quests: [], // 100% nạp sống từ Discord API khi vào web hoặc bấm Quét Quest
  rewards: [], // 100% nạp sống từ Discord API
  activeAccId: initialActiveId,
  activeTab: getTabFromUrl(),
  filter: "all",
  search: "",
  isRunningAll: false,
  isCheckingToken: false,
  isSyncingQuests: false,
  verifiedTokenData: null,
  logs: []
};

// Đảm bảo activeAccId luôn trỏ tới account hợp lệ nếu có tài khoản
if (state.accounts.length > 0 && (!state.activeAccId || !state.accounts.some(a => a.id === state.activeAccId))) {
  state.activeAccId = state.accounts[0].id;
}

state.isRunningAll = false;

function saveState() {
  try {
    localStorage.setItem("dqt_accounts", JSON.stringify(state.accounts));
    // KHÔNG lưu state.quests vào localStorage: 100% dữ liệu sống từ Discord API, tránh lệch giữa các trình duyệt
    localStorage.setItem("dqt_rewards", JSON.stringify(state.rewards));
    if (state.activeAccId) {
      localStorage.setItem("dqt_active_acc", state.activeAccId);
    } else {
      localStorage.removeItem("dqt_active_acc");
    }
  } catch {}
}

// Hiệu ứng Skeleton Loading cho Table (tự động khớp với thead trên mobile & desktop)
function showTableSkeleton(tbodyId, rows = 3, cols = 6) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  const ths = table ? Array.from(table.querySelectorAll('thead th')) : [];
  const colCount = ths.length || cols;

  tbody.innerHTML = Array(rows).fill(0).map(() => `
    <tr>
      ${Array(colCount).fill(0).map((_, i) => {
        const th = ths[i];
        const isHideMobile = th ? th.classList.contains('col-hide-mobile') : false;
        const hideClass = isHideMobile ? 'col-hide-mobile' : '';
        const isRight = th && (th.style.textAlign === 'right' || th.getAttribute('style')?.includes('text-align: right'));
        const alignStyle = isRight ? 'style="text-align: right;"' : '';
        const skelType = i === 0 ? 'skeleton-text' : (i === colCount - 1 ? 'skeleton-btn' : 'skeleton-tag');
        return `
          <td class="${hideClass}" ${alignStyle}>
            <div class="skeleton ${skelType}"></div>
            ${i === 0 ? '<div class="skeleton skeleton-subtext"></div>' : ''}
          </td>
        `;
      }).join('')}
    </tr>
  `).join('');
}

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

function fmtSec(sec) {
  if (sec <= 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`;
  return `${s}s`;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg, type = "info") {
  const wrap = document.getElementById("toast-container");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === "warn") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  el.innerHTML = `${iconSvg}<span class="toast-msg">${escapeHtml(msg)}</span>`;
  wrap.appendChild(el);

  setTimeout(() => {
    el.classList.add("toast-hiding");
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

function addLog(level, text) {
  const time = new Date().toTimeString().split(" ")[0];
  state.logs.push({ time, level, text });
  if (state.logs.length > 200) state.logs.shift();
  if (typeof renderLogs === 'function') renderLogs();
  if (typeof renderHomeLogs === 'function') renderHomeLogs();
}
