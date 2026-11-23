/**
 * QUẢN LÝ TRẠNG THÁI CỐT LÕI (js/state.js)
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
  if (path === "badge-runner" || path === "games" || path === "playtime") return "playtime";
  const validTabs = ["accounts", "quests", "rewards", "badges", "playtime", "logs", "settings"];
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

window.isQuestRunning = function() {
  if (typeof state === 'undefined') return false;
  if (state.isRunningAll) return true;
  if (Array.isArray(state.quests)) {
    return state.quests.some(q => q.status === "running");
  }
  return false;
};

window.isPlaytimeRunning = function() {
  return Boolean(typeof badgeRunnerState !== 'undefined' && badgeRunnerState.isRunning);
};
