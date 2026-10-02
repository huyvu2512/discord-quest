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

- **Quét kho nhiệm vụ Discord đa nguồn & đa nền tảng:**
  - Đồng bộ cùng lúc tất cả luồng dữ liệu từ Discord: `/quests/@me` (Desktop Client), Web Quest Home Showcase, Mobile Feed và `/quests/@me/claimed` (Nhiệm vụ đã hoàn thành).
  - Tích hợp **Discord Decision Engine (Placements 0 ➔ 6)** với đầy đủ headers Desktop, Web và Mobile để quét trúng mọi chiến dịch tài trợ video/game mới nhất (Take-Two, Arknights, March of Giants, CONTROL Resonant...).
  - **Đồng bộ thuần API (Zero Stale Cache):** Loại bỏ hoàn toàn việc đọc trạng thái cũ từ LocalStorage; 100% dữ liệu hiển thị lấy trực tiếp từ Discord API, đảm bảo đồng nhất tuyệt đối trên mọi thiết bị và trình duyệt.
  - Tự động nhận diện chính xác phần thưởng: Orbs, Avatar Decoration, Profile Effect, Trang phục game, 2XP Boost, Gift Code.
  - Tự động lọc bỏ các nhiệm vụ rác hoặc đã hết hạn thực tế, giữ danh sách luôn tinh gọn.
- **Thêm nhiệm vụ bằng Link hoặc ID Discord (Custom Quest Lookup):**
  - Hỗ trợ thêm nhanh bất kỳ nhiệm vụ nào bằng cách dán URL (`https://discord.com/quests/...`) hoặc dãy số Snowflake ID.
  - Tự động tra cứu qua API `/api/quests/lookup` và lưu trữ đồng bộ vĩnh viễn vào hệ thống.
- **Giả lập tiến độ thông minh (Heartbeat Spoofing):**
  - **Nhiệm vụ Xem Video:** Tự động phát hiện video/trailer game, định kỳ gửi tiến trình `video-progress` từng giây thời gian thực (1s Real-time Wall-Clock), tự động kèm `traffic_metadata_sealed` đúng chuẩn Discord Client v9 build 504649 (Chu kỳ khuyến nghị: 7s).
  - **Nhiệm vụ Chơi Game:** Giả lập `console-heartbeat` hoặc `heartbeat` an toàn chuẩn Discord Client (Chu kỳ chuẩn: 20s, hỗ trợ tinh chỉnh từ 5s đến 60s), tích lũy tiến độ mượt mà không bị delay.
- **Trình điều phối hàng đợi (Sequential Queue Runner):**
  - Đảm bảo tính tuần tự: Luôn chỉ duy nhất 1 nhiệm vụ được kích hoạt chạy tại một thời điểm để bảo vệ an toàn cho tài khoản.
  - Tự động bắt đầu nhiệm vụ tiếp theo trong hàng đợi ngay khi nhiệm vụ hiện tại chạm mốc 100%.
- **Cơ chế nhận thưởng an toàn (Safe Discord Claim):**
  - Tách bạch quy trình nhận quà: Nhấp nút **"Nhận quà"** sẽ mở trực tiếp trang quest trên Discord (`discord.com/quests/{id}`) trong tab mới để người dùng tự xác minh Captcha chính chủ.
  - **Đồng bộ trạng thái từ API thật:** Không tự ý đánh dấu hoàn thành; hệ thống tự động kiểm tra lại API Discord (khi chuyển tab hoặc sau khi mở link) để chỉ chuyển sang **"Hoàn thành"** khi Discord đã xác nhận quà được nhận vào tài khoản.
- **Giao diện Responsive Hiện Đại & Cân Đối:**
  - **Dashboard Trang chủ:** Bố cục 2 cột cân xứng tuyệt đối, card Nhật ký hoạt động trực tiếp tự động kéo dài (stretch) bằng phẳng mép đáy với các bước thao tác nhanh. Danh sách nhiệm vụ mở hiển thị tinh tế, gọn gàng, tự động rút gọn dấu `...` khi văn bản dài.
  - **Tối ưu Mobile bảng Quest (`/quests`):** Tự động ẩn cột phụ và chữ "Hoàn thành" rườm rà, bổ sung cột "Hết hạn" trực quan, mở rộng không gian cho tên nhiệm vụ và thanh tiến trình không bị chèn chữ.
- **Kho lưu trữ & Trích xuất Gift Code tự động:**
  - Tự động kết nối tới endpoint `/reward-code` của Discord để lấy mã Gift Code thật của các nhiệm vụ game đối tác đã nhận thưởng.
  - Hỗ trợ sao chép 1 chạm và quản lý thời hạn sử dụng.
- **Quản lý đa tài khoản & Khôi phục phiên:**
  - Hỗ trợ thêm và chuyển đổi giữa nhiều tài khoản Discord nhanh chóng.
  - Tự động lấy avatar, username, discriminator và số dư điểm ảo Orbs thật từ Discord.
