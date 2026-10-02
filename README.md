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
  - Tích hợp **Discord Decision Engine (Placements 0 ➔ 10)** với đầy đủ headers Desktop, Web, Android và iOS để quét trúng mọi chiến dịch tài trợ video/game mới nhất.
  - **Đồng bộ thuần API (Zero Stale Cache):** Loại bỏ hoàn toàn việc đọc trạng thái cũ từ LocalStorage; 100% dữ liệu hiển thị lấy trực tiếp từ Discord API, đảm bảo đồng nhất tuyệt đối trên mọi thiết bị và trình duyệt.
  - Tự động nhận diện chính xác phần thưởng: Orbs, Avatar Decoration, Profile Effect, Trang phục game, 2XP Boost, Gift Code.
  - Tự động lọc bỏ các nhiệm vụ rác hoặc đã hết hạn thực tế, giữ danh sách luôn tinh gọn.
- **Thêm nhiệm vụ bằng Link hoặc ID Discord (Custom Quest Lookup):**
  - Hỗ trợ thêm nhanh bất kỳ nhiệm vụ nào bằng cách dán URL (`https://discord.com/quests/...`) hoặc dãy số Snowflake ID.
  - Tự động tra cứu qua API `/api/quests/lookup` và lưu trữ đồng bộ vĩnh viễn vào hệ thống.
- **Giả lập tiến độ thông minh (Heartbeat Spoofing):**
  - **Nhiệm vụ Xem Video:** Tự động phát hiện video/trailer game, định kỳ gửi tiến trình `video-progress` từng giây thời gian thực (1s Real-time Wall-Clock), tự động kèm `traffic_metadata_sealed` đúng chuẩn Discord Client v9 (Chu kỳ khuyến nghị: 7s).
  - **Nhiệm vụ Chơi Game:** Giả lập `console-heartbeat` hoặc `heartbeat` an toàn chuẩn Discord Client (Chu kỳ chuẩn: 20s, hỗ trợ tinh chỉnh từ 5s đến 60s), tích lũy tiến độ mượt mà không bị delay.
  - **Nhiệm vụ Stream/Activity:** Hỗ trợ `stream_key` và `application_id` cho `STREAM_ON_DESKTOP`, `WATCH_STREAM`, `PLAY_ACTIVITY`.
  - **Nhiệm vụ Console:** Hỗ trợ `console-heartbeat` riêng cho Xbox, PlayStation, Nintendo.
- **Trình điều phối hàng đợi (Sequential Queue Runner):**
  - Đảm bảo tính tuần tự: Luôn chỉ duy nhất 1 nhiệm vụ được kích hoạt chạy tại một thời điểm để bảo vệ an toàn cho tài khoản.
  - Tự động bắt đầu nhiệm vụ tiếp theo trong hàng đợi ngay khi nhiệm vụ hiện tại chạm mốc 100%.
- **Cơ chế nhận thưởng đa nền tảng (Multi-Platform Claim):**
  - Tự động thử nhận thưởng qua **8 phương án** liên tiếp: Desktop Standard → Desktop Reward Modal → Desktop PC Platform → Web → Desktop No Platform → Mobile Android → Mobile iOS → Desktop Minimal.
  - Hỗ trợ Captcha passthrough: Khi Discord yêu cầu Captcha, API trả về `captchaSitekey` và `captchaService` để client giải quyết.
  - Tự động phát hiện nhiệm vụ đã nhận trước đó (`alreadyClaimed`).
  - Sau khi claim thành công, tự động truy vấn `/reward-code` để lấy Gift Code và cập nhật số dư Orbs mới nhất.
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
│   ├── discord-client.js         # Module chia sẻ: Build Number, Headers, Super Properties
│   ├── ip.js                     # API nhận diện IP mạng của client
│   └── quests/
│       ├── claim.js              # API nhận phần thưởng quest (Claim Reward)
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

Hệ thống cung cấp **10 endpoint** API Serverless chạy trên nền tảng Vercel Functions (hoặc Vite middleware khi chạy local). Tất cả các endpoint sử dụng module `discord-client.js` dùng chung để tự động cào Build Number mới nhất từ Discord (cache 6 tiếng) và sinh ra 4 bộ Headers giả lập chuẩn xác: Desktop Client, Web Browser, Mobile Android và Mobile iOS.

