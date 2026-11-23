/**
 * CONTROLLER: XÁC THỰC & KIỂM TRA PHIÊN TOKEN DISCORD (js/controllers/token.js)
 */

function bindTokenChecking() {
  const btnSubmit = document.getElementById("btn-confirm-add-account");
  const tokenInput = document.getElementById("input-account-token");

  btnSubmit?.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      toast("Chưa nhập Token!", "warn");
      tokenInput.focus();
      return;
    }

    btnSubmit.classList.add("loading");
    btnSubmit.innerHTML = `<span class="spinner"></span> Đang xác thực với Discord...`;

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        btnSubmit.classList.remove("loading");
        btnSubmit.innerHTML = `Kiểm Tra`;
        toast(data.error || "Token không hợp lệ hoặc đã hết hạn!", "error");
        return;
      }

      const u = data.user;
      const existing = state.accounts.find(a => a.id === u.id);
      if (existing) {
        existing.token = token;
        existing.username = u.username;
        existing.tag = u.tag;
        existing.avatar = u.avatar;
        state.activeAccId = existing.id;
        toast(`Đã cập nhật Token: @${u.username}`, "success");
        addLog("success", `Đã cập nhật Token cho @${u.username}.`);
      } else {
        const newAccount = {
          id: u.id,
          username: u.username,
          tag: u.tag,
          avatar: u.avatar,
          orbs: 0,
          status: "active",
          ipType: "Mạng nhà",
          token: token,
          completedCount: 0
        };
        state.accounts.push(newAccount);
        state.activeAccId = newAccount.id;
        toast(`Xác thực thành công: @${u.username}`, "success");
        addLog("success", `Xác thực thành công tài khoản @${u.username} (${u.tag}).`);
      }

      saveState();

      btnSubmit.classList.remove("loading");
      btnSubmit.innerHTML = `Kiểm Tra`;
      tokenInput.value = "";
      document.getElementById("modal-add-account")?.classList.remove("open");

      updateNavGating();
      
      // Hiệu ứng skeleton loading khi cập nhật danh sách
      showTableSkeleton("accounts-tbody", 2, 6);
      setTimeout(async () => {
        renderAll();
        if (typeof window.switchTabTo === "function") {
          window.switchTabTo("quests");
        }
        await window.syncQuestsFromDiscord(true);
      }, 300);
    } catch (err) {
      btnSubmit.classList.remove("loading");
      btnSubmit.innerHTML = `Kiểm Tra`;
      toast("Lỗi kết nối API xác thực: " + err.message, "error");
    }
  });
}

// Tự động kiểm tra và làm mới phiên token khi người dùng tải lại web
async function checkSessionOnStartup() {
  if (state.accounts.length === 0) return;

  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  if (!acc || !acc.token) return;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: acc.token })
    });

    const data = await res.json();

    if (data.expired || res.status === 401) {
      addLog("warn", `[HỆ THỐNG] Phiên của @${acc.username} đã hết hạn. Đã tự động đăng xuất.`);
      toast(`Phiên của @${acc.username} đã hết hạn.`, "warn");
      
      // Tự động xóa tài khoản hết hạn khỏi bộ nhớ
      state.accounts = state.accounts.filter(a => a.id !== acc.id);
      state.activeAccId = state.accounts.length > 0 ? state.accounts[0].id : null;
      saveState();
      updateNavGating();
      renderAll();
      if (typeof window.switchTabTo === 'function') {
        window.switchTabTo("accounts");
      }
      return;
    }

    if (data.success && data.valid && data.user) {
      // Cập nhật thông tin mới nhất từ Discord nếu có thay đổi
      acc.username = data.user.username;
      acc.tag = data.user.tag;
      acc.avatar = data.user.avatar;
      saveState();
      renderSidebarUser();
      addLog("info", `[HỆ THỐNG] Tự động xác thực phiên: @${acc.username}`);
    }
  } catch (err) {
    console.warn("Lỗi kiểm tra phiên:", err);
  }
}

function resetTokenCheckForm() {
  const tokenInput = document.getElementById("input-account-token");
  if (tokenInput) tokenInput.value = "";
  const btn = document.getElementById("btn-confirm-add-account");
  if (btn) {
    btn.classList.remove("loading");
    btn.innerHTML = `Kiểm Tra`;
  }
}
