# API Reference

Hệ thống cung cấp **9 endpoint** API Serverless chạy trên nền tảng Vercel Functions (hoặc Vite middleware khi chạy local). Tất cả các endpoint sử dụng module `discord-client.js` dùng chung để tự động cào Build Number mới nhất từ Discord (cache 6 tiếng) và sinh ra 4 bộ Headers giả lập chuẩn xác: Desktop Client, Web Browser, Mobile Android và Mobile iOS.

> **Lưu ý chung:** Mọi endpoint trả về `{ "success": false, "error": "..." }` khi gặp lỗi. Các endpoint tương tác với Discord API đều hỗ trợ phát hiện và xử lý Rate Limit (HTTP 429) với trường `isRateLimited: true` và `retryAfter` (giây).

---

## 1. Thông tin mạng

**`GET /api/ip`**

Trả về địa chỉ IP công cộng thật của client. Trên Vercel đọc từ header `x-forwarded-for` / `x-real-ip`; khi chạy local tự động fallback qua `api.ipify.org`.

**Phản hồi thành công:**
```json
{ "ip": "42.117.xx.xx" }
```

---

## 2. Xác thực tài khoản

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

## 3. Làm mới tài khoản

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

## 4. Đăng xuất phiên

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

## 5. Quét danh sách nhiệm vụ

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

## 6. Ghi danh nhiệm vụ

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

## 7. Gửi tiến trình nhiệm vụ

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

## 8. Tra cứu nhiệm vụ bằng Link / ID

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

## 9. Trích xuất Gift Code

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

## Module chia sẻ: Discord Client (`api/discord-client.js`)

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
