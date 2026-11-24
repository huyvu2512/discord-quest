/**
 * MAIN BOOTSTRAPPER (js/main.js)
 * Khởi tạo ứng dụng và kết nối các controller khi DOM sẵn sàng.
 */

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindActionButtons();
  bindTokenChecking();
  initIPFetcher();
  if (typeof window.applyI18n === "function") window.applyI18n();

  // Đảm bảo luôn tự động chọn tài khoản nếu đã có tài khoản lưu trong máy
  if (state.accounts.length > 0 && (!state.activeAccId || !state.accounts.some(a => a.id === state.activeAccId))) {
    state.activeAccId = state.accounts[0].id;
    saveState();
  }

  updateNavGating();

  // MẶC ĐỊNH KHI VỪA VÀO WEB: Bật trạng thái đồng bộ để hiện Skeleton, chỉ hiện danh sách khi API tải xong
  if (state.accounts.length > 0) {
    state.isSyncingQuests = true;
  }

  renderAll();
  checkSessionOnStartup();
  syncQuestsFromDiscord(false);
  if (typeof window.loadBadgeProfile === "function") window.loadBadgeProfile(false);

  // Kích hoạt tab ban đầu theo URL đường dẫn (VD: /accounts, /quests, /playtime, hoặc / cho trang chủ)
  const initialTab = getTabFromUrl();
  const canonicalPath = initialTab === "home" ? "/" : `/${initialTab}`;
  if (window.location.pathname !== canonicalPath) {
    window.history.replaceState({ tab: initialTab }, "", canonicalPath);
  }
  window.switchTabTo(initialTab, false);

  window.addEventListener("popstate", () => {
    const tab = getTabFromUrl();
    window.switchTabTo(tab, false);
  });

  // Khởi chạy vòng lặp hàng đợi tiến trình Quest
  initQuestQueueRunner();
});
