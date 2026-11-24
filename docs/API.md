# API Reference

The system exposes **12** Serverless API endpoints running on Vercel Functions (or Vite middleware during local development). All endpoints use the shared `discord-client.js` helper to automatically scrape the latest Discord Build Number (cached for 6 hours) and generate accurate header sets for Desktop Client, Web Browser, Mobile Android, and Mobile iOS.

> **General Note:** Every endpoint returns `{ "success": false, "error": "..." }` on error. Endpoints interacting with Discord APIs handle Rate Limits (HTTP 429) by returning `isRateLimited: true` and `retryAfter` (seconds).

---

## 1. Network Info

**`GET /api/ip`**

Returns the client's public IP address. Reads `x-forwarded-for` / `x-real-ip` headers on Vercel, and falls back to `api.ipify.org` in local development.

**Success Response:**
```json
{ "ip": "42.117.xx.xx" }
```

---

## 2. Account Verification

**`POST /api/auth/verify`**

Validates a Discord User Token via `GET https://discord.com/api/v9/users/@me` and returns the normalized user profile.

**Body:**
```json
{ "token": "YOUR_DISCORD_TOKEN" }
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "user": {
    "id": "123456789012345678",
    "username": "Display Name",
    "rawUsername": "raw_username",
    "tag": "@raw_username",
    "avatar": "https://cdn.discordapp.com/avatars/.../...png?size=128",
    "email": "user@example.com",
    "phone": "+84xxxxxxxxx",
    "premiumType": 2
  }
}
```

**Common Errors:**
| HTTP Status | Meaning |
| :--- | :--- |
| `400` | Missing `token` field in request body |
| `401` | Invalid or revoked Discord token |
| `500` | Failed to reach Discord servers |

---

## 3. Refresh Account

**`POST /api/auth/refresh`**

Checks whether a stored token is still valid and fetches the latest profile metadata. Unlike `/verify`, expired tokens return HTTP 200 with `{ "success": false, "valid": false, "expired": true }` so the frontend can distinguish token expiration from network failures.

**Body:**
```json
{ "token": "YOUR_DISCORD_TOKEN" }
```

**Success Response (200):**
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

**Expired Token Response (200):**
```json
{
  "success": false,
  "valid": false,
  "expired": true,
  "error": "Session expired. Please reconnect your account."
}
```

---

## 4. Logout Session

**`POST /api/auth/logout`**

Server-side logout acknowledgment endpoint. Client-side session data is cleared from `localStorage`.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## 5. Scan Quests

**`GET /api/quests?token=TOKEN`** or **`POST /api/quests`** (body: `{ "token": "..." }`)

Core scanning endpoint. Runs **6 parallel data fetches** against Discord APIs and merges the results:

| # | Source | Discord API | Headers |
| :--- | :--- | :--- | :--- |
| 1 | Desktop Active | `GET /quests/@me` | Desktop Client |
| 2 | Web Active | `GET /quests/@me` | Web Browser |
| 3 | Mobile Android | `GET /quests/@me` | Android App |
| 4 | Mobile iOS | `GET /quests/@me` | iOS App |
| 5 | Claimed/Completed | `GET /quests/@me/claimed` | Desktop Client |
| 6 | Orbs Balance | `GET /users/@me/virtual-currency/balance` | Desktop Client |

It then queries **Decision Engine** via `GET /quests/get-decisions` across **44 parallel requests** (11 placements × 4 platform headers) to discover all sponsored quests.

**Special Handling:**
- **Hydrate Incomplete:** Automatically queries `GET /quests/{id}` for any quest missing config/tasks (trying Desktop → Web → Android → iOS).
- **Smart Deduplication:** Removes phantom pending entries that duplicate enrolled/claimed quests and merges records by campaign key.
- **Auto Gift Code:** Automatically fetches `GET /quests/{id}/reward-code` for up to 10 claimed quests with gift code rewards.
- **Noise Filtering:** Excludes unnamed quests and unstarted expired quests.

**Optional Query Params:**
| Param | Description |
| :--- | :--- |
| `customIds` | Comma-separated list of manually added quest IDs |

