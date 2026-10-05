# Chính Sách Bảo Mật (Security Policy)

## Phạm vi và Mục đích

Dự án này được xây dựng hoàn toàn với mục đích học tập, nghiên cứu về cơ chế quản lý phiên, giao thức Discord Gateway/HTTP API và tự động hóa tác vụ web mang tính chất phi thương mại. Mọi hành vi sử dụng công cụ này vào mục đích trái phép, can thiệp tài khoản không thuộc quyền sở hữu hoặc vi phạm Điều khoản dịch vụ của Discord đều bị nghiêm cấm.

## Xử lý Dữ liệu Người dùng

1. **Không lưu trữ Token trên server:** Các hàm Serverless và backend không lưu trữ bất kỳ Discord Token, thông tin tài khoản hay mật khẩu người dùng vào cơ sở dữ liệu nào. Dữ liệu chỉ được truyền tạm thời trong bộ nhớ RAM để giao tiếp trực tiếp với Discord API và được giải phóng tự động ngay sau khi request hoàn tất.
2. **Lưu trữ cục bộ an toàn:** Trên trình duyệt, danh sách tài khoản, cấu hình và trạng thái nhiệm vụ chỉ được lưu tạm thời trong `localStorage` của máy khách (client-side) nhằm duy trì trạng thái làm việc và sẽ bị xóa sạch hoàn toàn khi người dùng nhấn nút Đăng xuất hoặc Xóa dữ liệu.
3. **Kết nối mã hóa HTTPS:** Mọi luồng giao tiếp giữa trình duyệt, proxy serverless và Discord API đều được mã hóa toàn trình qua kết nối HTTPS / TLS tiêu chuẩn.
4. **Tiêu đề bảo mật:** Hệ thống cấu hình sẵn các tiêu đề bảo mật (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`) trên mạng lưới phân phối Vercel Edge Network.

## Báo cáo Lỗ hổng Bảo mật

Nếu bạn phát hiện bất kỳ vấn đề bảo mật tiềm ẩn nào liên quan đến mã nguồn của dự án này, vui lòng thực hiện theo các bước sau:

1. Tuyệt đối không công khai lỗ hổng qua hệ thống Issue công khai của GitHub.
2. Gửi thông tin chi tiết về lỗ hổng kèm các bước tái hiện tới kênh liên hệ cá nhân của tác giả:
   - Trang thông tin: https://huyvu2512.io.vn
   - Hồ sơ GitHub: https://github.com/huyvu2512
3. Tác giả sẽ tiếp nhận, đánh giá mức độ nghiêm trọng và phát hành bản cập nhật vá lỗi trong thời gian sớm nhất.
