/**
 * CONTROLLER: ĐIỀU HƯỚNG TAB & GATING (js/controllers/nav.js)
 */

// Chuyển tab với hiệu ứng Skeleton Loading & Điều hướng URL theo miền /
window.switchTabTo = function(tab, updateHistory = true) {
  if (tab === "runner") tab = "quests";
  if (tab === "badge-runner" || tab === "games") tab = "playtime";
  const validTabs = ["home", "accounts", "quests", "rewards", "badges", "playtime", "logs", "settings"];
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

  const extraTabs = ["badges", "playtime", "logs", "settings"];
  const moreBtn = document.getElementById("btn-mobile-nav-more");
  if (moreBtn) {
    moreBtn.classList.toggle("has-active-extra", extraTabs.includes(tab));
  }

  renderSidebarUser();
  if (typeof window.translateDomTree === "function") window.translateDomTree(document.body);

  // Kích hoạt Skeleton loading cho bảng tương ứng
  if (tab === "accounts") showTableSkeleton("accounts-tbody", 2, 6);
  if (tab === "quests") showTableSkeleton("quests-tbody", 4, 7);
  if (tab === "rewards") showTableSkeleton("rewards-tbody", 3, 6);

  setTimeout(() => {
    renderAll();
  }, 280);
};

function bindNavigation() {
  const sidebar = document.querySelector(".sidebar");
  const moreBtn = document.getElementById("btn-mobile-nav-more");
  const moreText = document.getElementById("mobile-nav-more-text");

  const setExpanded = (expanded) => {
    if (!sidebar) return;
    sidebar.classList.toggle("mobile-nav-expanded", expanded);
    if (moreText) {
      const label = expanded ? "Thu gọn" : "Thêm";
      moreText.textContent = typeof window.translateDynamicText === "function" ? window.translateDynamicText(label) : label;
    }
  };

  moreBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = sidebar?.classList.contains("mobile-nav-expanded");
    setExpanded(!isExpanded);
  });

  document.addEventListener("click", (e) => {
    if (sidebar?.classList.contains("mobile-nav-expanded") && !sidebar.contains(e.target)) {
      setExpanded(false);
    }
  });

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      setExpanded(false);
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