> **Lưu ý chung:** Mọi endpoint trả về `{ "success": false, "error": "..." }` khi gặp lỗi. Các endpoint tương tác với Discord API đều hỗ trợ phát hiện và xử lý Rate Limit (HTTP 429) với trường `isRateLimited: true` và `retryAfter` (giây).

---

### 1. Thông tin mạng

**`GET /api/ip`**

Trả về địa chỉ IP công cộng thật của client. Trên Vercel đọc từ header `x-forwarded-for` / `x-real-ip`; khi chạy local tự động fallback qua `api.ipify.org`.

**Phản hồi thành công:**
```json
{ "ip": "42.117.xx.xx" }
```

---

### 2. Xác thực tài khoản

**`POST /api/auth/verify`**

Xác thực Discord User Token bằng cách gọi `GET https://discord.com/api/v9/users/@me` và trả về hồ sơ người dùng đã xử lý.

**Body:**
```json
{ "token": "YOUR_DISCORD_TOKEN" }
```

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "message": "Xác thực tài khoản thành công",
  "user": {
    "id": "123456789012345678",
    "username": "Tên hiển thị",
    "rawUsername": "username_gốc",
    "tag": "@username_gốc",
    "avatar": "https://cdn.discordapp.com/avatars/.../...png?size=128",
    "email": "user@example.com",
    "phone": "+84xxxxxxxxx",
    "premiumType": 2
  }
}
```

**Lỗi phổ biến:**
| HTTP Status | Ý nghĩa |
| :--- | :--- |
| `400` | Thiếu trường `token` trong body |
| `401` | Token không hợp lệ hoặc đã bị Discord thu hồi |
| `500` | Lỗi kết nối máy chủ Discord |

---

### 3. Làm mới tài khoản

**`POST /api/auth/refresh`**

Kiểm tra tính hợp lệ của token đã lưu và cập nhật thông tin hồ sơ mới nhất. Khác với `/verify`: khi token hết hạn trả về `{ "success": false, "valid": false, "expired": true }` thay vì HTTP 401, giúp frontend phân biệt giữa lỗi token và lỗi mạng.

**Body:**
```json
{ "token": "YOUR_DISCORD_TOKEN" }
```

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "...", "username": "...", "rawUsername": "...", "tag": "...",
    "avatar": "...", "email": "...", "phone": "...", "premiumType": 0
  }
}
```

**Phản hồi khi token hết hạn (200):**
```json
{
  "success": false,
  "valid": false,
  "expired": true,
  "error": "Phiên đăng nhập đã hết hạn. Vui lòng kết nối lại tài khoản."
}
```

---

### 4. Đăng xuất phiên

**`POST /api/auth/logout`**

Endpoint xác nhận đăng xuất phía server. Phiên dữ liệu thực tế được xóa trên client (LocalStorage).

**Phản hồi (200):**
```json
{
  "success": true,
  "message": "Đăng xuất tài khoản thành công."
}
```

---

### 5. Quét danh sách nhiệm vụ

**`GET /api/quests?token=TOKEN`** hoặc **`POST /api/quests`** (body: `{ "token": "..." }`)

Endpoint lõi của hệ thống. Thực hiện **quét song song 6 nguồn dữ liệu** từ Discord API và hợp nhất thông minh:

| # | Nguồn | Discord API | Headers |
| :--- | :--- | :--- | :--- |
| 1 | Desktop Active | `GET /quests/@me` | Desktop Client |
| 2 | Web Active | `GET /quests/@me` | Web Browser |
| 3 | Mobile Android | `GET /quests/@me` | Android App |
| 4 | Mobile iOS | `GET /quests/@me` | iOS App |
| 5 | Claimed/Completed | `GET /quests/@me/claimed` | Desktop Client |
| 6 | Orbs Balance | `GET /users/@me/virtual-currency/balance` | Desktop Client |

Sau đó quét thêm **Decision Engine** qua `GET /quests/get-decisions` trên **44 request song song** (11 placements × 4 platform headers) để phát hiện 100% nhiệm vụ tài trợ.

**Xử lý đặc biệt:**
- **Hydrate incomplete:** Tự động truy vấn `GET /quests/{id}` cho mỗi quest thiếu config/tasks (thử lần lượt Desktop → Web → Android → iOS).
- **Smart Deduplication:** Loại bỏ quest "bóng ma" (pending trùng với quest đã enrolled/claimed), hợp nhất bản ghi trùng theo campaign key.
- **Auto Gift Code:** Tự động gọi `GET /quests/{id}/reward-code` cho tối đa 10 quest đã claimed có gift code.
- **Lọc quest rác:** Loại bỏ quest không có tên, quest đã hết hạn mà chưa làm.

