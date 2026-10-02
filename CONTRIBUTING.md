# Đóng góp cho Discord Quest

Cảm ơn bạn đã quan tâm đến việc đóng góp cho **Discord Quest**! Mọi đóng góp đều được hoan nghênh và đánh giá cao.

## Cách đóng góp

### Báo cáo lỗi (Bug Report)

1. Kiểm tra [Issues hiện tại](https://github.com/huyvu2512/discord-quest/issues) để đảm bảo lỗi chưa được báo cáo.
2. Tạo Issue mới với tiêu đề rõ ràng mô tả lỗi.
3. Cung cấp thông tin:
   - Các bước tái tạo lỗi
   - Kết quả mong đợi vs kết quả thực tế
   - Ảnh chụp màn hình (nếu có)
   - Trình duyệt và hệ điều hành đang sử dụng

### Đề xuất tính năng (Feature Request)

1. Tạo Issue mới với tag `enhancement`.
2. Mô tả tính năng mong muốn và lý do cần thiết.
3. Đề xuất cách triển khai (nếu có).

### Gửi Pull Request

1. **Fork** dự án và tạo nhánh mới từ `main`:
   ```bash
   git checkout -b feature/ten-tinh-nang
   ```

2. **Cài đặt** môi trường phát triển:
   ```bash
   npm install
   npm run dev
   ```

3. **Viết code** tuân thủ các quy tắc:
   - Sử dụng Vanilla JavaScript (ES6 Modules), không thêm framework.
   - Sử dụng Vanilla CSS3 với Custom Properties, không dùng TailwindCSS.
   - Giữ nguyên cấu trúc thư mục hiện tại.
   - Comment bằng tiếng Việt cho các hàm và logic quan trọng.

4. **Kiểm tra** code hoạt động đúng trên cả Desktop và Mobile.

5. **Commit** với message rõ ràng:
   ```bash
   git commit -m "feat: mô tả tính năng ngắn gọn"
   ```

6. **Push** và tạo Pull Request:
   ```bash
   git push origin feature/ten-tinh-nang
   ```

## Quy ước Commit Message

| Prefix | Ý nghĩa |
| :--- | :--- |
| `feat:` | Tính năng mới |
| `fix:` | Sửa lỗi |
| `docs:` | Cập nhật tài liệu |
| `style:` | Thay đổi giao diện / CSS |
| `refactor:` | Tái cấu trúc code |
| `perf:` | Cải thiện hiệu năng |

## Cấu trúc dự án

| Thư mục | Vai trò |
| :--- | :--- |
| `api/` | Vercel Serverless Functions (Backend) |
| `api/discord-client.js` | Module chia sẻ Headers & Build Number |
| `css/` | Hệ thống styling với CSS Custom Properties |
| `js/` | Logic Frontend (ES6 Modules) |
| `js/views/` | Các view component cho từng tab |
| `public/` | File tĩnh SEO (robots.txt, sitemap.xml, manifest) |
| `docs/` | Tài liệu API và hướng dẫn kỹ thuật |

## Quy tắc ứng xử

- Tôn trọng mọi người đóng góp.
- Giữ thái độ xây dựng và chuyên nghiệp.
- Không spam hoặc quảng cáo trong Issues / PR.

---

Nếu có bất kỳ câu hỏi nào, vui lòng tạo [Issue](https://github.com/huyvu2512/discord-quest/issues) hoặc liên hệ trực tiếp.
