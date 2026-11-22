import { fetchLatestBuildNumber, DISCORD_HEADERS } from '../discord-client.js';

const FLAG_BADGES = [
  { bit: 1 << 0, id: 'staff', name: 'Discord Staff', color: '#5865F2' },
  { bit: 1 << 1, id: 'partner', name: 'Partnered Server Owner', color: '#5865F2' },
  { bit: 1 << 2, id: 'hypesquad_events', name: 'HypeSquad Events', color: '#F0B232' },
  { bit: 1 << 3, id: 'bug_hunter_1', name: 'Bug Hunter Level 1', color: '#23A55A' },
  { bit: 1 << 6, id: 'bravery', name: 'HypeSquad Bravery', color: '#7B68EE', houseId: 1 },
  { bit: 1 << 7, id: 'brilliance', name: 'HypeSquad Brilliance', color: '#E8603C', houseId: 2 },
  { bit: 1 << 8, id: 'balance', name: 'HypeSquad Balance', color: '#3DD6AD', houseId: 3 },
  { bit: 1 << 9, id: 'early_supporter', name: 'Early Supporter', color: '#9B84EE' },
  { bit: 1 << 14, id: 'bug_hunter_2', name: 'Bug Hunter Level 2', color: '#F0B232' },
  { bit: 1 << 17, id: 'verified_dev', name: 'Early Verified Bot Developer', color: '#5865F2' },
  { bit: 1 << 18, id: 'mod_alumni', name: 'Moderator Programs Alumni', color: '#5865F2' },
  { bit: 1 << 22, id: 'active_developer', name: 'Active Developer', color: '#23A55A' }
];

function decodeHypeSquadHouse(flags) {
  if (flags & (1 << 6)) return 1; // Bravery
  if (flags & (1 << 7)) return 2; // Brilliance
  if (flags & (1 << 8)) return 3; // Balance
  return 0;
}

function decodeBadges(user) {
  const flags = Number(user.flags ?? user.public_flags ?? 0);
  const badges = FLAG_BADGES.filter(b => (flags & b.bit) !== 0).map(({ id, name, color, houseId }) => ({
    id,
    name,
    color,
    houseId: houseId || null
  }));
  if (user.premium_type && user.premium_type > 0) {
    const nitroNames = { 1: 'Nitro Classic', 2: 'Discord Nitro', 3: 'Nitro Basic' };
    badges.unshift({
      id: 'nitro',
      name: nitroNames[user.premium_type] || 'Discord Nitro',
      color: '#FF73FA',
      houseId: null
    });
  }
  return { flags, houseId: decodeHypeSquadHouse(flags), badges };
}

function parseBody(req) {
  let b = req.body;
  if (!b || typeof b === 'string') {
    try {
      b = typeof b === 'string' && b.trim() ? JSON.parse(b) : {};
    } catch {
      b = {};
    }
  }
  return b || {};
}

