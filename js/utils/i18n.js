/**
 * INTERNATIONALIZATION (i18n) UTILITY (js/utils/i18n.js)
 * Tự động nhận diện ngôn ngữ trình duyệt và hỗ trợ dịch toàn bộ giao diện + log.
 */

const I18N_STORAGE_KEY = 'dq_lang_v1';
const SUPPORTED_LANGS = ['vi', 'en'];

const I18N_DICT = {
  vi: {
    stat_done: 'Đã xong:',
    stat_balance: 'Số dư:',
    btn_scan: 'Quét Quest',
    btn_reload: 'Làm mới',
    btn_run_all: 'Chạy Tất Cả',
    btn_stop_all: 'Dừng Lại',
    share_title: 'Chia sẻ ứng dụng / Thêm vào màn hình chính',
    lang_title: 'Đổi ngôn ngữ giao diện',
    nav_home: 'Trang chủ',
    nav_accounts: 'Tài khoản',
    nav_quests: 'Quest',
    nav_rewards: 'Mã quà',
    nav_badges: 'Lấy huy hiệu',
    nav_playtime: 'Chạy huy hiệu',
    nav_logs: 'Nhật ký',
    nav_settings: 'Cài đặt',
    nav_more: 'Thêm',
    page_accounts_title: 'Quản Lý Tài Khoản',
    page_accounts_sub: 'Nhập và kiểm tra Token Discord để bắt đầu quét nhiệm vụ.',
    page_quests_title: 'Quest',
    page_quests_sub: 'Các nhiệm vụ đang gửi tiến trình hoặc chờ nhận thưởng.',
    page_rewards_title: 'Mã Quà Tặng & Gift Code',
    page_rewards_sub: 'Danh sách các nhiệm vụ có mã Gift Code từ Discord và đối tác.',
    page_badges_title: 'Lấy Huy Hiệu Discord',
    page_badges_sub: 'Nhận hoặc chuyển đổi nhanh huy hiệu HypeSquad House và kiểm tra các huy hiệu hiện có trên hồ sơ.',
    page_playtime_title: 'Chạy Huy Hiệu Game',
    page_playtime_sub: 'Tăng cấp huy hiệu Thời gian chơi và Trò chơi đa dạng cho tài khoản đang chọn.',
    page_logs_title: 'Nhật Ký Request',
    page_logs_sub: 'Dòng sự kiện gọi Discord API và cập nhật tiến trình ngầm.',
    page_settings_title: 'Cài Đặt Hệ Thống',
    page_settings_sub: 'Tùy chỉnh tự động hóa, chu kỳ gửi tiến trình và an toàn tài khoản.',
    log_all: 'Tất cả log',
    log_download: 'Tải log',
    log_download_title: 'Tải toàn bộ nhật ký về máy (.txt)',
    log_empty: 'Không có dòng nhật ký nào phù hợp với bộ lọc [{lvl}].',
    log_empty_export: 'Không có nhật ký nào để tải về!',
    log_empty_filter_export: 'Không có dòng log nào thuộc bộ lọc [{lvl}]!',
    log_export_title: 'DISCORD QUEST TOOL - NHẬT KÝ REQUEST CONSOLE',
    log_export_time: 'Thời gian xuất: {time}',
    log_export_level: 'Bộ lọc cấp độ: {lvl}',
    log_export_total: 'Tổng số sự kiện: {count}',
    pwa_ios_guide: '• <strong>iPhone / iPad (iOS Safari):</strong> Bấm nút <strong>Chia sẻ</strong> (biểu tượng mũi tên trỏ lên ở cạnh dưới Safari) ➔ Kéo xuống chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.',
    pwa_android_guide: '• <strong>Android (Chrome):</strong> Bấm nút <strong>Menu 3 chấm (⋮)</strong> góc trên cùng ➔ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.',
    token_guide_console_desc: 'Mở Discord web, nhấn <code>F12</code> ➔ tab <strong>Console</strong> ➔ dán lệnh:',
    token_guide_net_1: 'Nhấn <code>F12</code> trên Discord ➔ chọn tab <strong>Network</strong> ➔ lọc <code>api/</code>',
    token_guide_net_2: 'Bấm 1 request bất kỳ ➔ chọn tab <strong>Headers</strong> ➔ copy chuỗi sau <strong>authorization:</strong>',
    quest_modal_hint: '💡 <strong>Mẹo:</strong> Trong Discord, bấm vào dấu 3 chấm (•••) ở góc trên thẻ Quest ➔ chọn <strong>"Sao chép liên kết"</strong> rồi dán vào đây để công cụ tự động quét và nạp ngay lập tức!'
  },
  en: {
    stat_done: 'Done:',
    stat_balance: 'Balance:',
    btn_scan: 'Scan Quests',
    btn_reload: 'Reload',
    btn_run_all: 'Run All',
    btn_stop_all: 'Stop All',
    share_title: 'Share app / Add to Home Screen',
    lang_title: 'Switch interface language',
    nav_home: 'Home',
    nav_accounts: 'Accounts',
    nav_quests: 'Quests',
    nav_rewards: 'Rewards',
    nav_badges: 'Get Badges',
    nav_playtime: 'Badge Runner',
    nav_logs: 'Logs',
    nav_settings: 'Settings',
    nav_more: 'More',
    page_accounts_title: 'Account Manager',
    page_accounts_sub: 'Add and verify your Discord Token to start scanning quests.',
    page_quests_title: 'Quests',
    page_quests_sub: 'Quests currently progressing or ready to claim rewards.',
    page_rewards_title: 'Gift Codes & Rewards',
    page_rewards_sub: 'Gift codes extracted from Discord and partner quests.',
    page_badges_title: 'Discord Badges',
    page_badges_sub: 'Claim or switch HypeSquad House badges and inspect your profile badges.',
    page_playtime_title: 'Game Badge Runner',
    page_playtime_sub: 'Level up Game Time and Game Variety badges for the active account.',
    page_logs_title: 'Request Logs',
    page_logs_sub: 'Live Discord API request events and background progress updates.',
    page_settings_title: 'System Settings',
    page_settings_sub: 'Configure automation, heartbeat intervals, and account safety.',
    log_all: 'All Logs',
    log_download: 'Download Logs',
    log_download_title: 'Download all logs as .txt',
    log_empty: 'No log entries match filter [{lvl}].',
    log_empty_export: 'No logs available to download!',
    log_empty_filter_export: 'No logs match filter [{lvl}]!',
    log_export_title: 'DISCORD QUEST TOOL - REQUEST CONSOLE LOGS',
    log_export_time: 'Exported at: {time}',
    log_export_level: 'Level filter: {lvl}',
    log_export_total: 'Total events: {count}',
    pwa_ios_guide: '• <strong>iPhone / iPad (iOS Safari):</strong> Tap <strong>Share</strong> (up-arrow icon at the bottom) ➔ Scroll down and select <strong>"Add to Home Screen"</strong>.',
    pwa_android_guide: '• <strong>Android (Chrome):</strong> Tap the <strong>3-dot menu (⋮)</strong> at the top-right ➔ Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.',
    token_guide_console_desc: 'Open Discord Web, press <code>F12</code> ➔ <strong>Console</strong> tab ➔ paste:',
    token_guide_net_1: 'Press <code>F12</code> in Discord ➔ open <strong>Network</strong> tab ➔ filter <code>api/</code>',
    token_guide_net_2: 'Click any request ➔ open <strong>Headers</strong> ➔ copy the value after <strong>authorization:</strong>',
    quest_modal_hint: '💡 <strong>Tip:</strong> In Discord, click the 3 dots (•••) on a Quest card ➔ select <strong>"Copy Link"</strong> and paste it here to scan immediately!'
  }
};

