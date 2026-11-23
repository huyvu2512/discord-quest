/**
 * KIỂM TRA ĐỊA CHỈ IP CÔNG KHAI (js/utils/ip.js)
 */

function initIPFetcher() {
  const badge = document.getElementById("header-ip-badge");
  if (badge) {
    badge.addEventListener("click", () => {
      fetchPublicIP(true);
    });
  }
  fetchPublicIP(false);
}

let isFetchingIP = false;

async function fetchPublicIP(isManual = false) {
  if (isFetchingIP) return;
  isFetchingIP = true;

  const ipText = document.getElementById("header-ip-text");
  const ipDot = document.getElementById("header-ip-dot");
  const badge = document.getElementById("header-ip-badge");

  if (!ipText || !ipDot) {
    isFetchingIP = false;
    return;
  }

  // Trạng thái Loading: Dot nhấp nháy vàng + Skeleton shimmer
  ipDot.className = "dot-online loading-dot";
  ipText.innerHTML = `<span class="skeleton" style="width: 100px; height: 13px; display: inline-block;"></span>`;
  if (badge) badge.title = "Đang kiểm tra IP mạng...";

  // Đảm bảo hiệu ứng skeleton hiển thị mượt mà tối thiểu 350ms
  const minLoadTime = new Promise(resolve => setTimeout(resolve, 350));

  let detectedIP = null;
  try {
    const res = await fetch("/api/ip");
    if (res.ok) {
      const data = await res.json();
      detectedIP = data.ip;
    }
  } catch (err) {
    console.error("Lỗi lấy IP:", err);
  }

  await minLoadTime;

  if (detectedIP) {
    ipDot.className = "dot-online";
    ipText.textContent = detectedIP;
    if (badge) badge.title = `IP Mạng: ${detectedIP} (Bấm để kiểm tra lại)`;
    if (isManual) toast(`Đã cập nhật IP: ${detectedIP}`, "success");
    addLog("info", `Kết nối với IP: ${detectedIP}`);
  } else {
    ipDot.className = "dot-online error-dot";
    ipText.textContent = "Không lấy được IP";
    if (badge) badge.title = "Lỗi kết nối. Bấm để thử lại.";
    if (isManual) toast("Không thể lấy IP mạng", "error");
    addLog("error", "Không thể lấy IP mạng");
  }

  isFetchingIP = false;
}
