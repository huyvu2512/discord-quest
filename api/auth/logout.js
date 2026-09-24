export default function handler(req, res) {
  // Đăng xuất và dọn sạch phiên
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    message: 'Đăng xuất tài khoản thành công.'
  });
}