// Sắp xếp cụm dài trước, ngắn sau để tránh thay thế chồng chéo
const PHRASE_MAP = [
  // Home Safety & Quick Steps Cards
  ['Cơ Chế Vận Hành An Toàn', { en: 'Safe Operation Mechanism' }],
  ['Treo Tiến Độ Tự Động', { en: 'Auto Background Progress' }],
  ['Tự động tính giờ chơi ngầm, không cần cài hay mở game', {
    en: 'Tracks playtime in background without installing or launching games'
  }],
  ['Hàng Đợi Đơn Luồng', { en: 'Single-Thread Queue' }],
  ['Chạy tuần tự 1 quest, chống rate-limit & ban', {
    en: 'Runs 1 quest at a time sequentially to avoid rate-limits & bans'
  }],
  ['Tự Động Claim Quà', { en: 'Auto Reward Tracking' }],
  ['Nhận Orbs & lưu mã Gift Code khi đạt 100%', {
    en: 'Sync Orbs & save Gift Codes upon reaching 100%'
  }],
  ['Bảo Mật Cục Bộ 100%', { en: '100% Local Security' }],
  ['Token lưu trữ trong LocalStorage máy của bạn', {
    en: 'Tokens are stored strictly in your browser LocalStorage'
  }],
  ['3 Bước Thao Tác Nhanh', { en: '3 Quick Steps' }],
  ['Thêm & kiểm tra Token Discord', { en: 'Add & verify Discord Token' }],
  ['Bấm "Quét Quest" để tải dữ liệu', { en: 'Click "Scan Quests" to load data' }],
  ['Bấm "Chạy Tất Cả" để bắt đầu auto', { en: 'Click "Run All" to start automation' }],
  ['Đang chọn', { en: 'Selected' }],
  ['Đăng xuất', { en: 'Log Out' }],
  ['Chọn', { en: 'Select' }],
  ['Bảng điều khiển tự động cày nhiệm vụ Discord, tính giờ chơi ngầm, nhận Orbs và lưu mã Gift Code an toàn.', {
    en: 'Dashboard to automate Discord Quests, farm background playtime, earn Orbs, and safely store Gift Codes.'
  }],
  ['Tài khoản hiện tại chưa tải danh sách Quest từ Discord. Bấm nút bên dưới để quét danh sách nhiệm vụ thật.', {
    en: 'No quests loaded for this account yet. Click below to scan live quests from Discord.'
  }],
  ['Khi tài khoản có nhiệm vụ tặng Gift Code (Roblox, Apex, Star Wars, NBA...), nhiệm vụ sẽ xuất hiện tại đây để bạn bấm lấy mã.', {
    en: 'When your account has quests awarding Gift Codes (Roblox, Apex, Star Wars, NBA...), they will appear here.'
  }],
  ['Bạn cần thêm và xác thực ít nhất 1 Token tài khoản Discord để mở khóa các mục Tiến độ, Quests và Quà tặng.', {
    en: 'Add and verify at least 1 Discord account token to unlock Progress, Quests, and Rewards.'
  }],
  ['Đang có tiến trình cày huy hiệu Playtime! Vui lòng dừng Playtime trước khi chạy Quest.', {
    en: 'Playtime runner is active! Please stop Playtime before running Quests.'
  }],
  ['[Quest] Không thể chạy: Tiến trình cày huy hiệu Playtime đang chạy song song.', {
    en: '[Quest] Cannot start: Playtime badge runner is currently active.'
  }],
  ['Tự động chuyển sang nhiệm vụ tiếp theo trong hàng đợi khi đạt 100%.', {
    en: 'Automatically advance to the next queued quest upon reaching 100%.'
  }],
  ['Tự gửi yêu cầu ghi danh nhiệm vụ nếu tài khoản chưa bắt đầu.', {
    en: 'Automatically enroll in quests before sending progress.'
  }],
  ['Khoảng nghỉ giữa các lần cập nhật xem video (Khuyến nghị: 7s).', {
    en: 'Delay between video watch progress updates (Recommended: 7s).'
  }],
  ['Tần suất gửi heartbeat chơi game ngầm (Chuẩn Discord: 20s, khuyến nghị: 15-20s).', {
    en: 'Background game heartbeat frequency (Discord standard: 20s, recommended: 15-20s).'
  }],
  ['Lệch ngẫu nhiên ±1-3 giây để giả lập người thật, tránh pattern máy móc.', {
    en: 'Add ±1–3s random variance to mimic real human activity.'
  }],
  ['Mở web dạng app độc lập, full màn hình với logo Discord Quest chính chủ.', {
    en: 'Launch as a standalone fullscreen app with the official Discord Quest icon.'
  }],
  ['Thêm ứng dụng ra màn hình chính điện thoại (Android & iOS)', {
    en: 'Install web app to mobile Home Screen (Android & iOS)'
  }],
  ['Điều chỉnh chu kỳ gửi tiến trình để mô phỏng tự nhiên', {
    en: 'Adjust heartbeat intervals for natural simulation'
  }],
  ['Cơ chế tự động đăng ký và nhận phần thưởng', {
    en: 'Auto-enrollment and queue progression'
  }],
  ['Chọn nhà HypeSquad yêu thích để gắn hoặc đổi huy hiệu trực tiếp trên hồ sơ Discord.', {
    en: 'Pick a HypeSquad House to claim or switch the badge directly on your Discord profile.'
  }],
  ['Dũng cảm, quyết đoán và không bao giờ chùn bước trước thử thách.', {
    en: 'Brave, decisive, and never backing down from a challenge.'
  }],
  ['Sáng tạo, đầy ý tưởng đột phá và tham vọng bền bỉ.', {
    en: 'Creative, full of breakthrough ideas, and relentlessly ambitious.'
  }],
  ['Điềm tĩnh, hòa hợp và luôn duy trì trật tự trong mọi tình huống.', {
    en: 'Calm, harmonious, and always maintaining order in every situation.'
  }],
  ['Chạy huy hiệu Thời gian chơi & Trò chơi đa dạng', {
    en: 'Run Game Time & Game Variety Badges'
  }],
  ['Mở khóa mốc 5.000+ giờ chơi và 100+ trò chơi tự động', {
    en: 'Automatically unlock the 5,000+ hours and 100+ games milestones'
  }],
  ['Duyệt huy hiệu của bạn và khám phá những món mới mà bạn có thể mở khóa.', {
    en: 'Browse your badges and discover new ones you can unlock.'
  }],
  ['Đã kích hoạt chế độ: Chạy lần lượt từng quest theo thứ tự hàng đợi.', {
    en: 'Sequential queue mode enabled: running quests one by one.'
  }],
  ['Đang chạy Playtime, vui lòng dừng Playtime trước khi chạy Quest', {
    en: 'Playtime is running, please stop Playtime before running Quests'
  }],
  ['Đang chạy cày huy hiệu Playtime! Vui lòng dừng Playtime trước khi chạy Quest.', {
    en: 'Playtime runner is active! Stop Playtime before running this Quest.'
  }],
  ['Tạm dừng nhiệm vụ đang chạy để ưu tiên chạy Quest này', {
    en: 'Pause current running quest to prioritize this one'
  }],
  ['Chưa có tài khoản nào được xác thực để tải danh sách Quest.', {
    en: 'No verified account available to load Quests.'
  }],
  ['Chưa có tài khoản nào được kết nối!', {
    en: 'No account connected yet!'
  }],
  ['Cần kết nối tài khoản trước', {
    en: 'Please connect an account first'
  }],
  ['Đã dừng toàn bộ hàng đợi tự động.', { en: 'Stopped all queued automation.' }],
  ['Bắt đầu chạy lần lượt theo hàng đợi', { en: 'Started sequential queue runner' }],
  ['Đã dừng hàng đợi', { en: 'Queue stopped' }],
  ['Tài khoản đã đạt cấp tối đa cho cả 2 huy hiệu!', { en: 'Account has already maxed out both badges!' }],
  ['Huy hiệu Thời gian chơi đã đạt tối đa, vui lòng chọn Trò chơi đa dạng!', { en: 'Game Time is maxed! Please select Game Variety.' }],
  ['Huy hiệu Trò chơi đa dạng đã đạt tối đa, vui lòng chọn Thời gian chơi!', { en: 'Game Variety is maxed! Please select Game Time.' }],
  ['Không thể tải danh sách game từ Discord', { en: 'Failed to load game catalog from Discord' }],
  ['Discord đồng bộ huy hiệu ngầm (có thể mất vài phút đến vài giờ).', { en: 'Discord syncs badges asynchronously (may take minutes to hours).' }],
  ['Token không hợp lệ hoặc đã hết hạn!', { en: 'Invalid or expired Token!' }],
  ['ID Quest không hợp lệ (phải là dãy số Snowflake Discord)', { en: 'Invalid Quest ID (must be a Discord Snowflake ID)' }],
  ['Chưa nhập Link hoặc ID Quest Discord', { en: 'Please enter a Discord Quest Link or ID' }],
  ['Không thể đồng bộ Quest từ Discord', { en: 'Unable to sync Quests from Discord' }],
  ['Lỗi kết nối khi đồng bộ Quest', { en: 'Network error while syncing Quests' }],
  ['Chưa có mã quà hoặc quest chưa hoàn tất', { en: 'No gift code available or quest not completed yet' }],
  ['Không tìm thấy Discord Token', { en: 'Discord Token not found' }],
  ['Đang xác thực với Discord...', { en: 'Verifying with Discord...' }],
  ['Đang kiểm tra IP mạng...', { en: 'Checking network IP...' }],
  ['Bấm để kiểm tra lại', { en: 'Click to re-check' }],
  ['Không lấy được IP', { en: 'IP unavailable' }],
  ['Mạng nhà', { en: 'Home Network' }],
  ['Chưa nhập Token!', { en: 'Please enter a Token!' }],

  // Settings & Modals short labels
  ['Tự động chuyển tiếp (Auto Next)', { en: 'Auto Next Quest' }],
  ['Tự động tham gia Quest (Auto Enroll)', { en: 'Auto Enroll Quest' }],
  ['Ngẫu nhiên độ trễ (Random Jitter)', { en: 'Random Jitter' }],
  ['Chu kỳ gửi tiến trình Chơi Game', { en: 'Game Heartbeat Interval' }],
  ['Chu kỳ gửi tiến trình Video', { en: 'Video Progress Interval' }],
  ['Cài Đặt Màn Hình Chính & Chia Sẻ', { en: 'Home Screen & Sharing' }],
  ['Thêm vào màn hình chính (PWA)', { en: 'Add to Home Screen (PWA)' }],
  ['📌 Hướng dẫn ghim ra màn hình chính:', { en: '📌 How to pin to Home Screen:' }],
  ['Tự Động Hóa Nhiệm Vụ', { en: 'Quest Automation' }],
  ['Tần Suất & Tiến Trình', { en: 'Intervals & Progress' }],
  ['Đang tải danh mục huy hiệu từ Discord...', { en: 'Loading badge directory from Discord...' }],
  ['Tài khoản này chưa có dữ liệu Danh Mục Huy Hiệu từ Discord.', { en: 'No badge directory data available for this account.' }],
  ['Tài khoản này chưa mở khóa huy hiệu nào.', { en: 'This account has not unlocked any badges yet.' }],
  ['Mở Chạy Huy Hiệu ➔', { en: 'Open Badge Runner ➔' }],
  ['Chạy huy hiệu Trò chơi đa dạng ➔', { en: 'Run Game Variety Badge ➔' }],
  ['Chạy huy hiệu Thời gian chơi ➔', { en: 'Run Game Time Badge ➔' }],
  ['Huy hiệu của bạn', { en: 'Your Badges' }],
  ['Có thể mở khóa', { en: 'Available to Unlock' }],
  ['Tiến trình của bạn', { en: 'Your Progress' }],
  ['Huy Hiệu Kiểu Cũ', { en: 'Legacy Badge' }],
  ['Chưa được mở khóa', { en: 'Locked' }],
  ['Đã mở khóa', { en: 'Unlocked' }],
  ['Rời HypeSquad', { en: 'Leave HypeSquad' }],
  ['Lấy huy hiệu', { en: 'Claim Badge' }],
  ['Đang sở hữu', { en: 'Owned' }],
  ['Huy hiệu trên hồ sơ', { en: 'Profile Badges' }],
  ['Xem tất cả huy hiệu', { en: 'View All Badges' }],
  ['Xem danh mục huy hiệu có thể mở khóa', { en: 'View unlockable badges directory' }],
  ['Trang chủ Nhiệm Vụ', { en: 'Quests Home' }],
  ['Cửa Hàng Orb', { en: 'Orbs Shop' }],
  ['Nhận Nitro', { en: 'Get Nitro' }],
  ['Nâng cấp một máy chủ', { en: 'Boost a Server' }],
  ['Tặng Quà', { en: 'Send a Gift' }],
  ['Quả Cảm', { en: 'Bravery' }],
  ['Lỗi Lạc', { en: 'Brilliance' }],
  ['Cân Bằng', { en: 'Balance' }],
  ['Chưa chọn tài khoản', { en: 'No account selected' }],
  ['Tính năng đang khóa', { en: 'Feature Locked' }],
  ['Đến mục Tài khoản ngay', { en: 'Go to Accounts' }],
  ['Chưa có nhiệm vụ trong hàng đợi', { en: 'No Quests Loaded' }],
  ['Quét Quest Ngay', { en: 'Scan Quests Now' }],
  ['Không có hạn', { en: 'No expiry' }],
  ['Không rõ hạn', { en: 'Unknown expiry' }],
  ['Chưa có tài khoản Discord nào', { en: 'No Discord Accounts' }],
  ['Chưa có nhiệm vụ có mã quà', { en: 'No Gift Code Quests' }],
  ['Quét Nhiệm Vụ Ngay', { en: 'Scan Quests Now' }],
  ['Lấy Mã trên Discord', { en: 'Claim Code on Discord' }],
  ['Xem trên Discord', { en: 'View on Discord' }],
  ['Lấy Mã Thất Bại', { en: 'Failed to Fetch Code' }],
  ['Chờ lấy mã', { en: 'Ready to Claim Code' }],
  ['Đã nhận mã', { en: 'Code Claimed' }],
  ['Còn hạn dùng', { en: 'Valid' }],
  ['Đã chép', { en: 'Copied' }],
  ['+ Thêm & Check Token', { en: '+ Add & Verify Token' }],
  ['Mặc định', { en: 'Defaults' }],
  ['Lưu Cài Đặt', { en: 'Save Settings' }],
  ['Thêm vào MH chính', { en: 'Add to Home Screen' }],
  ['Chia sẻ', { en: 'Share' }],
  ['Kiểm Tra', { en: 'Verify' }],
  ['Hủy', { en: 'Cancel' }],
  ['Sao chép', { en: 'Copy' }],
  ['Đã sao chép', { en: 'Copied' }],
  ['Thêm & Quét Ngay', { en: 'Add & Scan Now' }],
  ['Thu gọn', { en: 'Collapse' }],
  ['Hệ thống sẵn sàng', { en: 'System Ready' }],
  ['Quét Nhiệm Vụ', { en: 'Scan Quests' }],
  ['Thêm Token', { en: 'Add Token' }],
  ['NHIỆM VỤ KHẢ DỤNG', { en: 'AVAILABLE QUESTS' }],
  ['Sẵn sàng thực hiện', { en: 'Ready to run' }],
  ['TIẾN TRÌNH CHẠY', { en: 'RUNNING TASKS' }],
  ['Đang hoạt động', { en: 'Active' }],
  ['Chưa chạy', { en: 'Idle' }],
  ['MÃ QUÀ ĐÃ NHẬN', { en: 'CLAIMED CODES' }],
  ['Gift Codes trong kho', { en: 'Gift Codes in vault' }],
  ['SỐ DƯ ORBS', { en: 'ORBS BALANCE' }],
  ['Tích lũy từ Discord', { en: 'Earned from Discord' }],
  ['Nhiệm Vụ Đang Mở', { en: 'Open Quests' }],
  ['Xem tất cả', { en: 'View all' }],
  ['Tài Khoản Discord', { en: 'Discord Account' }],
  ['Đã kết nối', { en: 'Connected' }],
  ['Chưa kết nối', { en: 'Disconnected' }],
  ['Chưa kết nối tài khoản', { en: 'No account connected' }],
  ['Nhiệm vụ xong', { en: 'Quests done' }],
  ['Quản lý tài khoản', { en: 'Manage accounts' }],
  ['Nhật Ký Hoạt Động Trực Tiếp', { en: 'Live Activity Logs' }],
  ['Mở Console', { en: 'Open Console' }],
  ['Hệ thống Discord Quest đã sẵn sàng kết nối.', { en: 'Discord Quest system is ready to connect.' }],
  ['Tài khoản', { en: 'Account' }],
  ['Nhiệm vụ', { en: 'Quest' }],
  ['Số dư Orbs', { en: 'Orbs Balance' }],
  ['Đã xong', { en: 'Completed' }],
  ['Thao tác', { en: 'Actions' }],
  ['Hình thức', { en: 'Type' }],
  ['Phần thưởng', { en: 'Reward' }],
  ['Hết hạn', { en: 'Expires' }],
  ['Tiến trình', { en: 'Progress' }],
  ['Còn lại', { en: 'Remaining' }],
  ['Loại quà', { en: 'Reward Type' }],
  ['Trạng thái', { en: 'Status' }],
  ['Mã Code', { en: 'Gift Code' }],
  ['Xem Video (Mobile)', { en: 'Watch Video (Mobile)' }],
  ['Xem Video', { en: 'Watch Video' }],
  ['Chơi trên PC', { en: 'Play on PC' }],
  ['Stream trên PC', { en: 'Stream on PC' }],
  ['Xem Livestream', { en: 'Watch Stream' }],
  ['Chơi Mobile', { en: 'Play Mobile' }],
  ['Hoạt động Discord', { en: 'Discord Activity' }],
  ['Nhiệm vụ Discord', { en: 'Discord Quest' }],
  ['Chờ nhận', { en: 'Pending' }],
  ['Trong hàng đợi', { en: 'Queued' }],
  ['Đang chạy', { en: 'Running' }],
  ['Hoàn thành', { en: 'Completed' }],
  ['Đã nhận', { en: 'Claimed' }],
  ['Tạm dừng', { en: 'Pause' }],
  ['Nhận thưởng', { en: 'Claim' }],
  ['Nhận quà', { en: 'Claim' }],
  ['Mở trên Discord', { en: 'Open on Discord' }],
  ['Chưa làm', { en: 'Not Started' }],
  ['Thử lại', { en: 'Retry' }],
  ['Đang quét...', { en: 'Scanning...' }],
  ['Đang lấy...', { en: 'Fetching...' }],
  ['Đang gửi...', { en: 'Sending...' }],
  ['Cấu Hình Chạy', { en: 'Run Configuration' }],
  ['Chế độ', { en: 'Mode' }],
  ['Cả hai', { en: 'Both' }],
  ['Giờ chơi + Số game', { en: 'Hours + Games' }],
  ['Mốc 5.000+ giờ', { en: '5,000+ Hours Tier' }],
  ['Mốc 100+ game', { en: '100+ Games Tier' }],
  ['Thời gian chơi', { en: 'Game Time' }],
  ['Trò chơi đa dạng', { en: 'Game Variety' }],
  ['Số lượng game', { en: 'Game Count' }],
  ['Số giờ mỗi game', { en: 'Hours Per Game' }],
  ['Kho game', { en: 'Catalog' }],
  ['Đã lọc', { en: 'Filtered' }],
  ['Tổng giờ', { en: 'Total Hours' }],
  ['Bắt đầu chạy', { en: 'Start Running' }],
  ['Tiến Trình & Nhật Ký', { en: 'Progress & Logs' }],
  ['Đã xử lý:', { en: 'Processed:' }],
  ['Sẵn sàng. Chọn chế độ và bấm Bắt đầu.', {
    en: 'Ready. Select a mode and click Start Running.'
  }],
  // Playtime Tiers
  ['Người dùng thử', { en: 'Sampler' }],
  ['Người chơi qua', { en: 'Dabbler' }],
  ['Người đam mê', { en: 'Enthusiast' }],
  ['Trinh Sát', { en: 'Scout' }],
  ['Người khám phá', { en: 'Explorer' }],
  ['Nhà Thám Hiểm', { en: 'Adventurer' }],
  ['Nhà du hành', { en: 'Voyager' }],
  ['Người khác biệt', { en: 'Distinct' }],
  ['Người đa tài', { en: 'Versatile' }],
  ['Thuyết phổ quát', { en: 'Universalist' }],
  ['Giải Trí', { en: 'Recreational' }],
  ['Giải trí', { en: 'Amateur' }],
  ['Gắn bó', { en: 'Regular' }],
  ['Tâm huyết', { en: 'Passionate' }],
  ['Nghiêm túc', { en: 'Serious' }],
  ['Tận hiến', { en: 'Devoted' }],
  ['Lão luyện', { en: 'Veteran' }],
  ['Sắt đá', { en: 'Hardcore' }],
  ['Kiên định', { en: 'Resolute' }],
  ['Vĩnh cửu', { en: 'Eternal' }],
  // Rarity & Modals
  ['Huyền thoại', { en: 'Mythic' }],
  ['Cực hiếm', { en: 'Ultra Rare' }],
  ['Sử thi', { en: 'Epic' }],
  ['Hiếm', { en: 'Rare' }],
  ['Thêm & Xác Thực Token Discord', { en: 'Add & Verify Discord Token' }],
  ['Lấy token ở đâu?', { en: 'Where to find token?' }],
  ['Dán token tại đây...', { en: 'Paste token here...' }],
  ['Cách 1: Chạy Console (Nhanh nhất – 1 click):', { en: 'Method 1: Console Script (Fastest – 1 click):' }],
  ['Cách 2: Lấy qua Network (Thủ công):', { en: 'Method 2: Network Tab (Manual):' }],
  ['Thêm Nhiệm Vụ Bằng Link / ID', { en: 'Add Quest by Link / ID' }],
  ['Link hoặc ID Quest Discord', { en: 'Discord Quest Link or ID' }],
  ['[Đồng bộ]', { en: '[Sync]' }],
  ['[Hàng đợi]', { en: '[Queue]' }],
  ['[Huy hiệu]', { en: '[Badges]' }],
  ['[Mã quà]', { en: '[Rewards]' }],
  ['[Bắt đầu]', { en: '[Start]' }],
  ['[Tạm dừng]', { en: '[Pause]' }],
  ['[Cài đặt]', { en: '[Settings]' }],
  ['[Thêm Quest]', { en: '[Add Quest]' }],
  ['[HỆ THỐNG]', { en: '[SYSTEM]' }],
  ['Đang quét danh sách nhiệm vụ...', { en: 'Scanning quest list...' }],
  ['Đã dừng theo yêu cầu.', { en: 'Stopped by user request.' }],
  ['Đang yêu cầu dừng sau đợt gửi hiện tại...', { en: 'Stopping after current batch...' }],
  ['Đã làm mới dữ liệu huy hiệu từ Discord.', { en: 'Refreshed badge data from Discord.' }],
  ['Đã khôi phục cài đặt mặc định!', { en: 'Restored default settings!' }],
  ['Đã lưu cài đặt hệ thống!', { en: 'System settings saved!' }],
  ['Đã tạm dừng quest', { en: 'Quest paused' }],
  ['Chạy', { en: 'Run' }],
  ['Xong', { en: 'Done' }],
  ['Chuyển', { en: 'Switch' }],
  ['Xóa', { en: 'Delete' }],
  ['Dừng', { en: 'Stop' }],
  ['giây', { en: 'sec' }]
];