**Query params tùy chọn:**
| Param | Mô tả |
| :--- | :--- |
| `customIds` | Danh sách ID quest thêm thủ công, phân cách bởi dấu phẩy |

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "version": "v2-dynamic-decision",
  "balance": 700,
  "quests": [
    {
      "id": "1551234567890",
      "name": "Tên nhiệm vụ",
      "publisher": "Tên game / nhà phát hành",
      "taskType": "WATCH_VIDEO",
      "typeName": "Xem Video",
      "applicationId": "123456789",
      "targetSec": 60,
      "progSec": 45,
      "reward": "150 Orbs",
      "code": null,
      "hasGiftCode": false,
      "status": "queued",
      "enrolledAt": "2026-10-01T12:00:00.000Z",
      "completedAt": null,
      "claimedAt": null,
      "startsAt": "2026-09-28T00:00:00.000Z",
      "expiresAt": "2026-10-15T23:59:59.000Z",
      "isExpired": false,
      "trafficMetadataSealed": "...",
      "discordUrl": "https://discord.com/quests/1551234567890",
      "videoUrl": "https://cdn.discordapp.com/...",
      "videoThumbnail": "https://cdn.discordapp.com/..."
    }
  ]
}
```

**Các giá trị `status`:**
| Status | Ý nghĩa |
| :--- | :--- |
| `pending` | Chưa đăng ký tham gia |
| `queued` | Đã đăng ký, đang chờ/đang chạy |
| `completed` | Đã hoàn thành 100%, chờ nhận thưởng |
| `claimed` | Đã nhận thưởng |

**Các giá trị `taskType` được hỗ trợ:**
| Task Type | Tên hiển thị |
| :--- | :--- |
| `WATCH_VIDEO` | Xem Video |
| `WATCH_VIDEO_ON_MOBILE` | Xem Video (Mobile) |
| `WATCH_STREAM` | Xem Livestream |
| `PLAY_ON_DESKTOP` | Chơi trên PC |
| `STREAM_ON_DESKTOP` | Stream trên PC |
| `PLAY_ON_XBOX` | Chơi (Xbox) |
| `PLAY_ON_PLAYSTATION` | Chơi (PS5) |
| `PLAY_ON_NINTENDO` | Chơi (Nintendo) |
| `PLAY_ON_MOBILE` | Chơi Mobile |
| `PLAY_ACTIVITY` | Hoạt động Discord |
| `FOLLOW_SOCIAL` | Theo dõi MXH |
| `SHARE_CONTENT` | Chia sẻ nội dung |
| `JOIN_COMMUNITY` | Tham gia nhóm |

---

### 6. Ghi danh nhiệm vụ

**`POST /api/quests/enroll`**

Gửi yêu cầu đăng ký tham gia nhiệm vụ tới Discord. Tự động nạp `traffic_metadata_sealed` từ Decision Engine nếu chưa có. Thử gửi lần lượt qua 4 bộ headers (Desktop/Web/Android/iOS) cho đến khi thành công.

**Body:**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "1551234567890",
  "taskType": "WATCH_VIDEO",
  "traffic_metadata_sealed": "...",
  "metadata_sealed": "..."
}
```

