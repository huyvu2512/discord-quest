/**
 * INTERNATIONALIZATION (i18n) UTILITY (js/utils/i18n.js)
 * Tự động nhận diện ngôn ngữ trình duyệt và hỗ trợ dịch toàn bộ giao diện + log.
 */

const I18N_STORAGE_KEY = 'dq_lang_v1';
const SUPPORTED_LANGS = ['vi', 'en', 'ja', 'ko', 'zh'];

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
  },
  ja: {
    stat_done: '完了:',
    stat_balance: '残高:',
    btn_scan: 'クエスト取得',
    btn_reload: '再読み込み',
    btn_run_all: 'すべて実行',
    btn_stop_all: '停止',
    share_title: 'アプリを共有 / ホーム画面に追加',
    lang_title: '表示言語を切り替え',
    nav_home: 'ホーム',
    nav_accounts: 'アカウント',
    nav_quests: 'クエスト',
    nav_rewards: '報酬コード',
    nav_badges: 'バッジ取得',
    nav_playtime: 'バッジ実行',
    nav_logs: 'ログ',
    nav_settings: '設定',
    nav_more: 'その他',
    page_accounts_title: 'アカウント管理',
    page_accounts_sub: 'Discordトークンを入力・検証してクエストスキャンを開始します。',
    page_quests_title: 'クエスト',
    page_quests_sub: '進行中または報酬受け取り待ちのクエスト一覧。',
    page_rewards_title: 'ギフトコード & 報酬',
    page_rewards_sub: 'Discordおよびパートナークエストから取得したギフトコード一覧。',
    page_badges_title: 'Discordバッジ取得',
    page_badges_sub: 'HypeSquadハウスバッジの取得・変更やプロフィールバッジを確認します。',
    page_playtime_title: 'ゲームバッジ実行',
    page_playtime_sub: '選択中のアカウントでプレイ時間・ゲーム数バッジを強化します。',
    page_logs_title: 'リクエストログ',
    page_logs_sub: 'Discord APIリクエストとバックグラウンド進捗の履歴。',
    page_settings_title: 'システム設定',
    page_settings_sub: '自動化、送信間隔、アカウント保護の設定をカスタマイズします。',
    log_all: 'すべてのログ',
    log_download: 'ログ保存',
    log_download_title: 'すべてのログを .txt としてダウンロード',
    log_empty: 'フィルター [{lvl}] に一致するログはありません。',
    log_empty_export: 'ダウンロードできるログがありません！',
    log_empty_filter_export: 'フィルター [{lvl}] に一致するログがありません！',
    log_export_title: 'DISCORD QUEST TOOL - リクエストログ',
    log_export_time: '出力日時: {time}',
    log_export_level: 'レベルフィルター: {lvl}',
    log_export_total: '合計イベント数: {count}',
    pwa_ios_guide: '• <strong>iPhone / iPad (iOS Safari):</strong> 下部の <strong>共有</strong> アイコンをタップ ➔ <strong>「ホーム画面に追加」</strong> を選択します。',
    pwa_android_guide: '• <strong>Android (Chrome):</strong> 右上の <strong>メニュー (⋮)</strong> をタップ ➔ <strong>「アプリをインストール」</strong> または <strong>「ホーム画面に追加」</strong> を選択します。',
    token_guide_console_desc: 'Discord Webを開き、<code>F12</code> ➔ <strong>Console</strong> タブ ➔ 以下を貼り付け:',
    token_guide_net_1: 'Discordで <code>F12</code> ➔ <strong>Network</strong> タブ ➔ <code>api/</code> でフィルター',
    token_guide_net_2: '任意のリクエストをクリック ➔ <strong>Headers</strong> ➔ <strong>authorization:</strong> の値をコピー',
    quest_modal_hint: '💡 <strong>ヒント:</strong> Discordのクエストカードの (•••) ➔ <strong>「リンクをコピー」</strong> してここに貼り付けると即座にスキャンできます！'
  },
  ko: {
    stat_done: '완료:',
    stat_balance: '잔액:',
    btn_scan: '퀘스트 스캔',
    btn_reload: '새로고침',
    btn_run_all: '모두 실행',
    btn_stop_all: '중지',
    share_title: '앱 공유 / 홈 화면에 추가',
    lang_title: '인터페이스 언어 변경',
    nav_home: '홈',
    nav_accounts: '계정',
    nav_quests: '퀘스트',
    nav_rewards: '보상 코드',
    nav_badges: '배지 받기',
    nav_playtime: '배지 실행',
    nav_logs: '로그',
    nav_settings: '설정',
    nav_more: '더보기',
    page_accounts_title: '계정 관리',
    page_accounts_sub: 'Discord 토큰을 입력하고 인증하여 퀘스트 스캔을 시작하세요.',
    page_quests_title: '퀘스트',
    page_quests_sub: '진행 중이거나 보상 수령 대기 중인 퀘스트 목록입니다.',
    page_rewards_title: '기프트 코드 & 보상',
    page_rewards_sub: 'Discord 및 파트너 퀘스트에서 획득한 기프트 코드 목록입니다.',
    page_badges_title: 'Discord 배지 받기',
    page_badges_sub: 'HypeSquad 하우스 배지를 빠르게 변경하고 프로필 배지를 확인하세요.',
    page_playtime_title: '게임 배지 러너',
    page_playtime_sub: '선택한 계정의 플레이 시간 및 게임 다양성 배지를 올립니다.',
    page_logs_title: '요청 로그',
    page_logs_sub: 'Discord API 요청 이벤트 및 백그라운드 진행 기록입니다.',
    page_settings_title: '시스템 설정',
    page_settings_sub: '자동화, 전송 주기 및 계정 안전 옵션을 설정합니다.',
    log_all: '전체 로그',
    log_download: '로그 저장',
    log_download_title: '전체 로그를 .txt 파일로 다운로드',
    log_empty: '[{lvl}] 필터와 일치하는 로그가 없습니다.',
    log_empty_export: '다운로드할 로그가 없습니다!',
    log_empty_filter_export: '[{lvl}] 필터에 해당하는 로그가 없습니다!',
    log_export_title: 'DISCORD QUEST TOOL - 요청 콘솔 로그',
    log_export_time: '내보낸 시간: {time}',
    log_export_level: '레벨 필터: {lvl}',
    log_export_total: '총 이벤트 수: {count}',
    pwa_ios_guide: '• <strong>iPhone / iPad (iOS Safari):</strong> 하단의 <strong>공유</strong> 버튼을 누른 뒤 <strong>"홈 화면에 추가"</strong>를 선택하세요.',
    pwa_android_guide: '• <strong>Android (Chrome):</strong> 우측 상단 <strong>메뉴 (⋮)</strong> ➔ <strong>"앱 설치"</strong> 또는 <strong>"홈 화면에 추가"</strong>를 선택하세요.',
    token_guide_console_desc: 'Discord 웹을 열고 <code>F12</code> ➔ <strong>Console</strong> 탭에 아래 코드를 붙여넣으세요:',
    token_guide_net_1: 'Discord에서 <code>F12</code> ➔ <strong>Network</strong> 탭 ➔ <code>api/</code> 필터링',
    token_guide_net_2: '아무 요청 클릭 ➔ <strong>Headers</strong> ➔ <strong>authorization:</strong> 뒤의 값 복사',
    quest_modal_hint: '💡 <strong>팁:</strong> Discord 퀘스트 카드의 (•••) ➔ <strong>"링크 복사"</strong> 후 여기에 붙여넣으면 즉시 스캔됩니다!'
  },
  zh: {
    stat_done: '已完成:',
    stat_balance: '余额:',
    btn_scan: '扫描任务',
    btn_reload: '刷新页面',
    btn_run_all: '全部运行',
    btn_stop_all: '全部停止',
    share_title: '分享应用 / 添加到主屏幕',
    lang_title: '切换界面语言',
    nav_home: '首页',
    nav_accounts: '账号',
    nav_quests: '任务',
    nav_rewards: '礼品码',
    nav_badges: '获取徽章',
    nav_playtime: '刷徽章',
    nav_logs: '日志',
    nav_settings: '设置',
    nav_more: '更多',
    page_accounts_title: '账号管理',
    page_accounts_sub: '输入并验证 Discord Token 以开始扫描任务。',
    page_quests_title: '任务列表',
    page_quests_sub: '正在进行或等待领取奖励的任务。',
    page_rewards_title: '礼品码 & 奖励',
    page_rewards_sub: '来自 Discord 及合作任务的礼品码列表。',
    page_badges_title: '获取 Discord 徽章',
    page_badges_sub: '一键加入或切换 HypeSquad 徽章并查看个人资料徽章。',
    page_playtime_title: '游戏徽章助手',
    page_playtime_sub: '为当前账号提升游戏时长和游戏数量徽章等级。',
    page_logs_title: '请求日志',
    page_logs_sub: 'Discord API 请求与后台进度更新日志。',
    page_settings_title: '系统设置',
    page_settings_sub: '自定义自动化、心跳周期和账号安全选项。',
    log_all: '全部日志',
    log_download: '下载日志',
    log_download_title: '下载全部日志为 .txt 文件',
    log_empty: '没有符合 [{lvl}] 筛选条件的日志。',
    log_empty_export: '没有可下载的日志！',
    log_empty_filter_export: '没有符合 [{lvl}] 筛选条件的日志！',
    log_export_title: 'DISCORD QUEST TOOL - 请求控制台日志',
    log_export_time: '导出时间: {time}',
    log_export_level: '级别筛选: {lvl}',
    log_export_total: '事件总数: {count}',
    pwa_ios_guide: '• <strong>iPhone / iPad (iOS Safari):</strong> 点击底部 <strong>分享</strong> 按钮 ➔ 向下滑动选择 <strong>“添加到主屏幕”</strong>。',
    pwa_android_guide: '• <strong>Android (Chrome):</strong> 点击右上角 <strong>菜单 (⋮)</strong> ➔ 选择 <strong>“安装应用”</strong> 或 <strong>“添加到主屏幕”</strong>。',
    token_guide_console_desc: '打开 Discord 网页版，按 <code>F12</code> ➔ <strong>Console</strong> 标签页 ➔ 粘贴代码：',
    token_guide_net_1: '在 Discord 中按 <code>F12</code> ➔ 打开 <strong>Network</strong> 标签页 ➔ 筛选 <code>api/</code>',
    token_guide_net_2: '点击任意请求 ➔ 打开 <strong>Headers</strong> ➔ 复制 <strong>authorization:</strong> 后的内容',
    quest_modal_hint: '💡 <strong>提示：</strong> 在 Discord 任务卡片点击 (•••) ➔ 选择 <strong>“复制链接”</strong> 并粘贴到此处即可立即扫描！'
  }
};