**Success Response (200):**
```json
{
  "success": true,
  "version": "v2-dynamic-decision",
  "balance": 700,
  "quests": [
    {
      "id": "1551234567890",
      "name": "Quest Name",
      "publisher": "Game / Publisher Name",
      "taskType": "WATCH_VIDEO",
      "typeName": "Watch Video",
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

**`status` Values:**
| Status | Meaning |
| :--- | :--- |
| `pending` | Not enrolled yet |
| `queued` | Enrolled, waiting or in progress |
| `completed` | 100% completed, ready to claim |
| `claimed` | Reward claimed |

**Supported `taskType` Values:**
| Task Type | Display Name |
| :--- | :--- |
| `WATCH_VIDEO` | Watch Video |
| `WATCH_VIDEO_ON_MOBILE` | Watch Video (Mobile) |
| `WATCH_STREAM` | Watch Stream |
| `PLAY_ON_DESKTOP` | Play on PC |
| `STREAM_ON_DESKTOP` | Stream on PC |
| `PLAY_ON_XBOX` | Play (Xbox) |
| `PLAY_ON_PLAYSTATION` | Play (PS5) |
| `PLAY_ON_NINTENDO` | Play (Nintendo) |
| `PLAY_ON_MOBILE` | Play Mobile |
| `PLAY_ACTIVITY` | Discord Activity |
| `FOLLOW_SOCIAL` | Follow Social |
| `SHARE_CONTENT` | Share Content |
| `JOIN_COMMUNITY` | Join Community |

---

## 6. Enroll in Quest

**`POST /api/quests/enroll`**

Enrolls the account in a Discord Quest. Automatically resolves `traffic_metadata_sealed` from Decision Engine if omitted, and tries all 4 header profiles (Desktop/Web/Android/iOS) until accepted.

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

> Only `token` and `questId` are required; remaining fields are resolved automatically when omitted.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Quest enrolled successfully",
  "user_status": { ... }
}
```

**Already Enrolled Response (200):**
```json
{
  "success": true,
  "message": "Quest already enrolled",
  "alreadyEnrolled": true
}
```

**Rate Limited Response (200):**
```json
{
  "success": false,
  "status": 429,
  "retryAfter": 5,
  "isRateLimited": true,
  "error": "Rate limited by Discord..."
}
```

**Expired Quest Response (200):**
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

## 7. Send Quest Progress

**`POST /api/quests/progress`**

Dispatches heartbeat or video milestone progress to Discord, automatically choosing the right endpoint and payload for the given `taskType`:

| Task Type | Discord Endpoint | Primary Payload |
| :--- | :--- | :--- |
| `WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE` | `POST /quests/{id}/video-progress` | `{ timestamp, traffic_metadata_sealed }` |
| `PLAY_ON_XBOX` / `PLAY_ON_PLAYSTATION` / `PLAY_ON_NINTENDO` | `POST /quests/{id}/console-heartbeat` | `{ application_id, terminal }` |
| `STREAM_ON_DESKTOP` / `WATCH_STREAM` / `PLAY_ACTIVITY` | `POST /quests/{id}/heartbeat` | `{ stream_key, application_id, terminal }` |
| `PLAY_ON_DESKTOP` / default | `POST /quests/{id}/heartbeat` | `{ application_id, terminal }` |

**Special Mechanisms:**
- **JIT Enroll (Video):** If `video-progress` returns 404, automatically calls `POST /quests/{id}/enroll` and retries.
- **Multi-Header Fallback (Video):** If Desktop headers fail, retries with Web → Mobile headers.
- **Auto `traffic_metadata_sealed`:** Automatically fetched from Decision Engine if missing (Video quests only).

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

> Only `token` and `questId` are required. `timestamp` is used for Video quests (in seconds). Set `terminal: true` on the final packet to flush session progress.

**Success Response (200):**
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

**Rate Limited Response (200):**
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

## 8. Quest Lookup by Link / ID

**`POST /api/quests/lookup`**

Fetches details for any quest by Discord Quest URL or Snowflake ID. Strips URL prefixes automatically and tries all 4 header profiles (Desktop → Web → Android → iOS).

