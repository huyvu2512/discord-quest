/**
 * VIEW: MÃ QUÀ TẶNG & GIFT CODES (js/views/rewards.js)
 * Tự động lọc CHỈ NHỮNG NHIỆM VỤ CÓ MÃ GIFT CODE (Roblox, Apex, Star Wars, NBA 2K, Battlefield, v.v.)
 * Loại trừ tuyệt đối Orbs và Discord Avatar Decorations / Profile Effects.
 * Hiển thị cả nhiệm vụ chưa làm để người dùng bấm nút "Chạy" trực tiếp.
 */

function isGiftCodeQuest(q) {
  if (!q) return false;
  // 0. Nếu là nhiệm vụ đã claimed / hoàn thành trong quá khứ nhưng không có chuỗi mã code (code = null),
  // nghĩa là mã đã hết hạn sử dụng hoặc đợt phát code đã kết thúc từ lâu -> Không khả dụng, bỏ qua!
  if (q.status === 'claimed' && (!q.code || typeof q.code !== 'string' || !q.code.trim())) {
    return false;
  }
  if (q.code) return true; // Đã nhận chuỗi mã quà
  if (q.hasGiftCode === true) return true;

  const lowerRew = (q.reward || q.type || "").toLowerCase();

  // 1. Loại trừ tuyệt đối Orbs (cộng trực tiếp vào ví Discord, không có mã)
  if (lowerRew.includes('orb')) return false;

  // 2. Loại trừ tuyệt đối Discord Avatar / Profile Effects / Badges (nhận thẳng vào avatar Discord)
  if (/avatar|decoration|profile effect|collectible|badge|khung đại diện/i.test(lowerRew)) {
    return false;
  }

  // 3. Nhận diện các nhiệm vụ game bên thứ 3 có mã quà tặng / Gift Code
  if (/code|gift|pack|bundle|tracker|wings|skin|item|boost|dlc|key|set|trang phục|vật phẩm/i.test(lowerRew)) {
    return true;
  }

  return false;
}

function getRedeemUrl(quest) {
  return quest.discordUrl || (quest.id ? `https://discord.com/quests/${quest.id}` : 'https://discord.com/quest-home');
}

