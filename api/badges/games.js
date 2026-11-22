let cachedGames = null;
let cachedAt = 0;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function extractWinExe(game) {
  const execs = Array.isArray(game?.executables) ? game.executables : [];
  const win = execs.find(e => e?.os === 'win32' && e?.name);
  if (win) return win.name;
  const any = execs.find(e => e?.name);
  return any?.name || 'game.exe';
}

export async function getDetectableGames() {
  if (cachedGames && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedGames;
  }

  const res = await fetch('https://cdn.discordapp.com/detectables/games.json', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  if (!res.ok) {
    throw new Error(`Không thể tải danh sách game từ Discord CDN (HTTP ${res.status})`);
  }

  const rawList = await res.json();
  const seen = new Set();
  const parsed = [];

  for (const g of rawList) {
    const id = g?.id ? String(g.id) : '';
    const name = g?.name ? String(g.name).trim() : '';
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    parsed.push({
      id,
      name,
      exe: extractWinExe(g)
    });
  }

  cachedGames = parsed;
  cachedAt = Date.now();
  return parsed;
}

export default async function handler(req, res) {
  try {
    const allGames = await getDetectableGames();
    const q = String(req.query?.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query?.offset, 10) || 0, 0);
    const random = req.query?.random === 'true';

    let list = allGames;
    if (q) {
      list = allGames.filter(g => g.name.toLowerCase().includes(q) || g.id.includes(q));
    }

    if (random && !q) {
      // Lấy ngẫu nhiên `limit` game không trùng lặp
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return res.status(200).json({
        success: true,
        total: allGames.length,
        matched: list.length,
        games: copy.slice(0, limit)
      });
    }

    return res.status(200).json({
      success: true,
      total: allGames.length,
      matched: list.length,
      games: list.slice(offset, offset + limit)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi tải danh sách game Discord'
    });
  }
}
