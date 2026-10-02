/**
 * VIEW: RUNNER (TIẾN ĐỘ AUTO)
 * Đã được hợp nhất toàn diện vào js/views/quests.js theo cấu trúc mới.
 */

window.renderRunner = function() {
  if (typeof renderQuests === "function") {
    renderQuests();
  }
};
