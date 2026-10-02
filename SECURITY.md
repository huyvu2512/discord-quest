# Chính sách bảo mật

## Báo cáo lỗ hổng bảo mật

Nếu bạn phát hiện lỗ hổng bảo mật trong dự án **Discord Quest**, vui lòng **KHÔNG** tạo Issue công khai. Thay vào đó:

1. Gửi email trực tiếp đến **huyvu2512** qua [GitHub Profile](https://github.com/huyvu2512).
2. Hoặc tạo **Security Advisory** riêng tư trên GitHub.

## Phạm vi bảo mật

### Trong phạm vi xử lý
- Lỗ hổng trong các API Serverless (`/api/*`)
- Vấn đề rò rỉ token hoặc thông tin nhạy cảm
- Lỗi xác thực và phân quyền
- Cross-Site Scripting (XSS) trong giao diện web

### Ngoài phạm vi
- Các vấn đề liên quan đến Discord API hoặc hạ tầng Discord
- Lỗi bảo mật trên nền tảng Vercel
- Các vấn đề phía trình duyệt của người dùng

## Xử lý Token Discord

- **Không bao giờ** lưu Discord Token trên server hoặc database.
- Token chỉ được lưu trên LocalStorage của trình duyệt người dùng.
- Mọi request API chỉ truyền token qua body hoặc query params trong phiên làm việc hiện tại.
- Không ghi log token vào console hoặc file log trên server.

## Tiêu đề bảo mật (Security Headers)

Hệ thống đã cấu hình sẵn các tiêu đề bảo mật qua `vercel.json`:

| Header | Giá trị |
| :--- | :--- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

## Thời gian phản hồi

- Xác nhận nhận được báo cáo: trong vòng **48 giờ**
- Đánh giá và phân loại: trong vòng **7 ngày**
- Phát hành bản vá (nếu cần): trong vòng **14 ngày**