function detectBrowserLang() {
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || navigator.userLanguage || 'en'];

  for (const raw of candidates) {
    const code = String(raw || '').toLowerCase().split('-')[0];
    if (SUPPORTED_LANGS.includes(code)) return code;
  }
  return 'en';
}

function getAppLang() {
  try {
    const saved = localStorage.getItem(I18N_STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {}
  return detectBrowserLang();
}

window.t = function(key, vars) {
  const lang = getAppLang();
  let str = I18N_DICT[lang]?.[key] || I18N_DICT.en[key] || I18N_DICT.vi[key] || key;
  if (vars && typeof vars === 'object') {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
};

/**
 * Dịch tự động chuỗi tiếng Việt (log, toast, nội dung render động) sang ngôn ngữ hiện tại.
 */
window.translateDynamicText = function(text) {
  const lang = getAppLang();
  if (!text || lang === 'vi') return text;

  const raw = String(text);
  const leadingSpace = /^\s/.test(raw) ? ' ' : '';
  const trailingSpace = /\s$/.test(raw) ? ' ' : '';
  let out = raw.replace(/\s+/g, ' ').trim();
  if (!out) return raw;

  const regexRules = [
    [/^(\[.*?\])?\s*Gửi GET \/api\/quests \((.+?)\)\.\.\.$/, { en: '$1 Sending GET /api/quests ($2)...' }],
    [/^(\[.*?\])?\s*Đã tải (\d+) Quest & ([\d.,]+) Orbs từ Discord\.$/, { en: '$1 Loaded $2 Quests & $3 Orbs from Discord.' }],
    [/^Đã đồng bộ (\d+) quest từ Discord!$/, { en: 'Synced $1 quests from Discord!' }],
    [/^(\[.*?\])?\s*Thất bại: (.+)$/, { en: '$1 Failed: $2' }],
    [/^(\[.*?\])?\s*Lỗi mạng: (.+)$/, { en: '$1 Network error: $2' }],
    [/^Kết nối với IP: (.+)$/, { en: 'Connected with IP: $1' }],
    [/^IP Mạng: (.+?) \(Bấm để kiểm tra lại\)$/, { en: 'Network IP: $1 (Click to re-check)' }],
    [/^Đã cập nhật IP: (.+)$/, { en: 'Updated IP: $1' }],
    [/^Xác thực thành công tài khoản (@\S+) \((.+?)\)\.$/, { en: 'Verified account $1 ($2).' }],
    [/^Xác thực thành công: (@\S+)$/, { en: 'Verified: $1' }],
    [/^Đã cập nhật Token cho (@\S+)\.$/, { en: 'Updated Token for $1.' }],
    [/^Đã cập nhật Token: (@\S+)$/, { en: 'Token updated: $1' }],
    [/^(\[.*?\])?\s*Tự động xác thực phiên: (@\S+)$/, { en: '$1 Auto-verifying session: $2' }],
    [/^(\[.*?\])?\s*Phiên của (@\S+) đã hết hạn\. Đã tự động đăng xuất\.$/, { en: '$1 Session for $2 expired. Auto logged out.' }],
    [/^Phiên của (@\S+) đã hết hạn\.$/, { en: 'Session for $1 expired.' }],
    [/^Bắt đầu chạy: (.+)$/, { en: 'Started: $1' }],
    [/^(\[.*?\])?\s*Đã kích hoạt chạy "(.+)"\.$/, { en: '$1 Started "$2".' }],
    [/^(\[.*?\])?\s*Đã tạm dừng "(.+)"\.$/, { en: '$1 Paused "$2".' }],
    [/^(\[.*?\])?\s*Bắt đầu chạy nhiệm vụ đầu tiên: "(.+)"\.\.\.$/, { en: '$1 Starting first quest: "$2"...' }],
    [/^Đã sao chép mã: (.+)$/, { en: 'Copied code: $1' }],
    [/^Lấy mã thành công: (.+)$/, { en: 'Code claimed: $1' }],
    [/^(\[.*?\])?\s*Đã lấy mã cho quest "(.+)": (.+)$/, { en: '$1 Claimed code for "$2": $3' }],
    [/^Đang cày \((\d+%)\)$/, { en: 'Running ($1)' }],
    [/^Hàng chờ #(\d+)$/, { en: 'Queue #$1' }],
    [/^Bắt đầu cày (\d+) game mới \(đã lọc (\d+) game từng chạy\)\.\.\.$/, { en: 'Starting $1 fresh games ($2 already-played filtered out)...' }],
    [/^Bắt đầu cày (\d+) game \((\d+) game mới, (\d+) game bổ sung\)\.\.\.$/, { en: 'Starting $1 games ($2 fresh, $3 fallback)...' }],
    [/^Bắt đầu cày (\d+) game\.\.\.$/, { en: 'Starting $1 games...' }],
    [/^\[(\d+)\/(\d+)\] Hoàn tất: (.+)$/, { en: '[$1/$2] Completed: $3' }],
    [/^Hoàn tất cày (\d+) game(.*)!$/, { en: 'Finished $1 games$2!' }],
    [/^Hoàn tất (\d+) game(.*)\. Discord đồng bộ huy hiệu ngầm \(có thể mất vài phút đến vài giờ\)\.$/, { en: 'Completed $1 games$2. Discord syncs badges asynchronously (may take minutes to hours).' }],
    [/^Bị giới hạn tốc độ, tạm chờ (\d+)s\.\.\.$/, { en: 'Rate limited, waiting $1s...' }],
    [/^(\d+) đang chạy • (\d+) trong hàng đợi • (\d+)\/(\d+) xong$/, { en: '$1 running • $2 queued • $3/$4 done' }],
    [/^Còn thiếu:\s*(.+)$/, { en: 'Remaining: $1' }],
    [/^Mốc cuối \((.+)\)$/, { en: 'Max ($1)' }],
    [/^Còn (\d+)\/(\d+) nhiệm vụ$/, { en: '$1/$2 left' }],
    [/^(\d+)\/(\d+) nhiệm vụ$/, { en: '$1/$2 quests' }],
    [/^Đã mở khóa (\d+\/\d+\/\d+)$/, { en: 'Unlocked $1' }],
    [/^Bấm để xem tất cả huy hiệu \((\d+)\)$/, { en: 'Click to view all badges ($1)' }],
    [/^Tất cả các mốc (.+?) \((\d+) Cấp\):$/, { en: 'All $1 Tiers ($2 Levels):' }],
    [/^([\d.,]+)\s*giờ$/, { en: '$1 hrs' }],
    [/^(\d+\+?)\s*trò chơi$/, { en: '$1 games' }],
    [/^(\d+\+?)\s*giờ$/, { en: '$1 hrs' }],
    [/^(\d+)\s*\/\s*(\d+)\s*game$/, { en: '$1 / $2 games' }],
    [/^\+(\d+(?:\.\d+)?)\s*giờ$/, { en: '+$1 hrs' }]
  ];

  for (const [re, map] of regexRules) {
    if (re.test(out) && map[lang]) {
      out = out.replace(re, map[lang]).trim();
    }
  }

  for (const [viStr, map] of PHRASE_MAP) {
    if (out.includes(viStr) && map[lang]) {
      out = out.split(viStr).join(map[lang]);
    }
  }

  return `${leadingSpace}${out}${trailingSpace}`;
};

/**
 * Quét và dịch toàn bộ text node + placeholder/title bên trong một container DOM.
 */
window.translateDomTree = function(root) {
  const lang = getAppLang();
  if (!root || lang === 'vi') return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE') return NodeFilter.FILTER_REJECT;
      if (parent.hasAttribute('data-i18n') || parent.hasAttribute('data-i18n-html')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  for (const textNode of nodes) {
    const orig = textNode.nodeValue;
    const translated = window.translateDynamicText(orig);
    if (translated !== orig) textNode.nodeValue = translated;
  }

  root.querySelectorAll('[placeholder], [title]').forEach(el => {
    if (el.hasAttribute('placeholder')) {
      const p = el.getAttribute('placeholder');
      const tp = window.translateDynamicText(p);
      if (tp !== p) el.setAttribute('placeholder', tp);
    }
    if (el.hasAttribute('title') && !el.hasAttribute('data-i18n-title')) {
      const ttl = el.getAttribute('title');
      const tttl = window.translateDynamicText(ttl);
      if (tttl !== ttl) el.setAttribute('title', tttl);
    }
  });
};

window.applyI18n = function() {
  const lang = getAppLang();
  document.documentElement.lang = lang;

  const sel = document.getElementById('lang-switcher');
  if (sel && sel.value !== lang) sel.value = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = window.t(key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = window.t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = window.t(key);
  });

  window.translateDomTree(document.body);
};

window.setAppLang = function(lang) {
  const next = SUPPORTED_LANGS.includes(lang) ? lang : detectBrowserLang();
  try {
    localStorage.setItem(I18N_STORAGE_KEY, next);
  } catch {}
  if (next === 'vi') {
    window.location.reload();
    return;
  }
  window.applyI18n();
  if (typeof renderAll === 'function') renderAll();
};
