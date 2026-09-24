export default async function handler(req, res) {
  // Trên Vercel: Vercel tự động gắn IP của người dùng qua các header này
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'];

  // Nếu chạy môi trường test cục bộ, backend server lấy IP giúp client
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      const data = await resp.json();
      ip = data.ip;
    } catch {
      ip = ip || '127.0.0.1';
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ip });
}