> Chỉ `token` và `questId` là bắt buộc. Các trường còn lại tự động nạp nếu thiếu.

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "message": "Nhận Quest thành công",
  "user_status": { ... }
}
```

**Phản hồi khi đã đăng ký trước đó (200):**
```json
{
  "success": true,
  "message": "Quest đã được nhận từ trước",
  "alreadyEnrolled": true
}
```

**Phản hồi khi bị Rate Limit (200):**
```json
{
  "success": false,
  "status": 429,
  "retryAfter": 5,
  "isRateLimited": true,
  "error": "Bạn đang bị Discord giới hạn tốc độ thao tác (Rate Limit)..."
}
```

**Phản hồi khi quest hết hạn (200):**
```json
{
  "success": false,
  "status": 400,
  "code": 260018,
  "isExpired": true,
  "error": "..."
}
```

---

### 7. Gửi tiến trình nhiệm vụ

**`POST /api/quests/progress`**

Gửi tiến trình giả lập nhịp tim tới Discord. Tự động chọn đúng endpoint và payload dựa trên `taskType`:

| Task Type | Discord Endpoint | Payload chính |
| :--- | :--- | :--- |
| `WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE` | `POST /quests/{id}/video-progress` | `{ timestamp, traffic_metadata_sealed }` |
| `PLAY_ON_XBOX` / `PLAY_ON_PLAYSTATION` / `PLAY_ON_NINTENDO` | `POST /quests/{id}/console-heartbeat` | `{ application_id, terminal }` |
| `STREAM_ON_DESKTOP` / `WATCH_STREAM` / `PLAY_ACTIVITY` | `POST /quests/{id}/heartbeat` | `{ stream_key, application_id, terminal }` |
| `PLAY_ON_DESKTOP` / mặc định | `POST /quests/{id}/heartbeat` | `{ application_id, terminal }` |

**Cơ chế đặc biệt:**
- **JIT Enroll (Video):** Nếu `video-progress` trả về 404, tự động gọi `POST /quests/{id}/enroll` rồi thử lại.
- **Multi-header fallback (Video):** Nếu Desktop headers thất bại, tự động thử lại với Web headers → Mobile headers.
- **Auto `traffic_metadata_sealed`:** Tự động nạp từ Decision Engine nếu chưa có (chỉ cho nhiệm vụ Video).

**Body:**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "1551234567890",
  "taskType": "WATCH_VIDEO",
  "timestamp": 18.5,
  "applicationId": "123456789",
  "terminal": false,
  "traffic_metadata_sealed": "..."
}
```

> Chỉ `token` và `questId` là bắt buộc. `timestamp` dùng cho Video (giây thực). `terminal` đặt `true` khi gửi gói tin cuối cùng (kết thúc phiên).

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "user_status": {
    "enrolled_at": "...",
    "completed_at": null,
    "claimed_at": null,
    "progress": {
      "WATCH_VIDEO": { "value": 18, "target": 60 }
    }
  }
}
```

**Phản hồi khi bị Rate Limit (200):**
```json
{
  "success": false,
  "status": 429,
  "retryAfter": 5,
  "isRateLimited": true,
  "error": "..."
}
```

---

### 8. Tra cứu nhiệm vụ bằng Link / ID

**`POST /api/quests/lookup`**

Tra cứu thông tin chi tiết của bất kỳ Quest nào qua đường link Discord hoặc Snowflake ID. Tự động làm sạch URL thành ID thuần số. Thử lần lượt 4 bộ headers (Desktop → Web → Android → iOS).

**Body:**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "https://discord.com/quests/1551234567890"
}
```

> `questId` chấp nhận cả URL đầy đủ lẫn ID thuần số.

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "quest": {
    "id": "1551234567890",
    "name": "Tên nhiệm vụ",
    "publisher": "Tên nhà phát hành",
    "taskType": "PLAY_ON_DESKTOP",
    "typeName": "Chơi trên PC",
    "targetSec": 900,
    "progSec": 0,
    "reward": "Gift Code Game",
    "code": null,
    "hasGiftCode": false,
    "status": "pending",
    "applicationId": "123456789",
    "enrolledAt": null,
    "completedAt": null,
    "claimedAt": null,
    "expiresAt": "2026-10-15T23:59:59.000Z",
    "isExpired": false,
    "discordUrl": "https://discord.com/quests/1551234567890"
  }
}
```

---

### 9. Nhận phần thưởng nhiệm vụ

**`POST /api/quests/claim`**

Gọi trực tiếp `POST https://discord.com/api/v9/quests/{id}/claim-reward` để nhận phần thưởng. Hỗ trợ nhận: **Orbs** (cộng vào ví ảo), **Avatar Decoration / Profile Effect** (cấp vào kho đồ), **Gift Code** (trả về mã đổi thưởng).

**Cơ chế Multi-Attempt:** Tự động thử 8 phương án payload liên tiếp với các tổ hợp `location`, `platform` và headers khác nhau:

| # | Tên | Headers | Platform | Location |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Desktop Standard | Desktop Client | Auto-detect | 11 (Quest Home) |
| 2 | Desktop Reward Modal | Desktop Client | Auto-detect | 25 (Reward Modal) |
| 3 | Desktop PC Platform | Desktop Client | 4 (PC) | 11 |
| 4 | Web Location 13 | Web Browser | Auto-detect | 13 (Mobile/Web) |
| 5 | Desktop No Platform | Desktop Client | _(bỏ qua)_ | 11 |
| 6 | Mobile Android | Android App | Auto-detect | 11 |
| 7 | Mobile iOS | iOS App | Auto-detect | 11 |
| 8 | Desktop Minimal | Desktop Client | _(bỏ qua)_ | _(bỏ qua)_ |