function normalizeQuestKey(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getRewardItems() {
  const currentAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  const accName = currentAcc?.username ? `@${currentAcc.username}` : "Tài khoản";

  const items = [];

  function findItemIndex(candidate) {
    return items.findIndex(existing => {
      // 1. Trùng Quest ID
      if (candidate.id && existing.id && candidate.id === existing.id) return true;
      // 2. Trùng chuỗi mã Gift Code
      if (candidate.code && existing.code && candidate.code.trim().toUpperCase() === existing.code.trim().toUpperCase()) return true;
      // 3. Trùng tên chuẩn hóa (ví dụ: Apex VS Street Fighter 6 Event <-> Apex, ROBLOX <-> roblox)
      const nameA = normalizeQuestKey(existing.questName);
      const nameB = normalizeQuestKey(candidate.questName || candidate.name);
      if (nameA && nameB) {
        if (nameA === nameB) return true;
        if (nameA.length >= 5 && nameB.length >= 5 && (nameA.includes(nameB) || nameB.includes(nameA))) return true;
      }
      return false;
    });
  }

  // 1. Quét từ state.quests:
  // Lấy các nhiệm vụ có mã quà (Gift Code) hợp lệ:
  // - Nhiệm vụ đã nhận (claimed): Bắt buộc phải có mã code thật (q.code)
  // - Nhiệm vụ chưa làm (pending/queued/running): Phải còn hạn sử dụng
  (state.quests || []).forEach(q => {
    if (!isGiftCodeQuest(q)) return;

    const isDone = q.status === "completed" || q.status === "claimed";

    // 1. Bỏ qua nhiệm vụ đã claimed nhưng không có mã code (mã hết hạn hoặc đợt phát code đã đóng)
    if (q.status === "claimed" && (!q.code || typeof q.code !== 'string' || !q.code.trim())) {
      return;
    }

    // 2. Bỏ qua nhiệm vụ chưa làm nhưng đã hết hạn sử dụng
    if (!isDone) {
      if (q.isExpired || (q.expiresAt && new Date(q.expiresAt).getTime() <= Date.now())) {
        return;
      }
    }

    const redeemLink = getRedeemUrl(q);
    const targetSec = q.targetSec || 900;
    const progSec = isDone ? targetSec : (q.progSec || 0);
    const pct = isDone ? 100 : Math.min(99, Math.floor((progSec / targetSec) * 100));

    const newItem = {
      id: q.id,
      questName: q.name,
      account: accName,
      type: q.reward || "Gift Code",
      code: q.code || null,
      status: q.status || "pending",
      progSec: progSec,
      targetSec: targetSec,
      pct: pct,
      discordUrl: q.discordUrl || (q.id ? `https://discord.com/quests/${q.id}` : 'https://discord.com/quest-home'),
      redeemLink: redeemLink,
      expiry: "Còn hạn dùng"
    };

    const existingIdx = findItemIndex(newItem);
    if (existingIdx !== -1) {
      const existing = items[existingIdx];
      if (newItem.code && !existing.code) existing.code = newItem.code;
      if (!existing.id && newItem.id) existing.id = newItem.id;
      if (existing.type === "Gift Code" && newItem.type !== "Gift Code") existing.type = newItem.type;
      const statusScore = s => (s === 'running' ? 5 : s === 'claimed' ? 4 : s === 'completed' ? 3 : s === 'queued' ? 2 : 1);
      if (statusScore(newItem.status) > statusScore(existing.status)) existing.status = newItem.status;
    } else {
      items.push(newItem);
    }
  });

  // 2. Gộp thêm từ state.rewards (chỉ bổ sung nếu có chuỗi mã code thật và chưa có trong state.quests):
  (state.rewards || []).forEach(r => {
    if (!r.code || typeof r.code !== 'string' || !r.code.trim()) return;
    if (isGiftCodeQuest(r)) {
      const candidate = {
        id: r.id,
        questName: r.questName || r.name,
        code: r.code || null
      };

      const existingIdx = findItemIndex(candidate);
      if (existingIdx !== -1) {
        // Đã có từ quests -> đồng bộ mã code vào quest đó nếu quest chưa có mã
        const existing = items[existingIdx];
        if (r.code && !existing.code) {
          existing.code = r.code;
          const targetQ = (state.quests || []).find(q => q.id === existing.id);
          if (targetQ && !targetQ.code) targetQ.code = r.code;
        }
      } else {
        const matchQuest = (state.quests || []).find(q => (q.id && r.id && q.id === r.id) || (q.name && r.questName && normalizeQuestKey(q.name) === normalizeQuestKey(r.questName)));
        const qId = r.id || matchQuest?.id;
        const discordUrl = qId ? `https://discord.com/quests/${qId}` : (r.link && r.link.includes('discord.com/quests') ? r.link : 'https://discord.com/quest-home');

        items.push({
          id: qId,
          questName: r.questName,
          account: r.account || accName,
          type: r.type || "Gift Code",
          code: r.code || null,
          status: "claimed",
          pct: 100,
          discordUrl: discordUrl,
          redeemLink: r.link || "https://discord.com/quest-home",
          expiry: r.expiry || "Còn hạn dùng"
        });
      }
    }
  });

  // Sắp xếp: Đang chạy -> Trong hàng đợi -> Chưa chạy -> Hoàn thành (chờ nhận) -> Đã nhận mã
  const order = { running: 1, queued: 2, pending: 3, completed: 4, claimed: 5 };
  return items.sort((a, b) => {
    return (order[a.status] || 99) - (order[b.status] || 99);
  });
}

window.getRewardItems = getRewardItems;
window.isGiftCodeQuest = isGiftCodeQuest;

function renderRewards() {
  const tbody = document.getElementById("rewards-tbody");
  if (!tbody) return;

  const items = getRewardItems();

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-title">Chưa có nhiệm vụ có mã quà</div>
            <div class="empty-desc">Khi tài khoản có nhiệm vụ tặng Gift Code (Roblox, Apex, Star Wars, NBA...), nhiệm vụ sẽ xuất hiện tại đây để bạn bấm Chạy và lấy mã đổi thưởng.</div>
            <button class="btn btn-primary btn-sm" onclick="syncQuestsFromDiscord(true)">Quét Nhiệm Vụ Ngay</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(r => {
    let codeCol = '';
    let statusCol = '';

    if (r.status === 'running') {
      statusCol = `<span class="tag tag-running">● Đang chạy</span>`;
      codeCol = `
        <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
          <span style="color: var(--yellow); font-size: 12px; font-weight: 500;">Đang cày (${r.pct}%)</span>
          <button class="btn btn-secondary btn-sm" onclick="pauseQuest('${r.id}')">Dừng</button>
        </div>
      `;
    } else if (r.status === 'queued') {
      statusCol = `<span class="tag tag-pending">Trong hàng đợi</span>`;
      codeCol = `
        <button class="btn btn-secondary btn-run btn-sm" onclick="startQuest('${r.id}')">Chạy (${r.pct}%)</button>
      `;
    } else if (r.status === 'pending') {
      statusCol = `<span class="tag tag-pending">Chưa làm</span>`;
      codeCol = `
        <button class="btn btn-primary btn-sm" onclick="startQuest('${r.id}')">Chạy</button>
      `;
    } else if (r.status === 'completed') {
      statusCol = `<span class="tag tag-completed">Chờ lấy mã</span>`;
      const qId = r.id || ((state.quests || []).find(q => q.name && r.questName && normalizeQuestKey(q.name) === normalizeQuestKey(r.questName))?.id);
      const discordQuestUrl = qId ? `https://discord.com/quests/${qId}` : (r.discordUrl || 'https://discord.com/quest-home');
      codeCol = `
        <a href="${discordQuestUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px; font-size: 12px; border-radius: 6px;" title="Mở nhiệm vụ trên Discord">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          <span>Lấy Mã trên Discord</span>
        </a>
      `;
    } else {
      // claimed
      statusCol = `<span class="tag tag-claimed">Đã nhận mã</span>`;
      const qId = r.id || ((state.quests || []).find(q => q.name && r.questName && normalizeQuestKey(q.name) === normalizeQuestKey(r.questName))?.id);
      const discordQuestUrl = qId ? `https://discord.com/quests/${qId}` : (r.discordUrl || 'https://discord.com/quest-home');
      const linkTitle = 'Mở nhiệm vụ trên Discord';

      if (r.code) {
        codeCol = `
          <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
            <div class="discord-code-widget" title="Mã quà: ${escapeHtml(r.code)}">
              <span class="discord-code-text" title="${escapeHtml(r.code)}">${escapeHtml(r.code)}</span>
              <button class="discord-code-copy-btn" onclick="copyRewardCode(this, '${escapeHtml(r.code)}', event)">Sao chép</button>
            </div>
            <a href="${discordQuestUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; justify-content: center; height: 36px; width: 36px; padding: 0; border-radius: 6px; flex-shrink: 0;" title="${linkTitle}">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            </a>
          </div>
        `;
      } else {
        codeCol = `
          <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
            <a href="${discordQuestUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 5px; height: 36px; padding: 0 12px; font-size: 12px; border-radius: 6px;" title="${linkTitle}">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
              <span>Xem trên Discord</span>
            </a>
          </div>
        `;
      }
    }

    return `
      <tr>
        <td style="font-weight: 600; color: #fff;">
          <div class="quest-name-cell" title="${escapeHtml(r.questName)}">${escapeHtml(r.questName)}</div>
        </td>
        <td class="col-hide-mobile" style="color: var(--text-sub);">${escapeHtml(r.account)}</td>
        <td class="col-hide-mobile">
          <span class="tag tag-completed" style="color: #fff; background: rgba(88, 101, 242, 0.15); border-color: rgba(88, 101, 242, 0.3);">${escapeHtml(r.type)}</span>
        </td>
        <td class="col-hide-mobile">${statusCol}</td>
        <td style="text-align: right; white-space: nowrap;">${codeCol}</td>
      </tr>
    `;
  }).join("");
}

window.copyRewardCode = function(btn, text, evt) {
  if (evt) evt.stopPropagation();
  navigator.clipboard.writeText(text);
  toast(`Đã sao chép mã: ${text}`, "success");
  if (btn) {
    const origText = btn.textContent;
    btn.textContent = "Đã chép";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = origText;
      btn.classList.remove("copied");
    }, 1500);
  }
};

