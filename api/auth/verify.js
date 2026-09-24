export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Phương thức không được hỗ trợ' });
  }

  // Đọc body nếu là stream
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = typeof body === 'string' ? JSON.parse(body) : {};
    } catch {
      body = {};
    }
  }

  const token = (body.token || '').trim();
  if (!token) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp Discord Token' });
  }

  try {
    const discordRes = await fetch('https://discord.com/api/v9/users/@me', {
      headers: {
        'Authorization': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
      }
    });

    if (discordRes.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Token không hợp lệ hoặc đã bị Discord thu hồi/hết hạn.'
      });
    }

    if (!discordRes.ok) {
      return res.status(discordRes.status).json({
        success: false,
        error: `Discord API phản hồi mã lỗi: ${discordRes.status}`
      });
    }

    const data = await discordRes.json();
    const tag = data.discriminator === '0' ? `@${data.username}` : `#${data.discriminator}`;
    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${(BigInt(data.id) >> 22n) % 6n}.png`;

    return res.status(200).json({
      success: true,
      message: 'Xác thực tài khoản thành công',
      user: {
        id: data.id,
        username: data.global_name || data.username,
        rawUsername: data.username,
        tag: tag,
        avatar: avatarUrl,
        email: data.email || null,
        phone: data.phone || null,
        premiumType: data.premium_type || 0
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Lỗi kết nối máy chủ Discord: ' + err.message
    });
  }
}
