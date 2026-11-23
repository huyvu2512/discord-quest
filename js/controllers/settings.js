/**
 * CONTROLLER: CÀI ĐẶT HỆ THỐNG (js/controllers/settings.js)
 */

window.stepSetting = function(id, delta, min, max) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = parseInt(el.value, 10) || min;
  val = Math.max(min, Math.min(max, val + delta));
  el.value = val;
};

function bindSettings() {
  const btnSave = document.getElementById("btn-save-settings");
  const btnReset = document.getElementById("btn-reset-settings");

  // Load saved settings từ localStorage
  try {
    const raw = localStorage.getItem("dqt_settings");
    if (raw) {
      const s = JSON.parse(raw);
      if (s.autoClaim !== undefined) {
        const el = document.getElementById("set-auto-claim");
        if (el) el.checked = s.autoClaim;
      }
      if (s.autoEnroll !== undefined) {
        const el = document.getElementById("set-auto-enroll");
        if (el) el.checked = s.autoEnroll;
      }
      if (s.videoInterval !== undefined) {
        const el = document.getElementById("set-video-interval");
        if (el) el.value = s.videoInterval;
      }
      if (s.gameInterval !== undefined) {
        const el = document.getElementById("set-game-interval");
        const val = s.gameInterval === 60 ? 20 : s.gameInterval;
        if (el) el.value = val;
      }
      if (s.randomJitter !== undefined) {
        const el = document.getElementById("set-random-jitter");
        if (el) el.checked = s.randomJitter;
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc cài đặt:", e);
  }

  btnSave?.addEventListener("click", () => {
    const s = {
      autoClaim: document.getElementById("set-auto-claim")?.checked ?? true,
      autoEnroll: document.getElementById("set-auto-enroll")?.checked ?? true,
      videoInterval: parseInt(document.getElementById("set-video-interval")?.value, 10) || 7,
      gameInterval: parseInt(document.getElementById("set-game-interval")?.value, 10) || 20,
      randomJitter: document.getElementById("set-random-jitter")?.checked ?? true
    };
    localStorage.setItem("dqt_settings", JSON.stringify(s));
    toast("Đã lưu cài đặt hệ thống!", "success");
    addLog("info", `[Cài đặt] Đã lưu: AutoClaim=${s.autoClaim ? 'Bật' : 'Tắt'}, Video=${s.videoInterval}s, Game=${s.gameInterval}s`);
    if (typeof window.rescheduleProgressTick === 'function') {
      window.rescheduleProgressTick();
    }
  });

  btnReset?.addEventListener("click", () => {
    const claimEl = document.getElementById("set-auto-claim");
    const enrollEl = document.getElementById("set-auto-enroll");
    const videoEl = document.getElementById("set-video-interval");
    const gameEl = document.getElementById("set-game-interval");
    const jitterEl = document.getElementById("set-random-jitter");

    if (claimEl) claimEl.checked = true;
    if (enrollEl) enrollEl.checked = true;
    if (videoEl) videoEl.value = 7;
    if (gameEl) gameEl.value = 20;
    if (jitterEl) jitterEl.checked = true;

    localStorage.removeItem("dqt_settings");
    toast("Đã khôi phục cài đặt mặc định!", "info");
    addLog("info", "[Cài đặt] Đã khôi phục thông số khuyến nghị ban đầu.");
  });
}
