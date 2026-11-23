/**
 * CONTROLLER: ĐỒNG BỘ DỮ LIỆU QUEST THẬT TỪ DISCORD (js/controllers/sync.js)
 */

window.syncQuestsFromDiscord = async function(showToasts = false) {
  if (state.accounts.length === 0) return;
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (!acc || !acc.token) return;

  state.isSyncingQuests = true;
  renderCounters();

  // Luôn hiển thị Skeleton Shimmer khi đang tải/đồng bộ, tuyệt đối KHÔNG hiện danh sách cũ
  if (state.activeTab === "quests" || state.activeTab === "runner") showTableSkeleton("quests-tbody", 4, 7);
  if (state.activeTab === "rewards") showTableSkeleton("rewards-tbody", 3, 6);

  addLog("info", `[Đồng bộ] Gửi GET /api/quests (@${acc.username})...`);

  try {
    let customIds = [];
    try {
      customIds = JSON.parse(localStorage.getItem('custom_quest_ids') || '[]');
    } catch {}
    const customParam = customIds.length > 0 ? `&customIds=${encodeURIComponent(customIds.join(','))}` : '';
    const res = await fetch(`/api/quests?token=${encodeURIComponent(acc.token)}${customParam}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      addLog("error", `[Đồng bộ] Thất bại: ${data.error || 'Lỗi không xác định'}`);
      if (showToasts) toast(data.error || "Không thể đồng bộ Quest từ Discord", "error");
      return;
    }

    // Cập nhật số dư Orbs thật từ Discord
    acc.orbs = data.balance ?? acc.orbs ?? 0;

    const rawQuests = data.quests || [];
    // LỌC BỎ NGAY TỪ KHI QUÉT: Nhiệm vụ hết hạn hoặc không hợp lệ mà chưa làm thì loại bỏ hoàn toàn
    const validQuests = rawQuests.filter(q => {
      if (q.name === 'Nhiệm vụ Discord' && (!q.publisher || q.publisher === 'Discord') && q.status !== 'claimed' && q.status !== 'completed') return false;
      if (q.status === "claimed" || q.status === "completed") return true;
      if (q.isExpired) return false;
      if (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now()) return false;
      return true;
    });

    const currentRunningId = state.quests.find(q => q.status === "running")?.id;
    const currentQueuedIds = new Set(state.quests.filter(q => q.status === "queued").map(q => q.id));

    // Nạp danh sách nhiệm vụ mới chuẩn từ API (đã được sắp xếp ổn định từ Backend)
    // QUAN TRỌNG: Bảo toàn mã code đã lưu vì Discord /quests/@me/claimed không gửi mã code dạng văn bản trực tiếp
    state.quests = validQuests.map(nq => {
      const prevQ = state.quests.find(q => q.id === nq.id);
      const savedR = state.rewards.find(r => (r.id && r.id === nq.id) || (r.code && nq.code && r.code === nq.code));

      const existingCode = nq.code || prevQ?.code || savedR?.code || null;
      if (existingCode) {
        nq.code = existingCode;
        nq.hasGiftCode = true;
      }

      // 100% SỐNG TỪ DISCORD API: Không ép trạng thái ảo từ cache, lấy chuẩn theo API
      if (currentRunningId === nq.id && nq.status !== "completed" && nq.status !== "claimed") {
        nq.status = "running";
        if (prevQ?._runStartedAt) nq._runStartedAt = prevQ._runStartedAt;
        if (typeof prevQ?._baseProgSec === 'number') nq._baseProgSec = prevQ._baseProgSec;
      } else if (currentQueuedIds.has(nq.id) && nq.status !== "completed" && nq.status !== "claimed") {
        nq.status = "queued";
      }
      return nq;
    });

    // Luôn bảo toàn các Gift code trong state.rewards
    state.quests.forEach(q => {
      if (q.code) {
        const existR = state.rewards.find(r => r.code === q.code || (r.questName && q.name && r.questName.toLowerCase() === q.name.toLowerCase()));
        if (!existR) {
          state.rewards.unshift({
            id: q.id,
            questName: q.name,
            account: acc.username,
            type: q.reward || "Gift Code",
            code: q.code,
            discordUrl: `https://discord.com/quests/${q.id}`,
            expiry: "Còn hạn dùng"
          });
        } else {
          existR.code = q.code;
          if (q.id && !existR.id) existR.id = q.id;
        }
      }
    });

    addLog("success", `[Đồng bộ] Đã tải ${state.quests.length} Quest & ${acc.orbs.toLocaleString()} Orbs từ Discord.`);
    if (showToasts) toast(`Đã đồng bộ ${state.quests.length} quest từ Discord!`, "success");
  } catch (err) {
    addLog("error", `[Đồng bộ] Lỗi mạng: ${err.message}`);
    if (showToasts) toast("Lỗi kết nối khi đồng bộ Quest", "error");
  } finally {
    state.isSyncingQuests = false;
    saveState();
    renderAll();
  }
};
