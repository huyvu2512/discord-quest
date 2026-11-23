/**
 * BADGES PROFILE & HYPESQUAD ACTIONS (js/views/badges/profile.js)
 * Quản lý & nhận huy hiệu HypeSquad (Bravery, Brilliance, Balance) và tải dữ liệu huy hiệu tài khoản
 */

const HYPESQUAD_HOUSES = [
  {
    id: 1,
    key: 'bravery',
    name: 'Bravery',
    viName: 'Quả Cảm',
    desc: 'Dũng cảm, quyết đoán và không bao giờ chùn bước trước thử thách.',
    icon: '/badges/bravery.png'
  },
  {
    id: 2,
    key: 'brilliance',
    name: 'Brilliance',
    viName: 'Lỗi Lạc',
    desc: 'Sáng tạo, đầy ý tưởng đột phá và tham vọng bền bỉ.',
    icon: '/badges/brilliance.png'
  },
  {
    id: 3,
    key: 'balance',
    name: 'Balance',
    viName: 'Cân Bằng',
    desc: 'Điềm tĩnh, hòa hợp và luôn duy trì trật tự trong mọi tình huống.',
    icon: '/badges/balance.png'
  }
];

let badgeProfileState = {
  loading: false,
  submitting: false,
  selectedHouseId: 2,
  currentHouseId: 0,
  user: null,
  lastCheckedToken: null,
  customToken: '',
  modalOpen: false,
  selectedModalBadgeId: null
};

function getBadgeActiveToken() {
  const custom = (badgeProfileState.customToken || '').trim().replace(/^"|"$/g, '');
  if (custom) return custom;
  const acc = state.accounts.find(a => a.id === state.activeAccId) || state.accounts[0];
  return acc?.token || '';
}

window.loadBadgeProfile = async function(force = false) {
  const token = getBadgeActiveToken();
  if (!token) {
    badgeProfileState.user = null;
    badgeProfileState.currentHouseId = 0;
    renderBadges();
    return;
  }

  if (!force && badgeProfileState.lastCheckedToken === token) {
    return;
  }

  badgeProfileState.lastCheckedToken = token;
  badgeProfileState.selectedModalBadgeId = null;
  badgeProfileState.loading = true;
  renderBadges();

  try {
    const res = await fetch(`/api/badges/hypesquad?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      badgeProfileState.user = data.user;
      badgeProfileState.currentHouseId = data.user.houseId || 0;
      if (data.user.houseId) {
        badgeProfileState.selectedHouseId = data.user.houseId;
      }
    } else {
      badgeProfileState.user = null;
      badgeProfileState.currentHouseId = 0;
      if (force || state.activeTab === 'badges') {
        toast(data.error || 'Không thể kiểm tra huy hiệu tài khoản', 'error');
      }
    }
  } catch (err) {
    if (force || state.activeTab === 'badges') {
      toast(`Lỗi kết nối: ${err.message}`, 'error');
    }
  } finally {
    badgeProfileState.loading = false;
    if (typeof renderCounters === 'function') renderCounters();
    renderBadges();
    if (state.activeTab === 'playtime' || state.activeTab === 'games') {
      if (typeof renderPlaytime === 'function') renderPlaytime();
      else if (typeof renderBadgeRunner === 'function') renderBadgeRunner();
    }
    if (badgeProfileState.modalOpen) {
      renderBadgesModal();
    }
  }
};

window.selectHypeSquadHouse = function(houseId) {
  badgeProfileState.selectedHouseId = houseId;
  renderBadges();
};

window.onBadgeCustomTokenInput = function(val) {
  badgeProfileState.customToken = val;
};

window.claimHypeSquadBadge = async function() {
  const token = getBadgeActiveToken();
  if (!token) {
    toast('Vui lòng kết nối tài khoản hoặc nhập Token trước!', 'warn');
    return;
  }

  const houseId = badgeProfileState.selectedHouseId;
  if (![1, 2, 3].includes(houseId)) {
    toast('Vui lòng chọn 1 ngôi nhà HypeSquad', 'warn');
    return;
  }

  badgeProfileState.submitting = true;
  renderBadges();

  try {
    const res = await fetch('/api/badges/hypesquad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, houseId })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      badgeProfileState.currentHouseId = houseId;
      toast(data.message || 'Lấy huy hiệu HypeSquad thành công!', 'success');
      if (typeof addLog === 'function') {
        addLog('success', `[Huy hiệu] ${data.message}`);
      }
      setTimeout(() => window.loadBadgeProfile(true), 600);
    } else {
      toast(data.error || 'Không thể lấy huy hiệu HypeSquad', 'error');
      if (typeof addLog === 'function') {
        addLog('error', `[Huy hiệu] Lỗi: ${data.error}`);
      }
    }
  } catch (err) {
    toast(`Lỗi kết nối: ${err.message}`, 'error');
  } finally {
    badgeProfileState.submitting = false;
    renderBadges();
  }
};

window.leaveHypeSquadBadge = async function() {
  const token = getBadgeActiveToken();
  if (!token) return;

  badgeProfileState.submitting = true;
  renderBadges();

  try {
    const res = await fetch('/api/badges/hypesquad', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'leave' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      badgeProfileState.currentHouseId = 0;
      toast(data.message || 'Đã rời khỏi HypeSquad!', 'info');
      if (typeof addLog === 'function') addLog('info', '[Huy hiệu] Đã rời khỏi HypeSquad House.');
      setTimeout(() => window.loadBadgeProfile(true), 600);
    } else {
      toast(data.error || 'Không thể rời HypeSquad', 'error');
    }
  } catch (err) {
    toast(`Lỗi kết nối: ${err.message}`, 'error');
  } finally {
    badgeProfileState.submitting = false;
    renderBadges();
  }
};