**Body:**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "https://discord.com/quests/1551234567890"
}
```

> `questId` accepts both a full Discord URL and a numeric ID.

**Success Response (200):**
```json
{
  "success": true,
  "quest": {
    "id": "1551234567890",
    "name": "Quest Name",
    "publisher": "Publisher Name",
    "taskType": "PLAY_ON_DESKTOP",
    "typeName": "Play on PC",
    "targetSec": 900,
    "progSec": 0,
    "reward": "Game Gift Code",
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

## 9. Extract Gift Code

**`POST /api/quests/reward-code`** or **`GET /api/quests/reward-code?token=TOKEN&questId=ID`**

Retrieves the gift code from Discord (`GET /quests/{id}/reward-code`) for claimed quests that issue redeemable game codes.

**Body (POST):**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "questId": "1551234567890"
}
```

**Success Response (200):**
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

## 10. Badges & HypeSquad Management

**`GET /api/badges/hypesquad?token=TOKEN`**

Fetches account info, current HypeSquad House, profile badges (`/users/{id}/profile`), and full badge directory progress (`/users/@me/badges`).

**`POST /api/badges/hypesquad`**

Joins or switches HypeSquad House (`houseId`: `1` = Bravery, `2` = Brilliance, `3` = Balance).

**`DELETE /api/badges/hypesquad`**

Leaves the current HypeSquad House.

---

## 11. Detectable Windows Games (Discord CDN)

**`GET /api/badges/games?limit=10&random=true&q=...`**

Fetches and caches (12 hours) the detectable games catalog from `https://cdn.discordapp.com/detectables/games.json`, filtering only entries with valid `win32` executables.

---

## 12. Playtime / Variety Badge Telemetry

**`POST /api/badges/science`**

Automatically fetches `analytics_token` from `GET /users/@me?with_analytics_token=true` (when omitted), retrieves up-to-date Windows client properties from `cordapi.dolfi.es/api/v2/properties/windows` (syncing `client_launch_id`, `launch_signature`, `client_heartbeat_session_id` in `X-Super-Properties`), builds a 146-byte `executable_fingerprint` bound to `userId`, and posts `running_game_heartbeat` (initial, `start = now - durationMs`) ➔ `launch_game` ➔ `running_game_heartbeat` (final, `now`) to `https://discord.com/api/v9/science`.

**Body:**
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "games": [{ "id": "...", "name": "...", "exe": "..." }],
  "hoursPerGame": 10,
  "mode": "both",
  "analyticsToken": "(optional - reused within session)",
  "heartbeatSession": "(optional - heartbeat session UUID)",
  "launchSignature": "(optional - launch_signature UUID)",
  "clientLaunchId": "(optional - client_launch_id UUID)",
  "executableFingerprint": "(optional - auto-generated from userId by default)"
}
```

---

## Shared Module: Discord Client (`lib/discord-client.js`)

Internal helper module (not a public endpoint) used across serverless APIs. Provides:

| Helper | Description |
| :--- | :--- |
| `fetchLatestBuildNumber()` | Scrapes the latest Discord Build Number from `discord.com/app` (last 15 scripts), cached for 6 hours with fallback `626571`. |
| `getDesktopSuperProperties(buildNum)` | Builds Base64 `X-Super-Properties` for Discord Desktop Client (Windows). |
| `getWebSuperProperties(buildNum)` | Builds Base64 `X-Super-Properties` for Web Browser (Chrome). |
| `SUPER_PROPERTIES_MOBILE_ANDROID` | Static Base64 `X-Super-Properties` for Android (Samsung Galaxy S24). |
| `SUPER_PROPERTIES_MOBILE_IOS` | Static Base64 `X-Super-Properties` for iOS (iPhone 15 Pro). |
| `DISCORD_HEADERS(token, buildNum)` | Full header set emulating Discord Desktop Client. |
| `DISCORD_WEB_HEADERS(token, buildNum)` | Full header set emulating Web Browser access. |
| `DISCORD_MOBILE_HEADERS(token)` | Header set emulating Discord Android App. |
| `DISCORD_IOS_HEADERS(token)` | Header set emulating Discord iOS App. |
| `detectTaskType(config)` | Extracts quest task type from `task_config_v2` or `task_config` in priority order. |
| `getTaskTypeName(taskType)` | Maps task type codes to display labels. |
