<div align="center">

# Discord Quest

**Tự động hóa tiến trình nhiệm vụ, đồng bộ Orbs và quản lý phần thưởng Discord.**

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla%20Tokens-1572B6?logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![Discord](https://img.shields.io/badge/Discord-API%20v9-5865F2?logo=discord&logoColor=white)](https://discord.com/developers/docs/intro)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[![Stars](https://img.shields.io/github/stars/huyvu2512/discord-quest?style=flat-square&label=Stars&color=FFCC00)](https://github.com/huyvu2512/discord-quest/stargazers)
[![Forks](https://img.shields.io/github/forks/huyvu2512/discord-quest?style=flat-square&label=Forks&color=6e7681)](https://github.com/huyvu2512/discord-quest/forks)
[![Issues](https://img.shields.io/github/issues/huyvu2512/discord-quest?style=flat-square&label=Issues&color=f85149)](https://github.com/huyvu2512/discord-quest/issues)
[![Last Commit](https://img.shields.io/github/last-commit/huyvu2512/discord-quest?style=flat-square&label=Last%20Commit&color=3fb950)](https://github.com/huyvu2512/discord-quest/commits/main)
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=huyvu2512.discord-quest&left_text=Visitors&left_color=6e7681&right_color=5865F2)

[Xem Website](https://discord.huyvu2512.io.vn/) · [Báo Lỗi](https://github.com/huyvu2512/discord-quest/issues) · [Yêu Cầu Tính Năng](https://github.com/huyvu2512/discord-quest/issues)

</div>

---

## Giới thiệu

**Discord Quest** là nền tảng quản trị và tự động hóa toàn diện quy trình làm nhiệm vụ trên Discord dành cho game thủ và người săn phần thưởng. Được phát triển bởi **Huy Vũ (@huyvu2512)** với tôn chỉ hiệu năng cao, trực quan và an toàn tuyệt đối.

Hệ thống cho phép quét kho nhiệm vụ chính thức từ Discord qua API Serverless, tự động phân loại nhiệm vụ Xem Video (`WATCH_VIDEO`) và Chơi Game (`PLAY_ON_DESKTOP`), gửi gói tin nhịp tim mô phỏng Client thật để tích lũy tiến độ lên 100%, tự động chuyển tiếp hàng đợi và hỗ trợ mở link nhận thưởng trực tiếp trên Discord mà không lo ngại vấn đề Captcha bị chặn.

---

## Tính năng chính

- 🔍 **Quét nhiệm vụ đa nguồn** — Đồng bộ từ Desktop, Web, Mobile (Android + iOS) và Decision Engine (Placements 0 ➔ 10), tổng cộng 44+ request song song.
- 🎯 **Đồng bộ thuần API** — 100% dữ liệu lấy trực tiếp từ Discord API, không cache cũ, đồng nhất trên mọi thiết bị.
- ⚡ **Giả lập tiến độ thông minh** — Xem Video (7s), Chơi Game (20s), Stream, Console với heartbeat chuẩn Discord Client.
- 🎁 **Mở nhận thưởng trực tiếp** — Nút Nhận quà dẫn thẳng tới trang nhiệm vụ Discord để nhận phần thưởng an toàn, tiện lợi.
- 📋 **Hàng đợi tuần tự** — Chạy 1 quest tại một thời điểm, tự động chuyển quest tiếp theo khi đạt 100%.
- 🔑 **Trích xuất Gift Code** — Tự động lấy mã quà từ Discord cho các quest game đối tác.
- 👥 **Đa tài khoản** — Thêm và chuyển đổi nhanh giữa nhiều tài khoản Discord.
- 📱 **Responsive** — Giao diện tối ưu cho cả PC và Mobile.
- 📊 **Vercel Analytics** — Tích hợp sẵn Web Analytics và Speed Insights.

---

## Công nghệ

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript (ES6 Modules) |
| **Styling** | Vanilla CSS3 (Custom Properties & Glassmorphism) |
| **Build** | Vite 6 |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **API** | Discord API v9 Protocol |
| **Hosting** | Vercel Edge Network |

---

## Cấu trúc thư mục

```text
discord-quest/
├── api/                          # Vercel Serverless Functions (9 endpoints)
│   ├── auth/                     # Xác thực, làm mới, đăng xuất
│   │   ├── logout.js
│   │   ├── refresh.js
│   │   └── verify.js
│   ├── discord-client.js         # Module chia sẻ: Build Number, Headers, Super Properties
│   ├── ip.js                     # Nhận diện IP mạng
│   └── quests/                   # Quét, ghi danh, tiến trình, tra cứu, gift code
│       ├── enroll.js
│       ├── index.js
│       ├── lookup.js
│       ├── progress.js
│       └── reward-code.js
├── css/                          # Hệ thống styling Discord Dark Theme
├── js/                           # Logic Frontend (ES6 Modules)
│   ├── main.js                   # Điều phối tab và auto-runner
│   ├── state.js                  # Quản lý trạng thái trung tâm
│   └── views/                    # View components cho từng tab
├── public/                       # SEO: robots.txt, sitemap.xml, manifest
├── docs/                         # Tài liệu kỹ thuật
│   └── API.md                    # API Reference đầy đủ
├── index.html
├── vercel.json                   # Cấu hình routing & security headers
└── vite.config.js                # Dev server & API middleware
```

---

## Khởi chạy nhanh

```bash
# 1. Clone
git clone https://github.com/huyvu2512/discord-quest.git
cd discord-quest

# 2. Cài đặt
npm install

# 3. Chạy dev server
npm run dev
# → Mở tại http://localhost:3000

# 4. Build production
npm run build
# → Output: dist/
```

---

## Triển khai Vercel

1. Push code lên GitHub.
2. Truy cập [Vercel Dashboard](https://vercel.com/) → **Add New Project**.
3. Chọn repo `discord-quest`, cấu hình:
   - **Framework:** `Vite`
   - **Build:** `npm run build`
   - **Output:** `dist`
4. Nhấn **Deploy**.
5. Bật **Analytics** và **Speed Insights** trong tab tương ứng.

---

## API Overview

Hệ thống cung cấp **9 endpoint** API Serverless. Chi tiết đầy đủ xem tại 👉 **[docs/API.md](./docs/API.md)**

| # | Endpoint | Method | Mô tả |
| :--- | :--- | :--- | :--- |
| 1 | `/api/ip` | GET | Nhận diện IP mạng |
| 2 | `/api/auth/verify` | POST | Xác thực token Discord |
| 3 | `/api/auth/refresh` | POST | Làm mới hồ sơ tài khoản |
| 4 | `/api/auth/logout` | POST | Đăng xuất phiên |
| 5 | `/api/quests` | GET/POST | Quét toàn bộ nhiệm vụ & Orbs |
| 6 | `/api/quests/enroll` | POST | Ghi danh tham gia nhiệm vụ |
| 7 | `/api/quests/progress` | POST | Gửi heartbeat tiến trình |
| 8 | `/api/quests/lookup` | POST | Tra cứu quest theo Link/ID |
| 9 | `/api/quests/reward-code` | POST/GET | Trích xuất Gift Code |

---

## Tài liệu

| Tài liệu | Nội dung |
| :--- | :--- |
| **[docs/API.md](./docs/API.md)** | API Reference chi tiết: request/response schema, rate limiting, multi-platform fallback |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Hướng dẫn đóng góp, quy ước commit, cấu trúc dự án |
| **[SECURITY.md](./SECURITY.md)** | Chính sách bảo mật, xử lý token, security headers |
| **[LICENSE](./LICENSE)** | Giấy phép mã nguồn mở MIT |

---

## Tuyên bố miễn trừ

Dự án này là sản phẩm cộng đồng mã nguồn mở, **không liên kết, không được tài trợ và không được chứng thực** bởi Discord Inc. "Discord" là nhãn hiệu đã đăng ký của Discord Inc. Mọi tên game, logo và nhãn hiệu đề cập trong dự án thuộc về chủ sở hữu tương ứng.

Việc sử dụng dự án này hoàn toàn thuộc trách nhiệm của người dùng. Tác giả không chịu trách nhiệm cho bất kỳ hậu quả nào phát sinh từ việc sử dụng công cụ này.

## Giấy phép

Mã nguồn được phát hành theo giấy phép [MIT License](./LICENSE).