// Sắp xếp cụm dài trước, ngắn sau để tránh thay thế chồng chéo
const PHRASE_MAP = [
  // Home Safety & Quick Steps Cards
  ['Cơ Chế Vận Hành An Toàn', { en: 'Safe Operation Mechanism', ja: '安全動作メカニズム', ko: '안전 작동 메커니즘', zh: '安全运行机制' }],
  ['Treo Tiến Độ Tự Động', { en: 'Auto Background Progress', ja: '自動バックグラウンド進行', ko: '자동 백그라운드 진행', zh: '全自动后台挂机进度' }],
  ['Tự động tính giờ chơi ngầm, không cần cài hay mở game', {
    en: 'Tracks playtime in background without installing or launching games',
    ja: 'ゲームをインストール・起動せずにバックグラウンドでプレイ時間を計測',
    ko: '게임을 설치하거나 실행하지 않고 백그라운드에서 플레이 시간 자동 누적',
    zh: '后台自动累计游戏时长，无需安装或打开游戏'
  }],
  ['Hàng Đợi Đơn Luồng', { en: 'Single-Thread Queue', ja: 'シングルスレッドキュー', ko: '단일 스레드 대기열', zh: '单线程队列' }],
  ['Chạy tuần tự 1 quest, chống rate-limit & ban', {
    en: 'Runs 1 quest at a time sequentially to avoid rate-limits & bans',
    ja: '1件ずつ順番に実行し、レート制限やBANを防止します',
    ko: '한 번에 1개씩 순차 실행하여 속도 제한 및 차단을 방지합니다',
    zh: '依次单线程运行任务，防速率限制与封号'
  }],
  ['Tự Động Claim Quà', { en: 'Auto Reward Tracking', ja: '自動報酬トラッキング', ko: '자동 보상 추적', zh: '自动领取追踪' }],
  ['Nhận Orbs & lưu mã Gift Code khi đạt 100%', {
    en: 'Sync Orbs & save Gift Codes upon reaching 100%',
    ja: '100%達成時にOrbs獲得＆ギフトコードを自動保存',
    ko: '100% 달성 시 Orbs 적립 및 기프트 코드 저장',
    zh: '达到 100% 时获取 Orbs 并保存礼品码'
  }],
  ['Bảo Mật Cục Bộ 100%', { en: '100% Local Security', ja: '100% ローカル保護', ko: '100% 로컬 보안', zh: '100% 本地安全' }],
  ['Token lưu trữ trong LocalStorage máy của bạn', {
    en: 'Tokens are stored strictly in your browser LocalStorage',
    ja: 'トークンはお使いのブラウザのLocalStorageにのみ保存されます',
    ko: '토큰은 사용자 브라우저의 LocalStorage에만 안전하게 저장됩니다',
    zh: 'Token 仅保存在您本地浏览器的 LocalStorage 中'
  }],
  ['3 Bước Thao Tác Nhanh', { en: '3 Quick Steps', ja: '3ステップ・クイックガイド', ko: '3단계 빠른 시작', zh: '3 步快速开始' }],
  ['Thêm & kiểm tra Token Discord', { en: 'Add & verify Discord Token', ja: 'Discordトークンを追加・検証', ko: 'Discord 토큰 추가 및 확인', zh: '添加并验证 Discord Token' }],
  ['Bấm "Quét Quest" để tải dữ liệu', { en: 'Click "Scan Quests" to load data', ja: '「クエスト取得」をクリックしてデータを読み込む', ko: '"퀘스트 스캔"을 눌러 데이터 불러오기', zh: '点击“扫描任务”加载数据' }],
  ['Bấm "Chạy Tất Cả" để bắt đầu auto', { en: 'Click "Run All" to start automation', ja: '「すべて実行」をクリックして自動化を開始', ko: '"모두 실행"을 눌러 자동화 시작', zh: '点击“全部运行”开始自动挂机' }],
  ['Đang chọn', { en: 'Selected', ja: '選択中', ko: '선택됨', zh: '当前选中' }],
  ['Đăng xuất', { en: 'Log Out', ja: 'ログアウト', ko: '로그아웃', zh: '退出登录' }],
  ['Chọn', { en: 'Select', ja: '選択', ko: '선택', zh: '选择' }],
  ['Bảng điều khiển tự động cày nhiệm vụ Discord, tính giờ chơi ngầm, nhận Orbs và lưu mã Gift Code an toàn.', {
    en: 'Dashboard to automate Discord Quests, farm background playtime, earn Orbs, and safely store Gift Codes.',
    ja: 'Discordクエストの自動化、プレイ時間計測、Orbs獲得、ギフトコード管理を一括で行うダッシュボード。',
    ko: 'Discord 퀘스트 자동화, 백그라운드 플레이 시간 누적, Orbs 획득 및 기프트 코드 보관을 위한 대시보드.',
    zh: '自动化完成 Discord 任务、挂机累计游戏时长、获取 Orbs 并安全保存礼品码的控制台。'
  }],
  ['Tài khoản hiện tại chưa tải danh sách Quest từ Discord. Bấm nút bên dưới để quét danh sách nhiệm vụ thật.', {
    en: 'No quests loaded for this account yet. Click below to scan live quests from Discord.',
    ja: 'このアカウントのクエストはまだ読み込まれていません。下のボタンでDiscordからスキャンしてください。',
    ko: '현재 계정의 퀘스트 목록이 없습니다. 아래 버튼을 눌러 Discord에서 스캔하세요.',
    zh: '当前账号尚未加载任务列表。点击下方按钮从 Discord 扫描任务。'
  }],
  ['Khi tài khoản có nhiệm vụ tặng Gift Code (Roblox, Apex, Star Wars, NBA...), nhiệm vụ sẽ xuất hiện tại đây để bạn bấm lấy mã.', {
    en: 'When your account has quests awarding Gift Codes (Roblox, Apex, Star Wars, NBA...), they will appear here.',
    ja: 'ギフトコード付きのクエスト（Roblox、Apex、Star Warsなど）があるとここに表示されます。',
    ko: '기프트 코드를 주는 퀘스트(Roblox, Apex, Star Wars 등)가 있으면 여기에 표시됩니다.',
    zh: '当账号有赠送礼品码的任务（Roblox、Apex、Star Wars 等）时，会显示在此处供领取。'
  }],
  ['Bạn cần thêm và xác thực ít nhất 1 Token tài khoản Discord để mở khóa các mục Tiến độ, Quests và Quà tặng.', {
    en: 'Add and verify at least 1 Discord account token to unlock Progress, Quests, and Rewards.',
    ja: '進捗・クエスト・報酬機能を利用するには、少なくとも1つのDiscordトークンを追加して検証してください。',
    ko: '진행률, 퀘스트 및 보상 기능을 사용하려면 최소 1개의 Discord 토큰을 추가하고 인증하세요.',
    zh: '请至少添加并验证 1 个 Discord 账号 Token 以解锁进度、任务与礼品码功能。'
  }],
  ['Đang có tiến trình cày huy hiệu Playtime! Vui lòng dừng Playtime trước khi chạy Quest.', {
    en: 'Playtime runner is active! Please stop Playtime before running Quests.',
    ja: 'プレイ時間バッジ実行が稼働中です！クエスト実行前に停止してください。',
    ko: '플레이 시간 배지 실행이 진행 중입니다! 퀘스트 실행 전 중지해주세요.',
    zh: '正在运行游戏时长徽章助手！请先停止后再运行任务。'
  }],
  ['[Quest] Không thể chạy: Tiến trình cày huy hiệu Playtime đang chạy song song.', {
    en: '[Quest] Cannot start: Playtime badge runner is currently active.',
    ja: '[Quest] 開始できません: プレイ時間バッジ実行が稼働中です。',
    ko: '[Quest] 실행 불가: 플레이 시간 배지 러너가 실행 중입니다.',
    zh: '[Quest] 无法启动：游戏时长徽章助手正在并行运行。'
  }],
  ['Tự động chuyển sang nhiệm vụ tiếp theo trong hàng đợi khi đạt 100%.', {
    en: 'Automatically advance to the next queued quest upon reaching 100%.',
    ja: '100%達成時に次のキューのクエストへ自動で進みます。',
    ko: '100% 달성 시 대기열의 다음 퀘스트로 자동 이동합니다.',
    zh: '任务达到 100% 时自动切换至队列中的下一个任务。'
  }],
  ['Tự gửi yêu cầu ghi danh nhiệm vụ nếu tài khoản chưa bắt đầu.', {
    en: 'Automatically enroll in quests before sending progress.',
    ja: '未開始のクエストに自動で参加リクエストを送信します。',
    ko: '시작하지 않은 퀘스트에 자동으로 참여 요청을 보냅니다.',
    zh: '如果账号尚未开始，自动发送任务接取请求。'
  }],
  ['Khoảng nghỉ giữa các lần cập nhật xem video (Khuyến nghị: 7s).', {
    en: 'Delay between video watch progress updates (Recommended: 7s).',
    ja: '動画視聴進捗の更新間隔（推奨: 7秒）。',
    ko: '동영상 시청 진행률 업데이트 간격 (권장: 7초).',
    zh: '每次视频进度更新之间的间隔（建议: 7秒）。'
  }],
  ['Tần suất gửi heartbeat chơi game ngầm (Chuẩn Discord: 20s, khuyến nghị: 15-20s).', {
    en: 'Background game heartbeat frequency (Discord standard: 20s, recommended: 15-20s).',
    ja: 'バックグラウンドゲーム心拍の頻度（Discord標準: 20秒、推奨: 15〜20秒）。',
    ko: '백그라운드 게임 하트비트 주기 (Discord 표준: 20초, 권장: 15-20초).',
    zh: '后台游戏心跳发送频率（Discord 标准: 20秒，建议: 15-20秒）。'
  }],
  ['Lệch ngẫu nhiên ±1-3 giây để giả lập người thật, tránh pattern máy móc.', {
    en: 'Add ±1–3s random variance to mimic real human activity.',
    ja: '±1〜3秒のランダムな揺らぎを追加し機械的なパターンを回避します。',
    ko: '±1~3초의 무작위 지연을 추가해 실제 사용자처럼 동작합니다.',
    zh: '增加 ±1-3 秒随机偏差以模拟真人操作，避免机械规律。'
  }],
  ['Mở web dạng app độc lập, full màn hình với logo Discord Quest chính chủ.', {
    en: 'Launch as a standalone fullscreen app with the official Discord Quest icon.',
    ja: '公式ロゴ付きの独立した全画面アプリとして起動します。',
    ko: '공식 로고가 포함된 독립형 전체 화면 앱으로 실행합니다.',
    zh: '以独立全屏应用模式打开，带官方 Discord Quest 图标。'
  }],
  ['Thêm ứng dụng ra màn hình chính điện thoại (Android & iOS)', {
    en: 'Install web app to mobile Home Screen (Android & iOS)',
    ja: 'スマホのホーム画面にアプリとして追加 (Android & iOS)',
    ko: '모바일 홈 화면에 앱 추가 (Android & iOS)',
    zh: '将应用添加到手机主屏幕 (Android & iOS)'
  }],
  ['Điều chỉnh chu kỳ gửi tiến trình để mô phỏng tự nhiên', {
    en: 'Adjust heartbeat intervals for natural simulation',
    ja: '自然な進行を再現するため送信間隔を調整します',
    ko: '자연스러운 시뮬레이션을 위해 전송 주기를 조정합니다',
    zh: '调整进度上报周期以自然模拟'
  }],
  ['Cơ chế tự động đăng ký và nhận phần thưởng', {
    en: 'Auto-enrollment and queue progression',
    ja: '自動参加とキュー進行設定',
    ko: '자동 등록 및 대기열 진행 설정',
    zh: '自动接取与队列推进机制'
  }],
  ['Chọn nhà HypeSquad yêu thích để gắn hoặc đổi huy hiệu trực tiếp trên hồ sơ Discord.', {
    en: 'Pick a HypeSquad House to claim or switch the badge directly on your Discord profile.',
    ja: '好きなHypeSquadハウスを選択してDiscordプロフィールにバッジを付与・変更します。',
    ko: '원하는 HypeSquad 하우스를 선택해 Discord 프로필에 배지를 바로 장착하거나 변경하세요.',
    zh: '选择喜欢的 HypeSquad 学院，一键在 Discord 个人资料中领取或切换徽章。'
  }],
  ['Dũng cảm, quyết đoán và không bao giờ chùn bước trước thử thách.', {
    en: 'Brave, decisive, and never backing down from a challenge.',
    ja: '勇敢で決断力があり、どんな挑戦にもひるみません。',
    ko: '용감하고 결단력 있으며 어떤 도전 앞에서도 물러서지 않습니다.',
    zh: '勇敢果断，面对任何挑战绝不退缩。'
  }],
  ['Sáng tạo, đầy ý tưởng đột phá và tham vọng bền bỉ.', {
    en: 'Creative, full of breakthrough ideas, and relentlessly ambitious.',
    ja: '創造的で革新的なアイデアと揺るぎない野心に満ちています。',
    ko: '창의적이고 혁신적인 아이디어와 끈기 있는 야망이 넘칩니다.',
    zh: '富有创造力，充满突破性的想法和持久的雄心。'
  }],
  ['Điềm tĩnh, hòa hợp và luôn duy trì trật tự trong mọi tình huống.', {
    en: 'Calm, harmonious, and always maintaining order in every situation.',
    ja: '冷静で調和を重んじ、あらゆる状況で秩序を保ちます。',
    ko: '차분하고 조화로우며 어떤 상황에서도 질서를 유지합니다.',
    zh: '沉着冷静、注重和谐，在任何情况下都保持秩序。'
  }],
  ['Chạy huy hiệu Thời gian chơi & Trò chơi đa dạng', {
    en: 'Run Game Time & Game Variety Badges',
    ja: 'プレイ時間 & ゲーム数バッジを実行',
    ko: '플레이 시간 & 게임 다양성 배지 실행',
    zh: '运行游戏时长与游戏数量徽章'
  }],
  ['Mở khóa mốc 5.000+ giờ chơi và 100+ trò chơi tự động', {
    en: 'Automatically unlock the 5,000+ hours and 100+ games milestones',
    ja: '5,000時間以上＆100ゲーム以上の目標を自動解除',
    ko: '5,000시간 이상 및 100개 이상 게임 목표를 자동으로 달성',
    zh: '自动解锁 5,000+ 小时游玩时长与 100+ 款游戏目标'
  }],
  ['Duyệt huy hiệu của bạn và khám phá những món mới mà bạn có thể mở khóa.', {
    en: 'Browse your badges and discover new ones you can unlock.',
    ja: '所持バッジとこれから解除できる新しいバッジを確認します。',
    ko: '보유 중인 배지와 새로 잠금 해제할 수 있는 배지를 살펴보세요.',
    zh: '浏览你的徽章并探索可解锁的新徽章。'
  }],
  ['Đã kích hoạt chế độ: Chạy lần lượt từng quest theo thứ tự hàng đợi.', {
    en: 'Sequential queue mode enabled: running quests one by one.',
    ja: '順次キューモードが有効になりました: クエストを順番に実行します。',
    ko: '순차 대기열 모드가 활성화되었습니다: 퀘스트를 순서대로 실행합니다.',
    zh: '已启用顺序队列模式：按队列依次运行任务。'
  }],
  ['Đang chạy Playtime, vui lòng dừng Playtime trước khi chạy Quest', {
    en: 'Playtime is running, please stop Playtime before running Quests',
    ja: 'プレイ時間実行中です。クエストの前に停止してください',
    ko: '플레이 시간 실행 중입니다. 퀘스트 전에 중지하세요',
    zh: '正在运行游戏时长助手，请先停止再运行任务'
  }],
  ['Đang chạy cày huy hiệu Playtime! Vui lòng dừng Playtime trước khi chạy Quest.', {
    en: 'Playtime runner is active! Stop Playtime before running this Quest.',
    ja: 'プレイ時間バッジ実行中です。先に停止してください。',
    ko: '플레이 시간 러너가 실행 중입니다. 먼저 중지하세요.',
    zh: '游戏时长徽章助手正在运行，请先停止。'
  }],
  ['Tạm dừng nhiệm vụ đang chạy để ưu tiên chạy Quest này', {
    en: 'Pause current running quest to prioritize this one',
    ja: '実行中のクエストを一時停止してこれを優先実行',
    ko: '실행 중인 퀘스트를 일시정지하고 이 퀘스트 우선 실행',
    zh: '暂停当前任务并优先运行此任务'
  }],
  ['Chưa có tài khoản nào được xác thực để tải danh sách Quest.', {
    en: 'No verified account available to load Quests.',
    ja: 'クエストを読み込むための認証済みアカウントがありません。',
    ko: '퀘스트를 불러올 인증된 계정이 없습니다.',
    zh: '暂无已验证账号可加载任务列表。'
  }],
  ['Chưa có tài khoản nào được kết nối!', {
    en: 'No account connected yet!',
    ja: 'アカウントが接続されていません！',
    ko: '연결된 계정이 없습니다!',
    zh: '尚未连接任何账号！'
  }],
  ['Cần kết nối tài khoản trước', {
    en: 'Please connect an account first',
    ja: '先にアカウントを接続してください',
    ko: '먼저 계정을 연결해주세요',
    zh: '请先连接账号'
  }],
  ['Đã dừng toàn bộ hàng đợi tự động.', { en: 'Stopped all queued automation.', ja: '自動キューをすべて停止しました。', ko: '자동 대기열을 모두 중지했습니다.', zh: '已停止所有自动队列。' }],
  ['Bắt đầu chạy lần lượt theo hàng đợi', { en: 'Started sequential queue runner', ja: '順次キュー実行を開始しました', ko: '순차 대기열 실행을 시작했습니다', zh: '已开始按队列依次运行' }],
  ['Đã dừng hàng đợi', { en: 'Queue stopped', ja: 'キューを停止しました', ko: '대기열 중지됨', zh: '队列已停止' }],
  ['Tài khoản đã đạt cấp tối đa cho cả 2 huy hiệu!', { en: 'Account has already maxed out both badges!', ja: 'このアカウントは両方のバッジが最大レベルです！', ko: '이 계정은 두 배지 모두 최대 등급에 도달했습니다!', zh: '此账号两个徽章均已满级！' }],
  ['Huy hiệu Thời gian chơi đã đạt tối đa, vui lòng chọn Trò chơi đa dạng!', { en: 'Game Time is maxed! Please select Game Variety.', ja: 'プレイ時間バッジは最大です。ゲーム数を選択してください。', ko: '플레이 시간 배지가 최대입니다. 게임 다양성을 선택하세요.', zh: '游戏时长徽章已满，请选择游戏多样性！' }],
  ['Huy hiệu Trò chơi đa dạng đã đạt tối đa, vui lòng chọn Thời gian chơi!', { en: 'Game Variety is maxed! Please select Game Time.', ja: 'ゲーム数バッジは最大です。プレイ時間を選択してください。', ko: '게임 다양성 배지가 최대입니다. 플레이 시간을 선택하세요.', zh: '游戏多样性徽章已满，请选择游戏时长！' }],
  ['Không thể tải danh sách game từ Discord', { en: 'Failed to load game catalog from Discord', ja: 'Discordからゲーム一覧を取得できませんでした', ko: 'Discord에서 게임 목록을 불러올 수 없습니다', zh: '无法从 Discord 加载游戏列表' }],
  ['Discord đồng bộ huy hiệu ngầm (có thể mất vài phút đến vài giờ).', { en: 'Discord syncs badges asynchronously (may take minutes to hours).', ja: 'Discordはバックグラウンドでバッジを同期します（数分〜数時間）。', ko: 'Discord가 백그라운드에서 배지를 동기화합니다 (수 분~수 시간 소요).', zh: 'Discord 后台同步徽章中（可能需要几分钟到几小时）。' }],
  ['Token không hợp lệ hoặc đã hết hạn!', { en: 'Invalid or expired Token!', ja: 'トークンが無効または期限切れです！', ko: '유효하지 않거나 만료된 토큰입니다!', zh: 'Token 无效或已过期！' }],
  ['ID Quest không hợp lệ (phải là dãy số Snowflake Discord)', { en: 'Invalid Quest ID (must be a Discord Snowflake ID)', ja: '無効なクエストIDです（Discord Snowflake IDである必要があります）', ko: '유효하지 않은 퀘스트 ID입니다', zh: '无效的任务 ID（必须为 Discord Snowflake 数字）' }],
  ['Chưa nhập Link hoặc ID Quest Discord', { en: 'Please enter a Discord Quest Link or ID', ja: 'DiscordクエストリンクまたはIDを入力してください', ko: 'Discord 퀘스트 링크 또는 ID를 입력하세요', zh: '请输入 Discord 任务链接或 ID' }],
  ['Không thể đồng bộ Quest từ Discord', { en: 'Unable to sync Quests from Discord', ja: 'Discordからクエストを同期できません', ko: 'Discord에서 퀘스트를 동기화할 수 없습니다', zh: '无法从 Discord 同步任务' }],
  ['Lỗi kết nối khi đồng bộ Quest', { en: 'Network error while syncing Quests', ja: 'クエスト同期中に接続エラーが発生しました', ko: '퀘스트 동기화 중 연결 오류 발생', zh: '同步任务时连接出错' }],
  ['Chưa có mã quà hoặc quest chưa hoàn tất', { en: 'No gift code available or quest not completed yet', ja: 'ギフトコードがないかクエスト未完了です', ko: '기프트 코드가 없거나 퀘스트가 완료되지 않았습니다', zh: '暂无礼品码或任务尚未完成' }],
  ['Không tìm thấy Discord Token', { en: 'Discord Token not found', ja: 'Discordトークンが見つかりません', ko: 'Discord 토큰을 찾을 수 없습니다', zh: '未找到 Discord Token' }],
  ['Đang xác thực với Discord...', { en: 'Verifying with Discord...', ja: 'Discordで認証中...', ko: 'Discord 인증 중...', zh: '正在向 Discord 验证...' }],
  ['Đang kiểm tra IP mạng...', { en: 'Checking network IP...', ja: 'ネットワークIPを確認中...', ko: '네트워크 IP 확인 중...', zh: '正在检测网络 IP...' }],
  ['Bấm để kiểm tra lại', { en: 'Click to re-check', ja: 'クリックして再確認', ko: '클릭하여 재확인', zh: '点击重新检测' }],
  ['Không lấy được IP', { en: 'IP unavailable', ja: 'IP取得失敗', ko: 'IP 확인 불가', zh: '无法获取 IP' }],
  ['Mạng nhà', { en: 'Home Network', ja: '自宅回線', ko: '가정 네트워크', zh: '家庭网络' }],
  ['Chưa nhập Token!', { en: 'Please enter a Token!', ja: 'トークンを入力してください！', ko: '토큰을 입력해주세요!', zh: '请输入 Token！' }],

  // Settings & Modals short labels
  ['Tự động chuyển tiếp (Auto Next)', { en: 'Auto Next Quest', ja: '自動次へ (Auto Next)', ko: '자동 다음 퀘스트 (Auto Next)', zh: '自动切换下一任务 (Auto Next)' }],
  ['Tự động tham gia Quest (Auto Enroll)', { en: 'Auto Enroll Quest', ja: '自動クエスト参加 (Auto Enroll)', ko: '자동 퀘스트 등록 (Auto Enroll)', zh: '自动接取任务 (Auto Enroll)' }],
  ['Ngẫu nhiên độ trễ (Random Jitter)', { en: 'Random Jitter', ja: 'ランダム遅延 (Jitter)', ko: '랜덤 지터 (Random Jitter)', zh: '随机延迟抖动 (Random Jitter)' }],
  ['Chu kỳ gửi tiến trình Chơi Game', { en: 'Game Heartbeat Interval', ja: 'ゲーム心拍の送信間隔', ko: '게임 하트비트 전송 주기', zh: '游戏心跳上报周期' }],
  ['Chu kỳ gửi tiến trình Video', { en: 'Video Progress Interval', ja: '動画進捗の送信間隔', ko: '동영상 진행 전송 주기', zh: '视频进度上报周期' }],
  ['Cài Đặt Màn Hình Chính & Chia Sẻ', { en: 'Home Screen & Sharing', ja: 'ホーム画面 & 共有設定', ko: '홈 화면 및 공유 설정', zh: '主屏幕与分享设置' }],
  ['Thêm vào màn hình chính (PWA)', { en: 'Add to Home Screen (PWA)', ja: 'ホーム画面に追加 (PWA)', ko: '홈 화면에 추가 (PWA)', zh: '添加到主屏幕 (PWA)' }],
  ['📌 Hướng dẫn ghim ra màn hình chính:', { en: '📌 How to pin to Home Screen:', ja: '📌 ホーム画面への追加方法:', ko: '📌 홈 화면에 고정하는 방법:', zh: '📌 添加到主屏幕指南：' }],
  ['Tự Động Hóa Nhiệm Vụ', { en: 'Quest Automation', ja: 'クエスト自動化', ko: '퀘스트 자동화', zh: '任务自动化' }],
  ['Tần Suất & Tiến Trình', { en: 'Intervals & Progress', ja: '送信間隔 & 進捗', ko: '전송 주기 및 진행', zh: '频率与进度' }],
  ['Đang tải danh mục huy hiệu từ Discord...', { en: 'Loading badge directory from Discord...', ja: 'Discordからバッジ一覧を読み込み中...', ko: 'Discord에서 배지 목록을 불러오는 중...', zh: '正在从 Discord 加载徽章目录...' }],
  ['Tài khoản này chưa có dữ liệu Danh Mục Huy Hiệu từ Discord.', { en: 'No badge directory data available for this account.', ja: 'このアカウントのバッジ一覧データがありません。', ko: '이 계정의 배지 디렉토리 데이터가 없습니다.', zh: '此账号暂无 Discord 徽章目录数据。' }],
  ['Tài khoản này chưa mở khóa huy hiệu nào.', { en: 'This account has not unlocked any badges yet.', ja: 'このアカウントはまだバッジを解除していません。', ko: '이 계정은 아직 잠금 해제한 배지가 없습니다.', zh: '此账号尚未解锁任何徽章。' }],
  ['Mở Chạy Huy Hiệu ➔', { en: 'Open Badge Runner ➔', ja: 'バッジ実行を開く ➔', ko: '배지 러너 열기 ➔', zh: '打开刷徽章 ➔' }],
  ['Chạy huy hiệu Trò chơi đa dạng ➔', { en: 'Run Game Variety Badge ➔', ja: 'ゲーム数バッジを実行 ➔', ko: '게임 다양성 배지 실행 ➔', zh: '运行游戏数量徽章 ➔' }],
  ['Chạy huy hiệu Thời gian chơi ➔', { en: 'Run Game Time Badge ➔', ja: 'プレイ時間バッジを実行 ➔', ko: '플레이 시간 배지 실행 ➔', zh: '运行游戏时长徽章 ➔' }],
  ['Huy hiệu của bạn', { en: 'Your Badges', ja: 'あなたのバッジ', ko: '내 배지', zh: '你的徽章' }],
  ['Có thể mở khóa', { en: 'Available to Unlock', ja: '解除可能', ko: '잠금 해제 가능', zh: '可解锁' }],
  ['Tiến trình của bạn', { en: 'Your Progress', ja: '進捗状況', ko: '진행 상황', zh: '你的进度' }],
  ['Huy Hiệu Kiểu Cũ', { en: 'Legacy Badge', ja: 'レガシーバッジ', ko: '레거시 배지', zh: '绝版徽章' }],
  ['Chưa được mở khóa', { en: 'Locked', ja: '未解除', ko: '잠김', zh: '未解锁' }],
  ['Đã mở khóa', { en: 'Unlocked', ja: '解除済み', ko: '잠금 해제됨', zh: '已解锁' }],
  ['Rời HypeSquad', { en: 'Leave HypeSquad', ja: 'HypeSquadを離脱', ko: 'HypeSquad 탈퇴', zh: '退出 HypeSquad' }],
  ['Lấy huy hiệu', { en: 'Claim Badge', ja: 'バッジを取得', ko: '배지 받기', zh: '领取徽章' }],
  ['Đang sở hữu', { en: 'Owned', ja: '所持中', ko: '보유 중', zh: '已拥有' }],
  ['Huy hiệu trên hồ sơ', { en: 'Profile Badges', ja: 'プロフィールバッジ', ko: '프로필 배지', zh: '个人资料徽章' }],
  ['Xem tất cả huy hiệu', { en: 'View All Badges', ja: 'すべてのバッジを見る', ko: '모든 배지 보기', zh: '查看全部徽章' }],
  ['Xem danh mục huy hiệu có thể mở khóa', { en: 'View unlockable badges directory', ja: '解除可能なバッジ一覧を見る', ko: '잠금 해제 가능한 배지 보기', zh: '查看可解锁徽章目录' }],
  ['Trang chủ Nhiệm Vụ', { en: 'Quests Home', ja: 'クエストホーム', ko: '퀘스트 홈', zh: '任务主页' }],
  ['Cửa Hàng Orb', { en: 'Orbs Shop', ja: 'Orbsショップ', ko: 'Orbs 상점', zh: 'Orbs 商店' }],
  ['Nhận Nitro', { en: 'Get Nitro', ja: 'Nitroを取得', ko: 'Nitro 받기', zh: '获取 Nitro' }],
  ['Nâng cấp một máy chủ', { en: 'Boost a Server', ja: 'サーバーをブースト', ko: '서버 부스트하기', zh: '助力服务器' }],
  ['Tặng Quà', { en: 'Send a Gift', ja: 'ギフトを贈る', ko: '선물하기', zh: '赠送礼物' }],
  ['Quả Cảm', { en: 'Bravery', ja: 'ブレイブ', ko: '용기', zh: '无畏' }],
  ['Lỗi Lạc', { en: 'Brilliance', ja: 'ブリリアンス', ko: '탁월함', zh: '卓越' }],
  ['Cân Bằng', { en: 'Balance', ja: 'バランス', ko: '균형', zh: '平衡' }],
  ['Chưa chọn tài khoản', { en: 'No account selected', ja: 'アカウント未選択', ko: '선택된 계정 없음', zh: '未选择账号' }],
  ['Tính năng đang khóa', { en: 'Feature Locked', ja: '機能ロック中', ko: '기능 잠김', zh: '功能已锁定' }],
  ['Đến mục Tài khoản ngay', { en: 'Go to Accounts', ja: 'アカウントへ移動', ko: '계정 탭으로 이동', zh: '前往账号管理' }],
  ['Chưa có nhiệm vụ trong hàng đợi', { en: 'No Quests Loaded', ja: 'クエストなし', ko: '대기 중인 퀘스트 없음', zh: '暂无任务' }],
  ['Quét Quest Ngay', { en: 'Scan Quests Now', ja: '今すぐスキャン', ko: '지금 스캔하기', zh: '立即扫描任务' }],
  ['Không có hạn', { en: 'No expiry', ja: '期限なし', ko: '만료 없음', zh: '无期限' }],
  ['Không rõ hạn', { en: 'Unknown expiry', ja: '期限不明', ko: '만료일 미상', zh: '未知期限' }],
  ['Chưa có tài khoản Discord nào', { en: 'No Discord Accounts', ja: 'アカウント未登録', ko: '등록된 계정 없음', zh: '暂无 Discord 账号' }],
  ['Chưa có nhiệm vụ có mã quà', { en: 'No Gift Code Quests', ja: 'コード付きクエストなし', ko: '기프트 코드 퀘스트 없음', zh: '暂无礼品码任务' }],
  ['Quét Nhiệm Vụ Ngay', { en: 'Scan Quests Now', ja: '今すぐスキャン', ko: '지금 퀘스트 스캔', zh: '立即扫描任务' }],
  ['Lấy Mã trên Discord', { en: 'Claim Code on Discord', ja: 'Discordでコード取得', ko: 'Discord에서 코드 받기', zh: '在 Discord 领取代码' }],
  ['Xem trên Discord', { en: 'View on Discord', ja: 'Discordで見る', ko: 'Discord에서 보기', zh: '在 Discord 查看' }],
  ['Lấy Mã Thất Bại', { en: 'Failed to Fetch Code', ja: '取得失敗', ko: '코드 가져오기 실패', zh: '获取失败' }],
  ['Chờ lấy mã', { en: 'Ready to Claim Code', ja: 'コード受取待ち', ko: '코드 수령 대기', zh: '待领取代码' }],
  ['Đã nhận mã', { en: 'Code Claimed', ja: 'コード取得済み', ko: '코드 수령 완료', zh: '已领取代码' }],
  ['Còn hạn dùng', { en: 'Valid', ja: '有効', ko: '유효함', zh: '有效' }],
  ['Đã chép', { en: 'Copied', ja: 'コピー済み', ko: '복사됨', zh: '已复制' }],
  ['+ Thêm & Check Token', { en: '+ Add & Verify Token', ja: '+ トークン追加・検証', ko: '+ 토큰 추가 및 확인', zh: '+ 添加并验证 Token' }],
  ['Mặc định', { en: 'Defaults', ja: 'デフォルト', ko: '기본값', zh: '默认' }],
  ['Lưu Cài Đặt', { en: 'Save Settings', ja: '設定を保存', ko: '설정 저장', zh: '保存设置' }],
  ['Thêm vào MH chính', { en: 'Add to Home Screen', ja: 'ホーム画面に追加', ko: '홈 화면에 추가', zh: '添加到主屏幕' }],
  ['Chia sẻ', { en: 'Share', ja: '共有', ko: '공유', zh: '分享' }],
  ['Kiểm Tra', { en: 'Verify', ja: '確認', ko: '확인', zh: '验证' }],
  ['Hủy', { en: 'Cancel', ja: 'キャンセル', ko: '취소', zh: '取消' }],
  ['Sao chép', { en: 'Copy', ja: 'コピー', ko: '복사', zh: '复制' }],
  ['Đã sao chép', { en: 'Copied', ja: 'コピー済み', ko: '복사됨', zh: '已复制' }],
  ['Thêm & Quét Ngay', { en: 'Add & Scan Now', ja: '追加してスキャン', ko: '추가 및 즉시 스캔', zh: '添加并立即扫描' }],
  ['Thu gọn', { en: 'Collapse', ja: '折りたたむ', ko: '접기', zh: '收起' }],
  ['Hệ thống sẵn sàng', { en: 'System Ready', ja: 'システム準備完了', ko: '시스템 준비 완료', zh: '系统就绪' }],
  ['Quét Nhiệm Vụ', { en: 'Scan Quests', ja: 'クエスト取得', ko: '퀘스트 스캔', zh: '扫描任务' }],
  ['Thêm Token', { en: 'Add Token', ja: 'トークン追加', ko: '토큰 추가', zh: '添加 Token' }],
  ['NHIỆM VỤ KHẢ DỤNG', { en: 'AVAILABLE QUESTS', ja: '利用可能なクエスト', ko: '사용 가능한 퀘스트', zh: '可用任务' }],
  ['Sẵn sàng thực hiện', { en: 'Ready to run', ja: '実行準備完了', ko: '실행 준비 완료', zh: '准备执行' }],
  ['TIẾN TRÌNH CHẠY', { en: 'RUNNING TASKS', ja: '実行中のタスク', ko: '실행 중인 작업', zh: '运行进度' }],
  ['Đang hoạt động', { en: 'Active', ja: '稼働中', ko: '활성', zh: '运行中' }],
  ['Chưa chạy', { en: 'Idle', ja: '待機中', ko: '대기 중', zh: '未运行' }],
  ['MÃ QUÀ ĐÃ NHẬN', { en: 'CLAIMED CODES', ja: '獲得済みコード', ko: '획득한 코드', zh: '已获礼品码' }],
  ['Gift Codes trong kho', { en: 'Gift Codes in vault', ja: '保存済みコード', ko: '보관함 기프트 코드', zh: '仓库中的礼品码' }],
  ['SỐ DƯ ORBS', { en: 'ORBS BALANCE', ja: 'ORBS残高', ko: 'ORBS 잔액', zh: 'ORBS 余额' }],
  ['Tích lũy từ Discord', { en: 'Earned from Discord', ja: 'Discordから獲得', ko: 'Discord에서 적립', zh: '来自 Discord 累计' }],
  ['Nhiệm Vụ Đang Mở', { en: 'Open Quests', ja: '進行中のクエスト', ko: '열린 퀘스트', zh: '进行中任务' }],
  ['Xem tất cả', { en: 'View all', ja: 'すべて見る', ko: '모두 보기', zh: '查看全部' }],
  ['Tài Khoản Discord', { en: 'Discord Account', ja: 'Discordアカウント', ko: 'Discord 계정', zh: 'Discord 账号' }],
  ['Đã kết nối', { en: 'Connected', ja: '接続済み', ko: '연결됨', zh: '已连接' }],
  ['Chưa kết nối', { en: 'Disconnected', ja: '未接続', ko: '연결 안 됨', zh: '未连接' }],
  ['Chưa kết nối tài khoản', { en: 'No account connected', ja: 'アカウント未接続', ko: '연결된 계정 없음', zh: '未连接账号' }],
  ['Nhiệm vụ xong', { en: 'Quests done', ja: '完了クエスト', ko: '완료한 퀘스트', zh: '已完成任务' }],
  ['Quản lý tài khoản', { en: 'Manage accounts', ja: 'アカウント管理', ko: '계정 관리', zh: '管理账号' }],
  ['Nhật Ký Hoạt Động Trực Tiếp', { en: 'Live Activity Logs', ja: 'リアルタイム活動ログ', ko: '실시간 활동 로그', zh: '实时活动日志' }],
  ['Mở Console', { en: 'Open Console', ja: 'コンソールを開く', ko: '콘솔 열기', zh: '打开控制台' }],
  ['Hệ thống Discord Quest đã sẵn sàng kết nối.', { en: 'Discord Quest system is ready to connect.', ja: 'Discord Questシステムは接続準備完了です。', ko: 'Discord Quest 시스템 연결 준비 완료.', zh: 'Discord Quest 系统已就绪。' }],
  ['Tài khoản', { en: 'Account', ja: 'アカウント', ko: '계정', zh: '账号' }],
  ['Nhiệm vụ', { en: 'Quest', ja: 'クエスト', ko: '퀘스트', zh: '任务' }],
  ['Số dư Orbs', { en: 'Orbs Balance', ja: 'Orbs残高', ko: 'Orbs 잔액', zh: 'Orbs 余额' }],
  ['Đã xong', { en: 'Completed', ja: '完了', ko: '완료', zh: '已完成' }],
  ['Thao tác', { en: 'Actions', ja: '操作', ko: '작업', zh: '操作' }],
  ['Hình thức', { en: 'Type', ja: '種類', ko: '유형', zh: '类型' }],
  ['Phần thưởng', { en: 'Reward', ja: '報酬', ko: '보상', zh: '奖励' }],
  ['Hết hạn', { en: 'Expires', ja: '期限', ko: '만료', zh: '过期时间' }],
  ['Tiến trình', { en: 'Progress', ja: '進捗', ko: '진행률', zh: '进度' }],
  ['Còn lại', { en: 'Remaining', ja: '残り', ko: '남은 시간', zh: '剩余' }],
  ['Loại quà', { en: 'Reward Type', ja: '報酬タイプ', ko: '보상 유형', zh: '奖励类型' }],
  ['Trạng thái', { en: 'Status', ja: 'ステータス', ko: '상태', zh: '状态' }],
  ['Mã Code', { en: 'Gift Code', ja: 'ギフトコード', ko: '기프트 코드', zh: '礼品码' }],
  ['Xem Video (Mobile)', { en: 'Watch Video (Mobile)', ja: '動画視聴 (モバイル)', ko: '동영상 시청 (모바일)', zh: '观看视频 (移动端)' }],
  ['Xem Video', { en: 'Watch Video', ja: '動画視聴', ko: '동영상 시청', zh: '观看视频' }],
  ['Chơi trên PC', { en: 'Play on PC', ja: 'PCでプレイ', ko: 'PC에서 플레이', zh: 'PC 游玩' }],
  ['Stream trên PC', { en: 'Stream on PC', ja: 'PCで配信', ko: 'PC에서 방송', zh: 'PC 直播' }],
  ['Xem Livestream', { en: 'Watch Stream', ja: '配信視聴', ko: '방송 시청', zh: '观看直播' }],
  ['Chơi Mobile', { en: 'Play Mobile', ja: 'モバイルでプレイ', ko: '모바일 플레이', zh: '手机游玩' }],
  ['Hoạt động Discord', { en: 'Discord Activity', ja: 'Discordアクティビティ', ko: 'Discord 활동', zh: 'Discord 活动' }],
  ['Nhiệm vụ Discord', { en: 'Discord Quest', ja: 'Discordクエスト', ko: 'Discord 퀘스트', zh: 'Discord 任务' }],
  ['Chờ nhận', { en: 'Pending', ja: '未参加', ko: '대기 중', zh: '待接取' }],
  ['Trong hàng đợi', { en: 'Queued', ja: '待機中', ko: '대기열', zh: '排队中' }],
  ['Đang chạy', { en: 'Running', ja: '実行中', ko: '실행 중', zh: '运行中' }],
  ['Hoàn thành', { en: 'Completed', ja: '完了', ko: '완료', zh: '已完成' }],
  ['Đã nhận', { en: 'Claimed', ja: '受取済み', ko: '수령 완료', zh: '已领取' }],
  ['Tạm dừng', { en: 'Pause', ja: '一時停止', ko: '일시정지', zh: '暂停' }],
  ['Nhận thưởng', { en: 'Claim', ja: '受け取る', ko: '보상 받기', zh: '领取奖励' }],
  ['Nhận quà', { en: 'Claim', ja: '受け取る', ko: '보상 받기', zh: '领取奖励' }],
  ['Mở trên Discord', { en: 'Open on Discord', ja: 'Discordで開く', ko: 'Discord에서 열기', zh: '在 Discord 中打开' }],
  ['Chưa làm', { en: 'Not Started', ja: '未開始', ko: '미시작', zh: '未开始' }],
  ['Thử lại', { en: 'Retry', ja: '再試行', ko: '재시도', zh: '重试' }],
  ['Đang quét...', { en: 'Scanning...', ja: 'スキャン中...', ko: '스캔 중...', zh: '扫描中...' }],
  ['Đang lấy...', { en: 'Fetching...', ja: '取得中...', ko: '가져오는 중...', zh: '获取中...' }],
  ['Đang gửi...', { en: 'Sending...', ja: '送信中...', ko: '전송 중...', zh: '发送中...' }],
  ['Cấu Hình Chạy', { en: 'Run Configuration', ja: '実行設定', ko: '실행 설정', zh: '运行配置' }],
  ['Chế độ', { en: 'Mode', ja: 'モード', ko: '모드', zh: '模式' }],
  ['Cả hai', { en: 'Both', ja: '両方', ko: '모두', zh: '双模式' }],
  ['Giờ chơi + Số game', { en: 'Hours + Games', ja: '時間 + ゲーム数', ko: '시간 + 게임 수', zh: '时长 + 游戏数' }],
  ['Mốc 5.000+ giờ', { en: '5,000+ Hours Tier', ja: '5,000+時間目標', ko: '5,000+시간 달성', zh: '5,000+ 小时目标' }],
  ['Mốc 100+ game', { en: '100+ Games Tier', ja: '100+ゲーム目標', ko: '100+게임 달성', zh: '100+ 游戏目标' }],
  ['Thời gian chơi', { en: 'Game Time', ja: 'プレイ時間', ko: '플레이 시간', zh: '游戏时长' }],
  ['Trò chơi đa dạng', { en: 'Game Variety', ja: 'ゲーム数', ko: '게임 다양성', zh: '游戏多样性' }],
  ['Số lượng game', { en: 'Game Count', ja: 'ゲーム数', ko: '게임 수', zh: '游戏数量' }],
  ['Số giờ mỗi game', { en: 'Hours Per Game', ja: 'ゲーム毎の時間', ko: '게임당 시간', zh: '每款游戏时长' }],
  ['Kho game', { en: 'Catalog', ja: 'ゲーム数', ko: '카탈로그', zh: '游戏库' }],
  ['Đã lọc', { en: 'Filtered', ja: '除外済み', ko: '필터됨', zh: '已过滤' }],
  ['Tổng giờ', { en: 'Total Hours', ja: '合計時間', ko: '총 시간', zh: '总时长' }],
  ['Bắt đầu chạy', { en: 'Start Running', ja: '実行開始', ko: '실행 시작', zh: '开始运行' }],
  ['Tiến Trình & Nhật Ký', { en: 'Progress & Logs', ja: '進捗 & ログ', ko: '진행률 및 로그', zh: '进度与日志' }],
  ['Đã xử lý:', { en: 'Processed:', ja: '処理済み:', ko: '처리됨:', zh: '已处理:' }],
  ['Sẵn sàng. Chọn chế độ và bấm Bắt đầu.', {
    en: 'Ready. Select a mode and click Start Running.',
    ja: '準備完了。モードを選択して「実行開始」をクリックしてください。',
    ko: '준비 완료. 모드를 선택하고 실행 시작을 누르세요.',
    zh: '就绪。请选择模式并点击开始运行。'
  }],
  // Playtime Tiers
  ['Người dùng thử', { en: 'Sampler', ja: 'サンプラー', ko: '샘플러', zh: '尝鲜者' }],
  ['Người chơi qua', { en: 'Dabbler', ja: 'ダブラー', ko: '입문자', zh: '涉猎者' }],
  ['Người đam mê', { en: 'Enthusiast', ja: '愛好家', ko: '애호가', zh: '爱好者' }],
  ['Trinh Sát', { en: 'Scout', ja: 'スカウト', ko: '정찰병', zh: '侦察兵' }],
  ['Người khám phá', { en: 'Explorer', ja: 'エクスプローラー', ko: '탐험가', zh: '探索者' }],
  ['Nhà Thám Hiểm', { en: 'Adventurer', ja: '冒険者', ko: '모험가', zh: '冒险家' }],
  ['Nhà du hành', { en: 'Voyager', ja: 'ボイジャー', ko: '항해자', zh: '航行者' }],
  ['Người khác biệt', { en: 'Distinct', ja: 'ディスティンクト', ko: '독보적', zh: '出众者' }],
  ['Người đa tài', { en: 'Versatile', ja: '多才', ko: '다재다능', zh: '全能玩家' }],
  ['Thuyết phổ quát', { en: 'Universalist', ja: 'ユニバーサリスト', ko: '유니버설리스트', zh: '博学家' }],
  ['Giải Trí', { en: 'Recreational', ja: 'レクリエーション', ko: '가벼운 플레이', zh: '休闲娱乐' }],
  ['Giải trí', { en: 'Amateur', ja: 'アマチュア', ko: '아마추어', zh: '业余玩家' }],
  ['Gắn bó', { en: 'Regular', ja: 'レギュラー', ko: '단골', zh: '常客' }],
  ['Tâm huyết', { en: 'Passionate', ja: '情熱的', ko: '열정적', zh: '热忱玩家' }],
  ['Nghiêm túc', { en: 'Serious', ja: 'シリアス', ko: '진지한 플레이어', zh: '硬核入门' }],
  ['Tận hiến', { en: 'Devoted', ja: '献身的', ko: '헌신적', zh: '专注玩家' }],
  ['Lão luyện', { en: 'Veteran', ja: 'ベテラン', ko: '베테랑', zh: '资深老兵' }],
  ['Sắt đá', { en: 'Hardcore', ja: 'ハードコア', ko: '하드코어', zh: '铁杆玩家' }],
  ['Kiên định', { en: 'Resolute', ja: '不屈', ko: '불굴', zh: '坚毅玩家' }],
  ['Vĩnh cửu', { en: 'Eternal', ja: 'エターナル', ko: '영원', zh: '永恒传说' }],
  // Rarity & Modals
  ['Huyền thoại', { en: 'Mythic', ja: 'ミシック', ko: '신화', zh: '神话' }],
  ['Cực hiếm', { en: 'Ultra Rare', ja: '激レア', ko: '초희귀', zh: '极稀有' }],
  ['Sử thi', { en: 'Epic', ja: 'エピック', ko: '에픽', zh: '史诗' }],
  ['Hiếm', { en: 'Rare', ja: 'レア', ko: '희귀', zh: '稀有' }],
  ['Thêm & Xác Thực Token Discord', { en: 'Add & Verify Discord Token', ja: 'Discordトークンの追加と検証', ko: 'Discord 토큰 추가 및 인증', zh: '添加并验证 Discord Token' }],
  ['Lấy token ở đâu?', { en: 'Where to find token?', ja: 'トークンの取得方法は？', ko: '토큰은 어디서 찾나요?', zh: '如何获取 Token？' }],
  ['Dán token tại đây...', { en: 'Paste token here...', ja: 'ここにトークンを貼り付け...', ko: '여기에 토큰을 붙여넣으세요...', zh: '在此粘贴 Token...' }],
  ['Cách 1: Chạy Console (Nhanh nhất – 1 click):', { en: 'Method 1: Console Script (Fastest – 1 click):', ja: '方法1: コンソール実行（最速・1クリック）:', ko: '방법 1: 콘솔 스크립트 (가장 빠름 – 1클릭):', zh: '方式 1：控制台脚本（最快 – 一键复制）：' }],
  ['Cách 2: Lấy qua Network (Thủ công):', { en: 'Method 2: Network Tab (Manual):', ja: '方法2: Networkタブ（手動）:', ko: '방법 2: Network 탭 (수동):', zh: '方式 2：Network 面板（手动）：' }],
  ['Thêm Nhiệm Vụ Bằng Link / ID', { en: 'Add Quest by Link / ID', ja: 'リンク / ID でクエスト追加', ko: '링크 / ID로 퀘스트 추가', zh: '通过链接 / ID 添加任务' }],
  ['Link hoặc ID Quest Discord', { en: 'Discord Quest Link or ID', ja: 'DiscordクエストリンクまたはID', ko: 'Discord 퀘스트 링크 또는 ID', zh: 'Discord 任务链接或 ID' }],
  ['[Đồng bộ]', { en: '[Sync]', ja: '[同期]', ko: '[동기화]', zh: '[同步]' }],
  ['[Hàng đợi]', { en: '[Queue]', ja: '[キュー]', ko: '[대기열]', zh: '[队列]' }],
  ['[Huy hiệu]', { en: '[Badges]', ja: '[バッジ]', ko: '[배지]', zh: '[徽章]' }],
  ['[Mã quà]', { en: '[Rewards]', ja: '[報酬]', ko: '[보상]', zh: '[奖励]' }],
  ['[Bắt đầu]', { en: '[Start]', ja: '[開始]', ko: '[시작]', zh: '[开始]' }],
  ['[Tạm dừng]', { en: '[Pause]', ja: '[一時停止]', ko: '[일시정지]', zh: '[暂停]' }],
  ['[Cài đặt]', { en: '[Settings]', ja: '[設定]', ko: '[설정]', zh: '[设置]' }],
  ['[Thêm Quest]', { en: '[Add Quest]', ja: '[クエスト追加]', ko: '[퀘스트 추가]', zh: '[添加任务]' }],
  ['[HỆ THỐNG]', { en: '[SYSTEM]', ja: '[システム]', ko: '[시스템]', zh: '[系统]' }],
  ['Đang quét danh sách nhiệm vụ...', { en: 'Scanning quest list...', ja: 'クエスト一覧をスキャン中...', ko: '퀘스트 목록 스캔 중...', zh: '正在扫描任务列表...' }],
  ['Đã dừng theo yêu cầu.', { en: 'Stopped by user request.', ja: 'ユーザー要求により停止しました。', ko: '사용자 요청으로 중지되었습니다.', zh: '已按要求停止。' }],
  ['Đang yêu cầu dừng sau đợt gửi hiện tại...', { en: 'Stopping after current batch...', ja: '現在のバッチ完了後に停止します...', ko: '현재 작업 완료 후 중지합니다...', zh: '正在请求于当前批次后停止...' }],
  ['Đã làm mới dữ liệu huy hiệu từ Discord.', { en: 'Refreshed badge data from Discord.', ja: 'Discordからバッジデータを更新しました。', ko: 'Discord에서 배지 데이터를 새로고침했습니다.', zh: '已从 Discord 刷新徽章数据。' }],
  ['Đã khôi phục cài đặt mặc định!', { en: 'Restored default settings!', ja: 'デフォルト設定に復元しました！', ko: '기본 설정으로 복원되었습니다!', zh: '已恢复默认设置！' }],
  ['Đã lưu cài đặt hệ thống!', { en: 'System settings saved!', ja: 'システム設定を保存しました！', ko: '시스템 설정이 저장되었습니다!', zh: '系统设置已保存！' }],
  ['Đã tạm dừng quest', { en: 'Quest paused', ja: 'クエストを一時停止しました', ko: '퀘스트가 일시정지되었습니다', zh: '已暂停任务' }],
  ['Chạy', { en: 'Run', ja: '実行', ko: '실행', zh: '运行' }],
  ['Xong', { en: 'Done', ja: '完了', ko: '완료', zh: '完成' }],
  ['Chuyển', { en: 'Switch', ja: '切替', ko: '전환', zh: '切换' }],
  ['Xóa', { en: 'Delete', ja: '削除', ko: '삭제', zh: '删除' }],
  ['Dừng', { en: 'Stop', ja: '停止', ko: '중지', zh: '停止' }],
  ['giây', { en: 'sec', ja: '秒', ko: '초', zh: '秒' }]
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
    [/^(\[.*?\])?\s*Gửi GET \/api\/quests \((.+?)\)\.\.\.$/, { en: '$1 Sending GET /api/quests ($2)...', ja: '$1 GET /api/quests を送信中 ($2)...', ko: '$1 GET /api/quests 전송 중 ($2)...', zh: '$1 正在发送 GET /api/quests ($2)...' }],
    [/^(\[.*?\])?\s*Đã tải (\d+) Quest & ([\d.,]+) Orbs từ Discord\.$/, { en: '$1 Loaded $2 Quests & $3 Orbs from Discord.', ja: '$1 Discordから$2件のクエストと$3 Orbsを取得しました。', ko: '$1 Discord에서 퀘스트 $2개 및 $3 Orbs 로드 완료.', zh: '$1 已从 Discord 加载 $2 个任务与 $3 Orbs。' }],
    [/^Đã đồng bộ (\d+) quest từ Discord!$/, { en: 'Synced $1 quests from Discord!', ja: 'Discordから$1件のクエストを同期しました！', ko: 'Discord에서 퀘스트 $1개 동기화 완료!', zh: '已从 Discord 同步 $1 个任务！' }],
    [/^(\[.*?\])?\s*Thất bại: (.+)$/, { en: '$1 Failed: $2', ja: '$1 失敗: $2', ko: '$1 실패: $2', zh: '$1 失败: $2' }],
    [/^(\[.*?\])?\s*Lỗi mạng: (.+)$/, { en: '$1 Network error: $2', ja: '$1 ネットワークエラー: $2', ko: '$1 네트워크 오류: $2', zh: '$1 网络错误: $2' }],
    [/^Kết nối với IP: (.+)$/, { en: 'Connected with IP: $1', ja: '接続IP: $1', ko: '연결된 IP: $1', zh: '已连接 IP: $1' }],
    [/^IP Mạng: (.+?) \(Bấm để kiểm tra lại\)$/, { en: 'Network IP: $1 (Click to re-check)', ja: 'ネットワークIP: $1 (クリックして再確認)', ko: '네트워크 IP: $1 (클릭하여 재확인)', zh: '网络 IP: $1 (点击重新检测)' }],
    [/^Đã cập nhật IP: (.+)$/, { en: 'Updated IP: $1', ja: 'IPを更新しました: $1', ko: 'IP 업데이트됨: $1', zh: '已更新 IP: $1' }],
    [/^Xác thực thành công tài khoản (@\S+) \((.+?)\)\.$/, { en: 'Verified account $1 ($2).', ja: 'アカウント $1 ($2) の認証に成功しました。', ko: '계정 $1 ($2) 인증 성공.', zh: '账号 $1 ($2) 验证成功。' }],
    [/^Xác thực thành công: (@\S+)$/, { en: 'Verified: $1', ja: '認証成功: $1', ko: '인증 성공: $1', zh: '验证成功: $1' }],
    [/^Đã cập nhật Token cho (@\S+)\.$/, { en: 'Updated Token for $1.', ja: '$1 のトークンを更新しました。', ko: '$1 토큰이 업데이트되었습니다.', zh: '已更新 $1 的 Token。' }],
    [/^Đã cập nhật Token: (@\S+)$/, { en: 'Token updated: $1', ja: 'トークン更新: $1', ko: '토큰 업데이트: $1', zh: 'Token 已更新: $1' }],
    [/^(\[.*?\])?\s*Tự động xác thực phiên: (@\S+)$/, { en: '$1 Auto-verifying session: $2', ja: '$1 セッション自動確認中: $2', ko: '$1 세션 자동 확인 중: $2', zh: '$1 自动验证会话: $2' }],
    [/^(\[.*?\])?\s*Phiên của (@\S+) đã hết hạn\. Đã tự động đăng xuất\.$/, { en: '$1 Session for $2 expired. Auto logged out.', ja: '$1 $2 のセッションが期限切れです。自動ログアウトしました。', ko: '$1 $2 세션이 만료되어 자동 로그아웃되었습니다.', zh: '$1 $2 的会话已过期，已自动退出。' }],
    [/^Phiên của (@\S+) đã hết hạn\.$/, { en: 'Session for $1 expired.', ja: '$1 のセッションが期限切れです。', ko: '$1 세션이 만료되었습니다.', zh: '$1 的会话已过期。' }],
    [/^Bắt đầu chạy: (.+)$/, { en: 'Started: $1', ja: '開始しました: $1', ko: '시작됨: $1', zh: '已开始: $1' }],
    [/^(\[.*?\])?\s*Đã kích hoạt chạy "(.+)"\.$/, { en: '$1 Started "$2".', ja: '$1 「$2」を開始しました。', ko: '$1 "$2" 실행을 시작했습니다.', zh: '$1 已启动 "$2"。' }],
    [/^(\[.*?\])?\s*Đã tạm dừng "(.+)"\.$/, { en: '$1 Paused "$2".', ja: '$1 「$2」を一時停止しました。', ko: '$1 "$2" 일시정지됨.', zh: '$1 已暂停 "$2"。' }],
    [/^(\[.*?\])?\s*Bắt đầu chạy nhiệm vụ đầu tiên: "(.+)"\.\.\.$/, { en: '$1 Starting first quest: "$2"...', ja: '$1 最初のクエストを開始: 「$2」...', ko: '$1 첫 번째 퀘스트 시작: "$2"...', zh: '$1 开始第一个任务: "$2"...' }],
    [/^Đã sao chép mã: (.+)$/, { en: 'Copied code: $1', ja: 'コードをコピーしました: $1', ko: '코드 복사됨: $1', zh: '已复制代码: $1' }],
    [/^Lấy mã thành công: (.+)$/, { en: 'Code claimed: $1', ja: 'コード取得成功: $1', ko: '코드 가져오기 성공: $1', zh: '获取代码成功: $1' }],
    [/^(\[.*?\])?\s*Đã lấy mã cho quest "(.+)": (.+)$/, { en: '$1 Claimed code for "$2": $3', ja: '$1 「$2」のコードを取得: $3', ko: '$1 "$2" 코드 수령: $3', zh: '$1 已获取 "$2" 的礼品码: $3' }],
    [/^Đang cày \((\d+%)\)$/, { en: 'Running ($1)', ja: '実行中 ($1)', ko: '진행 중 ($1)', zh: '运行中 ($1)' }],
    [/^Hàng chờ #(\d+)$/, { en: 'Queue #$1', ja: '待機 #$1', ko: '대기 #$1', zh: '排队 #$1' }],
    [/^Bắt đầu cày (\d+) game mới \(đã lọc (\d+) game từng chạy\)\.\.\.$/, { en: 'Starting $1 fresh games ($2 already-played filtered out)...', ja: '新規ゲーム$1件を開始中（プレイ済み$2件を除外）...', ko: '새 게임 $1개 시작 중 (기실행 $2개 제외)...', zh: '开始刷 $1 款新游戏（已过滤 $2 款已玩游戏）...' }],
    [/^Bắt đầu cày (\d+) game \((\d+) game mới, (\d+) game bổ sung\)\.\.\.$/, { en: 'Starting $1 games ($2 fresh, $3 fallback)...', ja: '$1件のゲームを開始中（新規$2、追加$3）...', ko: '$1개 게임 시작 중 (신규 $2, 추가 $3)...', zh: '开始运行 $1 款游戏（新游戏 $2，补充 $3）...' }],
    [/^Bắt đầu cày (\d+) game\.\.\.$/, { en: 'Starting $1 games...', ja: '$1件のゲームを開始中...', ko: '$1개 게임 시작 중...', zh: '开始运行 $1 款游戏...' }],
    [/^\[(\d+)\/(\d+)\] Hoàn tất: (.+)$/, { en: '[$1/$2] Completed: $3', ja: '[$1/$2] 完了: $3', ko: '[$1/$2] 완료: $3', zh: '[$1/$2] 已完成: $3' }],
    [/^Hoàn tất cày (\d+) game(.*)!$/, { en: 'Finished $1 games$2!', ja: '$1件のゲームが完了しました$2！', ko: '$1개 게임 완료$2!', zh: '已完成 $1 款游戏$2！' }],
    [/^Hoàn tất (\d+) game(.*)\. Discord đồng bộ huy hiệu ngầm \(có thể mất vài phút đến vài giờ\)\.$/, { en: 'Completed $1 games$2. Discord syncs badges asynchronously (may take minutes to hours).', ja: '$1件のゲームを完了$2。Discordがバックグラウンドでバッジを同期します。', ko: '$1개 게임 완료$2. Discord가 백그라운드에서 배지를 동기화합니다.', zh: '已完成 $1 款游戏$2。Discord 将在后台同步徽章（可能需要几分钟至数小时）。' }],
    [/^Bị giới hạn tốc độ, tạm chờ (\d+)s\.\.\.$/, { en: 'Rate limited, waiting $1s...', ja: 'レート制限中、$1秒待機...', ko: '속도 제한됨, $1초 대기 중...', zh: '触发速率限制，等待 $1 秒...' }],
    [/^(\d+) đang chạy • (\d+) trong hàng đợi • (\d+)\/(\d+) xong$/, { en: '$1 running • $2 queued • $3/$4 done', ja: '実行中 $1 • 待機 $2 • 完了 $3/$4', ko: '실행 $1 • 대기 $2 • 완료 $3/$4', zh: '$1 运行中 • $2 排队 • $3/$4 已完成' }],
    [/^Còn thiếu:\s*(.+)$/, { en: 'Remaining: $1', ja: '残り: $1', ko: '남은 목표: $1', zh: '还差: $1' }],
    [/^Mốc cuối \((.+)\)$/, { en: 'Max ($1)', ja: '最大 ($1)', ko: '최대 ($1)', zh: '上限 ($1)' }],
    [/^Còn (\d+)\/(\d+) nhiệm vụ$/, { en: '$1/$2 left', ja: '残り $1/$2', ko: '남음 $1/$2', zh: '剩余 $1/$2' }],
    [/^(\d+)\/(\d+) nhiệm vụ$/, { en: '$1/$2 quests', ja: '$1/$2 クエスト', ko: '$1/$2 퀘스트', zh: '$1/$2 任务' }],
    [/^Đã mở khóa (\d+\/\d+\/\d+)$/, { en: 'Unlocked $1', ja: '$1 解除済み', ko: '$1 잠금 해제', zh: '解锁于 $1' }],
    [/^Bấm để xem tất cả huy hiệu \((\d+)\)$/, { en: 'Click to view all badges ($1)', ja: 'クリックして全バッジを表示 ($1)', ko: '클릭하여 모든 배지 보기 ($1)', zh: '点击查看全部徽章 ($1)' }],
    [/^Tất cả các mốc (.+?) \((\d+) Cấp\):$/, { en: 'All $1 Tiers ($2 Levels):', ja: '$1 全ティア ($2 段階):', ko: '$1 전체 등급 ($2단계):', zh: '$1 全部等级 ($2 级):' }],
    [/^([\d.,]+)\s*giờ$/, { en: '$1 hrs', ja: '$1 時間', ko: '$1시간', zh: '$1 小时' }],
    [/^(\d+\+?)\s*trò chơi$/, { en: '$1 games', ja: '$1 ゲーム', ko: '$1 게임', zh: '$1 款游戏' }],
    [/^(\d+\+?)\s*giờ$/, { en: '$1 hrs', ja: '$1 時間', ko: '$1시간', zh: '$1 小时' }],
    [/^(\d+)\s*\/\s*(\d+)\s*game$/, { en: '$1 / $2 games', ja: '$1 / $2 ゲーム', ko: '$1 / $2 게임', zh: '$1 / $2 游戏' }],
    [/^\+(\d+(?:\.\d+)?)\s*giờ$/, { en: '+$1 hrs', ja: '+$1 時間', ko: '+$1시간', zh: '+$1 小时' }]
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