- **Nhật ký thời gian thực (Live Execution Logs):**
  - Theo dõi mọi tiến trình gửi nhịp tim, hoàn thành và phản hồi từ Discord qua giao diện bảng điều khiển mô phỏng Terminal.
- **Tối ưu SEO & Theo dõi người dùng Vercel Analytics:**
  - Tích hợp sẵn Vercel Web Analytics và Speed Insights đo lường lượng người truy cập, hiệu suất tải trang và chỉ số Core Web Vitals.
  - Đầy đủ Sitemap XML, Robots.txt và Web App Manifest (PWA).

---

## Công nghệ sử dụng

| Thành phần | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript (ES6 Modules) | Xây dựng giao diện đơn trang mượt mà, phản hồi tức thì |
| **Styling** | Vanilla CSS3 (Custom Properties & Glassmorphism) | Giao diện tối hiện đại chuẩn Discord Dark Theme, không phụ thuộc thư viện nặng |
| **Build Tool** | Vite 6 | Máy chủ phát triển với HMR tức thì và tối ưu gói bundle |
| **Backend API** | Vercel Serverless Functions (Node.js) | Điều phối các request API, giải quyết CORS và tương tác Discord an toàn |
| **Discord Integration**| Discord API v9 Protocol | Giao tiếp chuẩn với hệ thống nhiệm vụ và điểm ảo Orbs của Discord |
| **Phân tích & Giám sát**| Vercel Web Analytics & Speed Insights | Giám sát lượng người dùng, lưu lượng truy cập và hiệu năng website |
| **Hạ tầng phân phối** | Vercel Edge Network | Phân phối mã nguồn tĩnh toàn cầu với độ trễ tối thiểu |

---

## Cấu trúc thư mục

```text
discord-quest/
├── api/                          # Vercel Serverless Functions
│   ├── auth/
│   │   ├── logout.js             # API xử lý đăng xuất phiên an toàn
│   │   ├── refresh.js            # API làm mới dữ liệu và hồ sơ tài khoản
│   │   └── verify.js             # API xác thực token và nạp thông tin user
│   ├── ip.js                     # API nhận diện IP mạng của client
│   └── quests/
│       ├── enroll.js             # API gửi yêu cầu ghi danh nhiệm vụ
│       ├── index.js              # API quét toàn bộ quest, lọc hết hạn & số dư Orbs
│       ├── lookup.js             # API tra cứu nhiệm vụ theo Link hoặc ID Discord
│       ├── progress.js           # API giả lập nhịp tim video & game chuẩn Discord
│       └── reward-code.js        # API trích xuất mã quà tặng Gift Code chính thức
├── assets/
│   ├── images/
│   │   ├── logo.png              # Logo ứng dụng
│   │   └── logo-transparent.png  # Logo trong suốt dùng cho Header
│   └── videos/
│       └── orb.webm              # Video vòng quay ngọc Orbs Discord mượt mà
├── css/
│   ├── components.css            # Thư viện component: nút, bảng, tag, thanh tiến trình
│   ├── home.css                  # Bố cục và style cho bảng điều khiển Tổng quan
│   ├── layout.css                # Bố cục khung sườn Header, Sidebar và Grid
│   ├── modal.css                 # Hộp thoại modal thêm tài khoản & thêm quest
│   └── variables.css             # Hệ màu, biến thiết kế và chủ đề Discord Dark
├── js/
│   ├── main.js                   # Điểm khởi đầu ứng dụng, điều phối tab và auto-runner
│   ├── state.js                  # Quản lý trạng thái trung tâm (Store thuần API)
│   └── views/
│       ├── accounts.js           # Logic hiển thị và thao tác quản lý tài khoản
│       ├── logs.js               # Logic hiển thị nhật ký hệ thống thời gian thực
│       ├── quests.js             # Logic hiển thị danh sách tất cả nhiệm vụ
│       ├── rewards.js            # Logic hiển thị kho mã quà tặng Gift Code
│       └── runner.js             # Logic điều khiển Trình Chạy tự động hóa hàng đợi
├── public/
│   ├── robots.txt                # Chỉ thị cho các công cụ tìm kiếm
│   ├── site.webmanifest          # Cấu hình PWA (cài đặt ứng dụng lên máy)
│   └── sitemap.xml               # Sơ đồ trang web chuẩn XML cho SEO
├── index.html                    # Trang HTML chính của ứng dụng
├── LICENSE                       # Giấy phép mã nguồn mở MIT
├── package.json                  # Cấu hình dự án và dependencies
├── vercel.json                   # Cấu hình định tuyến, cache, tiêu đề bảo mật Vercel
└── vite.config.js                # Cấu hình Vite dev server & middleware API local
```

---

## Khởi chạy dự án

### Yêu cầu tiên quyết
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- Trình quản lý gói `npm` (hoặc `yarn` / `pnpm`)

### Các bước cài đặt

1. **Sao chép mã nguồn:**
   ```bash
   git clone https://github.com/huyvu2512/discord-quest.git
   cd discord-quest
   ```