**Body:**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "1551234567890",
  "taskType": "PLAY_ON_DESKTOP",
  "platform": 0,
  "traffic_metadata_sealed": "...",
  "captchaKey": "...",
  "captchaRqtoken": "..."
}
```

> Chỉ `token` và `questId` là bắt buộc. `platform`: 0 = Desktop (mặc định), 1 = Xbox, 2 = PlayStation, 3 = Switch, 4 = PC. `captchaKey` / `captchaRqtoken` dùng khi Discord yêu cầu giải Captcha.

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "questId": "1551234567890",
  "code": "XXXX-XXXX-XXXX-XXXX",
  "claimedTier": 0,
  "balance": 850,
  "claimedAt": "2026-10-02T12:00:00.000Z"
}
```

> `code` là `null` nếu phần thưởng không phải Gift Code (ví dụ: Orbs, Avatar Decoration). `balance` là số dư Orbs mới nhất sau khi nhận thưởng.

**Phản hồi khi đã nhận trước đó (200):**
```json
{
  "success": true,
  "alreadyClaimed": true,
  "message": "Nhiệm vụ này đã được nhận trước đó"
}
```

**Phản hồi khi Discord yêu cầu Captcha (200):**
```json
{
  "success": false,
  "requireCaptcha": true,
  "captchaSitekey": "4bb5aadb-...",
  "captchaService": "hcaptcha",
  "captchaRqdata": "...",
  "captchaRqtoken": "...",
  "error": "Discord yêu cầu giải Captcha để nhận phần thưởng này"
}
```

---

### 10. Trích xuất Gift Code

**`POST /api/quests/reward-code`** hoặc **`GET /api/quests/reward-code?token=TOKEN&questId=ID`**

Lấy mã quà tặng Gift Code từ Discord API (`GET /quests/{id}/reward-code`) cho các quest đã nhận thưởng có phần thưởng dạng mã đổi thưởng game.

**Body (POST):**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "1551234567890"
}
```

**Phản hồi thành công (200):**
```json
{
  "success": true,
  "questId": "1551234567890",
  "code": "XXXX-XXXX-XXXX-XXXX",
  "platform": 0,
  "userId": "123456789012345678",
  "claimedAt": "2026-10-01T12:00:00.000Z",
  "tier": 0
}
```

---

### Module chia sẻ: Discord Client (`api/discord-client.js`)

Module nội bộ không phải endpoint công khai, được sử dụng bởi tất cả các API Serverless. Cung cấp:

| Chức năng | Mô tả |
| :--- | :--- |
| `fetchLatestBuildNumber()` | Tự động cào Build Number mới nhất từ `discord.com/app` bằng cách quét 15 script cuối cùng. Cache 6 tiếng, fallback mặc định `626571`. |
| `getDesktopSuperProperties(buildNum)` | Sinh `X-Super-Properties` Base64 chuẩn Discord Desktop Client (Windows, Electron 37.6.0). |
| `getWebSuperProperties(buildNum)` | Sinh `X-Super-Properties` Base64 chuẩn Web Browser (Chrome 138). |
| `SUPER_PROPERTIES_MOBILE_ANDROID` | `X-Super-Properties` Base64 tĩnh cho Android (Samsung Galaxy S24, v225.0). |
| `SUPER_PROPERTIES_MOBILE_IOS` | `X-Super-Properties` Base64 tĩnh cho iOS (iPhone 15 Pro, v225.0). |
| `DISCORD_HEADERS(token, buildNum)` | Bộ headers đầy đủ giả lập Discord Desktop Client. |
| `DISCORD_WEB_HEADERS(token, buildNum)` | Bộ headers đầy đủ giả lập Web Browser truy cập Discord. |
| `DISCORD_MOBILE_HEADERS(token)` | Bộ headers giả lập Discord Android App. |
| `DISCORD_IOS_HEADERS(token)` | Bộ headers giả lập Discord iOS App. |
| `detectTaskType(config)` | Nhận diện loại nhiệm vụ từ `task_config_v2` hoặc `task_config` theo thứ tự ưu tiên chuẩn. |
| `getTaskTypeName(taskType)` | Chuyển đổi mã task type sang tên hiển thị tiếng Việt. |

---

## Giấy phép

Dự án được phát hành theo giấy phép [MIT License](./LICENSE). Bản quyền thuộc về **Huy Vũ (@huyvu2512)**.
