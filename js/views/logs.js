/**
 * VIEW: NHẬT KÝ REQUEST CONSOLE (js/views/logs.js)
 */

function renderLogs() {
  const el = document.getElementById("terminal-content");
  if (!el) return;

  const lvl = document.getElementById("select-log-level")?.value || "all";
  const filtered = lvl === "all" ? state.logs : state.logs.filter(l => l.level === lvl);

  if (filtered.length === 0) {
    el.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-family: var(--font-sans);">
        Không có dòng nhật ký nào phù hợp với bộ lọc [${lvl.toUpperCase()}].
      </div>
    `;
    return;
  }

  el.innerHTML = filtered.map(l => `
    <div class="log-entry">
      <span class="log-time">[${l.time}]</span>
      <span class="log-lvl-${l.level}">[${l.level.toUpperCase()}]</span>
      <span class="log-msg">${escapeHtml(l.text)}</span>
    </div>
  `).join("");

  el.scrollTop = el.scrollHeight;
}

/**
 * Khởi tạo dropdown filter tùy biến và nút Tải log
 */
function initLogControls() {
  const selectBox = document.getElementById("log-filter-select");
  const triggerBtn = document.getElementById("log-filter-btn");
  const menu = document.getElementById("log-filter-menu");
  const hiddenInput = document.getElementById("select-log-level");
  const downloadBtn = document.getElementById("btn-download-logs");

  if (triggerBtn && selectBox) {
    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectBox.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!selectBox.contains(e.target)) {
        selectBox.classList.remove("open");
      }
    });

    menu?.querySelectorAll(".custom-select-option").forEach(opt => {
      opt.addEventListener("click", () => {
        const val = opt.getAttribute("data-value");
        const dotClass = opt.querySelector(".log-dot")?.className || "log-dot all";
        const labelText = opt.querySelector("span:last-child")?.textContent || "Tất cả log";

        if (hiddenInput) hiddenInput.value = val;

        const valSpan = triggerBtn.querySelector(".custom-select-val");
        if (valSpan) {
          valSpan.innerHTML = `<span class="${dotClass}"></span><span class="custom-select-text">${escapeHtml(labelText)}</span>`;
        }

        menu.querySelectorAll(".custom-select-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");

        selectBox.classList.remove("open");
        renderLogs();
      });
    });
  }

  // Tải nhật ký về máy
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      downloadLogs();
    });
  }
}

/**
 * Xuất file log dạng text .txt
 */
function downloadLogs() {
  if (!state.logs || state.logs.length === 0) {
    toast("Không có nhật ký nào để tải về!", "warn");
    return;
  }

  const lvl = document.getElementById("select-log-level")?.value || "all";
  const logsToExport = lvl === "all" ? state.logs : state.logs.filter(l => l.level === lvl);

  if (logsToExport.length === 0) {
    toast(`Không có dòng log nào thuộc bộ lọc [${lvl.toUpperCase()}]!`, "warn");
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleString("vi-VN");
  const dateStr = now.toISOString().slice(0, 10);

  const lines = [
    `=============================================================`,
    `DISCORD QUEST TOOL - NHẬT KÝ REQUEST CONSOLE`,
    `Thời gian xuất: ${timeStr}`,
    `Bộ lọc cấp độ: ${lvl.toUpperCase()}`,
    `Tổng số sự kiện: ${logsToExport.length}`,
    `=============================================================\r\n`
  ];

  logsToExport.forEach(l => {
    lines.push(`[${l.time}] [${l.level.toUpperCase()}] ${l.text}`);
  });

  const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `discord-quest-logs-${dateStr}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast(`Đã tải về file nhật ký (${logsToExport.length} dòng)!`, "success");
}