window.copyCode = function(text) {
  navigator.clipboard.writeText(text);
  toast(`Đã sao chép mã: ${text}`, "success");
};

window.fetchRewardCode = async function(questId) {
  const currentAcc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (!currentAcc || !currentAcc.token) {
    toast("Không tìm thấy Discord Token", "error");
    return;
  }

  const btn = document.getElementById(`btn-fetch-code-${questId}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></span> Đang lấy...`;
  }

  try {
    const res = await fetch(`/api/quests/reward-code?questId=${questId}&token=${encodeURIComponent(currentAcc.token)}`);
    const data = await res.json();

    if (data.success && data.code) {
      // Cập nhật vào state.quests
      const targetQuest = (state.quests || []).find(q => q.id === questId);
      if (targetQuest) {
        targetQuest.code = data.code;
        targetQuest.status = 'claimed';
      }

      // Cập nhật hoặc lưu vào state.rewards
      if (!Array.isArray(state.rewards)) state.rewards = [];
      const existingRew = state.rewards.find(r => r.id === questId);
      if (existingRew) {
        existingRew.code = data.code;
      } else if (targetQuest) {
        state.rewards.push({
          id: targetQuest.id,
          questName: targetQuest.name,
          account: currentAcc.username ? `@${currentAcc.username}` : "Tài khoản",
          type: targetQuest.reward || "Gift Code",
          code: data.code,
          claimedAt: data.claimedAt || new Date().toISOString()
        });
      }

      if (typeof saveState === 'function') saveState();
      toast(`Lấy mã thành công: ${data.code}`, "success");
      if (typeof addLog === 'function') {
        addLog("success", `[Mã quà] Đã lấy mã cho quest "${targetQuest?.name || questId}": ${data.code}`);
      }
      renderRewards();
    } else {
      toast(data.error || "Chưa có mã quà hoặc quest chưa hoàn tất", "warn");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Lấy Mã Thất Bại</span>`;
      }
    }
  } catch (err) {
    toast(`Lỗi kết nối: ${err.message}`, "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Thử lại</span>`;
    }
  }
};
