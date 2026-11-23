/**
 * TIỆN ÍCH HIỂN THỊ & ĐỊNH DẠNG (js/utils/skeleton.js)
 */

// Hiệu ứng Skeleton Loading cho Table (tự động khớp với thead trên mobile & desktop)
function showTableSkeleton(tbodyId, rows = 3, cols = 6) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  const ths = table ? Array.from(table.querySelectorAll('thead th')) : [];
  const colCount = ths.length || cols;

  tbody.innerHTML = Array(rows).fill(0).map(() => `
    <tr>
      ${Array(colCount).fill(0).map((_, i) => {
        const th = ths[i];
        const isHideMobile = th ? th.classList.contains('col-hide-mobile') : false;
        const hideClass = isHideMobile ? 'col-hide-mobile' : '';
        const isRight = th && (th.style.textAlign === 'right' || th.getAttribute('style')?.includes('text-align: right'));
        const alignStyle = isRight ? 'style="text-align: right;"' : '';
        const skelType = i === 0 ? 'skeleton-text' : (i === colCount - 1 ? 'skeleton-btn' : 'skeleton-tag');
        return `
          <td class="${hideClass}" ${alignStyle}>
            <div class="skeleton ${skelType}"></div>
            ${i === 0 ? '<div class="skeleton skeleton-subtext"></div>' : ''}
          </td>
        `;
      }).join('')}
    </tr>
  `).join('');
}

// Định dạng ngày hết hạn ngắn gọn: .../... (DD/MM)
function formatExpiryShort(expiresAt) {
  if (!expiresAt) return "--/--";
  try {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) return "--/--";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return "--/--";
  }
}

// Định dạng đầy đủ ngày tháng năm khi hover chuột
function formatExpiryFull(expiresAt) {
  if (!expiresAt) return "Không có hạn";
  try {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) return "Không rõ hạn";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return expiresAt;
  }
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