2. **Cài đặt các thư viện phụ thuộc:**
   ```bash
   npm install
   ```

3. **Chạy máy chủ phát triển cục bộ:**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ tự động mở tại địa chỉ `http://localhost:3000`.

4. **Đóng gói sản phẩm (Production Build):**
   ```bash
   npm run build
   ```
   Toàn bộ mã nguồn đóng gói tối ưu sẽ được xuất ra thư mục `dist/`.

---

## Triển khai lên Vercel

1. Đẩy toàn bộ mã nguồn lên kho lưu trữ GitHub của bạn.
2. Truy cập [Vercel Dashboard](https://vercel.com/) và chọn **Add New Project**.
3. Chọn kho lưu trữ `discord-quest` vừa tải lên.
4. Cấu hình tự động nhận diện:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Chọn **Deploy** để phát hành ứng dụng.
6. **Kích hoạt Vercel Web Analytics & Speed Insights:**
   - Trong bảng điều khiển dự án trên Vercel, chọn tab **Analytics** và nhấn **Enable**.
   - Chọn tab **Speed Insights** và nhấn **Enable**.
   - Toàn bộ dữ liệu lượng người truy cập, thời gian tải trang và thiết bị người dùng sẽ được thu thập tự động.

---

## API Reference

Hệ thống cung cấp các API Serverless chạy trên nền tảng Vercel Functions (hoặc Vite middleware khi chạy local):

### 1. Thông tin mạng (`/api/ip`)
- **GET `/api/ip`**
  - Trả về địa chỉ IP mạng thật của client.
  - Phản hồi: `{ "success": true, "ip": "42.117.xx.xx" }`

### 2. Xác thực tài khoản (`/api/auth/verify`)
- **POST `/api/auth/verify`**
  - Xác thực User Token với máy chủ Discord và lấy dữ liệu hồ sơ.
  - Body: `{ "token": "YOUR_DISCORD_TOKEN" }`
  - Phản hồi: `{ "success": true, "user": { "id": "...", "username": "...", "global_name": "...", "avatar": "..." } }`

### 3. Làm mới tài khoản (`/api/auth/refresh`)
- **POST `/api/auth/refresh`**
  - Kiểm tra tính hợp lệ của token và cập nhật thông tin mới nhất từ Discord.
  - Body: `{ "token": "YOUR_DISCORD_TOKEN" }`

### 4. Đăng xuất phiên (`/api/auth/logout`)
- **POST `/api/auth/logout`**
  - Xóa phiên làm việc hiện tại an toàn.

### 5. Danh sách nhiệm vụ (`/api/quests`)
- **GET `/api/quests?token=YOUR_DISCORD_TOKEN`**
  - Đồng bộ toàn bộ nhiệm vụ từ Discord (Desktop, Web, Mobile Decisions, Claimed), tính toán tiến trình chuẩn, loại trừ nhiệm vụ hết hạn và lấy số dư Orbs.
  - Query tùy chọn: `customIds=155...,155...` để quét thêm các nhiệm vụ thêm thủ công.
  - Phản hồi: `{ "success": true, "balance": 700, "quests": [...] }`

### 6. Ghi danh nhiệm vụ (`/api/quests/enroll`)
- **POST `/api/quests/enroll`**
  - Gửi yêu cầu đăng ký tham gia nhiệm vụ tới Discord kèm `traffic_metadata_sealed`.
  - Body: `{ "token": "YOUR_DISCORD_TOKEN", "questId": "..." }`
  - Phản hồi: `{ "success": true, "enrolled": true }`

### 7. Gửi tiến trình nhiệm vụ (`/api/quests/progress`)
- **POST `/api/quests/progress`**
  - Gửi tiến trình `video-progress` hoặc game `heartbeat` mô phỏng client Discord thật build 504649.
  - Body: `{ "token": "...", "questId": "...", "taskType": "WATCH_VIDEO", "timestamp": 18, "applicationId": "..." }`
  - Phản hồi: `{ "success": true, "user_status": { ... } }`

### 8. Tra cứu nhiệm vụ bằng Link / ID (`/api/quests/lookup`)
- **POST `/api/quests/lookup`**
  - Tra cứu thông tin chi tiết của bất kỳ Quest nào qua đường link Discord hoặc Snowflake ID.
  - Body: `{ "token": "...", "questId": "https://discord.com/quests/155..." }`
  - Phản hồi: `{ "success": true, "quest": { ... } }`

### 9. Trích xuất Gift Code (`/api/quests/reward-code`)
- **POST `/api/quests/reward-code`**
  - Lấy mã quà tặng dạng văn bản trực tiếp từ Discord API cho các quest đã nhận thưởng.
  - Body: `{ "token": "...", "questId": "..." }`
  - Phản hồi: `{ "success": true, "code": "XXXX-XXXX-XXXX" }`

---

## Giấy phép

Dự án được phát hành theo giấy phép [MIT License](./LICENSE). Bản quyền thuộc về **Huy Vũ (@huyvu2512)**.