export default async function handler(req, res) {
  const body = parseBody(req);
  let token = req.query?.token || body.token || req.headers?.authorization || '';
  if (token.startsWith('Bearer ')) token = token.slice(7).trim();
  token = token.trim().replace(/^"|"$/g, '');

  if (!token) {
    return res.status(400).json({ success: false, error: 'Thiếu Discord User Token' });
  }

  try {
    const buildNum = await fetchLatestBuildNumber();
    const headers = DISCORD_HEADERS(token, buildNum);

    // GET: Lấy thông tin huy hiệu & HypeSquad hiện tại của tài khoản
    if (req.method === 'GET' || body.action === 'status') {
      const meRes = await fetch('https://discord.com/api/v9/users/@me', { headers });
      if (meRes.status === 401) {
        return res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn (401).' });
      }
      if (!meRes.ok) {
        return res.status(meRes.status).json({ success: false, error: `Discord API lỗi ${meRes.status}` });
      }
      const user = await meRes.json();
      const decoded = decodeBadges(user);
      const avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

      // Nạp song song danh mục huy hiệu chi tiết (/users/@me/badges) và huy hiệu hồ sơ (/users/{id}/profile)
      let profileBadges = [];
      let directoryBadges = [];
      try {
        const [dirRes, profRes] = await Promise.all([
          fetch('https://discord.com/api/v9/users/@me/badges', { headers }).catch(() => null),
          fetch(`https://discord.com/api/v9/users/${user.id}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`, { headers }).catch(() => null)
        ]);

        if (dirRes && dirRes.ok) {
          const dirData = await dirRes.json().catch(() => null);
          if (Array.isArray(dirData?.badges)) {
            directoryBadges = dirData.badges;
          }
        }

        if (profRes && profRes.ok) {
          const profData = await profRes.json().catch(() => null);
          if (Array.isArray(profData?.badges)) {
            profileBadges = profData.badges.map(b => ({
              id: b.id,
              name: b.description || b.id,
              description: b.description || '',
              iconUrl: b.simple_icon_url || (b.icon ? `https://cdn.discordapp.com/badge-icons/${b.icon}.png` : null),
              fullIconUrl: b.icon ? `https://cdn.discordapp.com/badge-icons/${b.icon}.png` : (b.simple_icon_url || null),
              link: b.link || null
            }));
          }
        }
      } catch {}

      let finalBadges = profileBadges;
      if (finalBadges.length === 0 && directoryBadges.length > 0) {
        finalBadges = directoryBadges
          .filter(b => b.owned && !b.hidden)
          .map(b => ({
            id: String(b.badge_id),
            badge_id: b.badge_id,
            name: b.name || String(b.badge_id),
            description: b.info_label || b.name || '',
            iconUrl: b.simple_icon_url || b.simple_icon_raster_url || null,
            fullIconUrl: b.simple_icon_url || b.simple_icon_raster_url || null,
            link: null
          }));
      }
      if (finalBadges.length === 0) {
        finalBadges = decoded.badges.map(b => ({ ...b, description: b.name, iconUrl: null, fullIconUrl: null }));
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.global_name || user.username,
          rawUsername: user.username,
          avatar,
          avatarDecoration: user.avatar_decoration_data?.asset
            ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128`
            : null,
          flags: decoded.flags,
          houseId: decoded.houseId,
          badges: finalBadges,
          directoryBadges
        }
      });
    }

    // DELETE hoặc action === 'leave': Rời HypeSquad House
    if (req.method === 'DELETE' || body.action === 'leave') {
      const delRes = await fetch('https://discord.com/api/v9/hypesquad/online', {
        method: 'DELETE',
        headers
      });
      if (delRes.status === 204 || delRes.ok) {
        return res.status(200).json({ success: true, houseId: 0, message: 'Đã rời khỏi HypeSquad House thành công!' });
      }
      if (delRes.status === 401) {
        return res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn (401).' });
      }
      if (delRes.status === 429) {
        const rl = await delRes.json().catch(() => ({}));
        return res.status(429).json({ success: false, error: `Bị giới hạn tốc độ (429). Vui lòng chờ ${Math.ceil(rl.retry_after || 5)}s.` });
      }
      const errData = await delRes.json().catch(() => ({}));
      return res.status(delRes.status).json({ success: false, error: errData.message || `Lỗi Discord API (${delRes.status})` });
    }

    // POST: Gia nhập / đổi HypeSquad House (1: Bravery, 2: Brilliance, 3: Balance)
    if (req.method === 'POST') {
      const houseId = Number(body.houseId || body.house_id);
      if (![1, 2, 3].includes(houseId)) {
        return res.status(400).json({ success: false, error: 'houseId không hợp lệ (chỉ nhận 1: Bravery, 2: Brilliance, 3: Balance).' });
      }

      const postRes = await fetch('https://discord.com/api/v9/hypesquad/online', {
        method: 'POST',
        headers,
        body: JSON.stringify({ house_id: houseId })
      });

      if (postRes.status === 204 || postRes.ok) {
        const names = { 1: 'Bravery (Quả Cảm)', 2: 'Brilliance (Lỗi Lạc)', 3: 'Balance (Cân Bằng)' };
        return res.status(200).json({
          success: true,
          houseId,
          message: `Đã nhận huy hiệu HypeSquad ${names[houseId]} thành công!`
        });
      }

      if (postRes.status === 401) {
        return res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn (401).' });
      }
      if (postRes.status === 429) {
        const rl = await postRes.json().catch(() => ({}));
        return res.status(429).json({ success: false, error: `Bạn thao tác quá nhanh (429). Chờ ${Math.ceil(rl.retry_after || 5)}s rồi thử lại.` });
      }
      const errData = await postRes.json().catch(() => ({}));
      return res.status(postRes.status).json({ success: false, error: errData.message || `Discord API lỗi ${postRes.status}` });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ success: false, error: 'Phương thức không được hỗ trợ' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Lỗi kết nối Discord API: ' + err.message });
  }
}
