/**
 * QUẢN LÝ TRẠNG THÁI & HÀM TIỆN ÍCH (js/state.js)
 */

const savedAccounts = JSON.parse(localStorage.getItem("dqt_accounts") || "[]");
const savedActiveId = localStorage.getItem("dqt_active_acc");
const initialActiveId = savedAccounts.some(a => a.id === savedActiveId)
  ? savedActiveId
  : (savedAccounts[0]?.id || null);

// Xóa bỏ triệt để cache quest cũ khỏi localStorage để 100% dữ liệu luôn lấy sống từ Discord API
try {
  localStorage.removeItem("dqt_quests");
} catch {}

let savedRewards = JSON.parse(localStorage.getItem("dqt_rewards") || "[]");
savedRewards = savedRewards.filter(r => {
  // Chỉ lưu giữ những phần thưởng thực sự CÓ MÃ CODE khả dụng
  if (!r.code || typeof r.code !== 'string' || !r.code.trim()) return false;
  const t = (r.type || '').toLowerCase();
  if (t.includes('orb') || /avatar|decoration|profile effect|collectible|badge|khung/i.test(t)) return false;
  return true;
});

// Khôi phục và đảm bảo các mã code hợp lệ của tài khoản không bao giờ bị mất
const knownRewardCodes = [
  { questName: "Apex VS Street Fighter 6 Event", type: "Kung Fu Coach tracker set", code: "3Y22-PJSM-CVJM-ZCDY" },
  { questName: "ROBLOX", type: "Blurple 8-Bit Wings", code: "026154290182" }
];
knownRewardCodes.forEach(kr => {
  if (!savedRewards.some(r => r.code === kr.code)) {
    savedRewards.push({
      questName: kr.questName,
      type: kr.type,
      code: kr.code,
      status: "claimed",
      expiry: "Còn hạn dùng"
    });
  }
});

try {
  localStorage.setItem("dqt_rewards", JSON.stringify(savedRewards));
} catch {}

function getTabFromUrl() {
  if (typeof window === "undefined") return "home";
  const path = (window.location.pathname || "").replace(/^\/+|\/+$/g, '').toLowerCase();
  const validTabs = ["accounts", "runner", "quests", "rewards", "logs", "settings"];
  return validTabs.includes(path) ? path : "home";
}

const state = {
  accounts: savedAccounts,
  quests: [], // 100% nạp sống từ Discord API khi vào web hoặc bấm Quét Quest
  rewards: savedRewards,
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

// Hiệu ứng Skeleton Loading cho Table
function showTableSkeleton(tbodyId, rows = 3, cols = 6) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = Array(rows).fill(0).map(() => `
    <tr>
      ${Array(cols).fill(0).map((_, i) => `
        <td>
          <div class="skeleton ${i === 0 ? 'skeleton-text' : (i === 3 ? 'skeleton-bar' : (i === cols - 1 ? 'skeleton-btn' : 'skeleton-tag'))}"></div>
          ${i === 0 ? '<div class="skeleton skeleton-subtext"></div>' : ''}
        </td>
      `).join('')}
    </tr>
  `).join('');
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
