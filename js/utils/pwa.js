/**
 * PWA INSTALLATION & NATIVE WEB SHARE (js/utils/pwa.js)
 */

let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
});

window.installPWA = async function() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    const { outcome } = await deferredPwaPrompt.userChoice;
    if (outcome === 'accepted') {
      toast('Đang cài đặt Discord Quest vào màn hình chính...', 'success');
      addLog('success', 'Đã thêm ứng dụng vào màn hình chính thành công!');
    }
    deferredPwaPrompt = null;
  } else {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      toast('Trên iPhone/iPad: Bấm nút Chia sẻ (mũi tên trỏ lên) ở thanh dưới Safari ➔ Chọn "Thêm vào MH chính"', 'info');
    } else {
      toast('Bấm Menu 3 chấm (⋮) trên trình duyệt ➔ Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính"', 'info');
    }
  }
};

window.shareApp = async function() {
  const shareData = {
    title: 'Discord Quest',
    text: 'Tự động hóa tiến trình nhiệm vụ, đồng bộ Orbs và quản lý phần thưởng Discord.',
    url: window.location.origin
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      toast('Đã mở bảng chia sẻ thành công!', 'success');
      return;
    } catch (err) {
      if (err.name !== 'AbortError') console.warn(err);
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    toast('Đã sao chép liên kết web vào bộ nhớ tạm!', 'success');
  } catch {
    toast(`Liên kết: ${shareData.url}`, 'info');
  }
};

// Đăng ký Service Worker cho PWA
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
