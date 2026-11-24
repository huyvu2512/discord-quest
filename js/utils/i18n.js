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
    log_export_total: 'Tổng số sự kiện: {count}'
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
    log_export_total: 'Total events: {count}'
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
    log_export_total: '合計イベント数: {count}'
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
    log_export_total: '총 이벤트 수: {count}'
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
    log_export_total: '事件总数: {count}'
  }
};

// Bảng dịch cụm từ động cho toàn bộ UI, bảng, card, modal, toast và nhật ký (Logs)
// Format: [vietnamesePhrase, { en, ja, ko, zh }]
const PHRASE_MAP = [
  // Header & Common Buttons
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

  // Home Dashboard
  ['Hệ thống sẵn sàng', { en: 'System Ready', ja: 'システム準備完了', ko: '시스템 준비 완료', zh: '系统就绪' }],
  ['Bảng điều khiển tự động cày nhiệm vụ Discord, tính giờ chơi ngầm, nhận Orbs và lưu mã Gift Code an toàn.', {
    en: 'Dashboard to automate Discord Quests, farm background playtime, earn Orbs, and safely store Gift Codes.',
    ja: 'Discordクエストの自動化、プレイ時間計測、Orbs獲得、ギフトコード管理を一括で行うダッシュボード。',
    ko: 'Discord 퀘스트 자동화, 백그라운드 플레이 시간 누적, Orbs 획득 및 기프트 코드 보관을 위한 대시보드.',
    zh: '自动化完成 Discord 任务、挂机累计游戏时长、获取 Orbs 并安全保存礼品码的控制台。'
  }],
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

  // Table Headers (Accounts, Quests, Rewards)
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

  // Quests & Rewards Status/Types/Actions
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
  ['Mở trên Discord', { en: 'Open on Discord', ja: 'Discordで開く', ko: 'Discord에서 열기', zh: '在 Discord 中打开' }],
  ['Chạy', { en: 'Run', ja: '実行', ko: '실행', zh: '运行' }],
  ['Xong', { en: 'Done', ja: '完了', ko: '완료', zh: '完成' }],
  ['Chuyển', { en: 'Switch', ja: '切替', ko: '전환', zh: '切换' }],
  ['Xóa', { en: 'Delete', ja: '削除', ko: '삭제', zh: '删除' }],

  // Badges & HypeSquad
  ['Rời HypeSquad', { en: 'Leave HypeSquad', ja: 'HypeSquadを離脱', ko: 'HypeSquad 탈퇴', zh: '退出 HypeSquad' }],
  ['Đang sở hữu', { en: 'Owned', ja: '所持中', ko: '보유 중', zh: '已拥有' }],
  ['Huy hiệu trên hồ sơ', { en: 'Profile Badges', ja: 'プロフィールバッジ', ko: '프로필 배지', zh: '个人资料徽章' }],
  ['Xem tất cả huy hiệu', { en: 'View All Badges', ja: 'すべてのバッジを見る', ko: '모든 배지 보기', zh: '查看全部徽章' }],
  ['Quả Cảm', { en: 'Bravery', ja: 'ブレイブ', ko: '용기', zh: '无畏' }],
  ['Lỗi Lạc', { en: 'Brilliance', ja: 'ブリリアンス', ko: '탁월함', zh: '卓越' }],
  ['Cân Bằng', { en: 'Balance', ja: 'バランス', ko: '균형', zh: '平衡' }],

  // Playtime Runner
  ['Cấu Hình Chạy', { en: 'Run Configuration', ja: '実行設定', ko: '실행 설정', zh: '运行配置' }],
  ['Chế độ', { en: 'Mode', ja: 'モード', ko: '모드', zh: '模式' }],
  ['Cả hai', { en: 'Both', ja: '両方', ko: '모두', zh: '双模式' }],
  ['Giờ chơi + Số game', { en: 'Hours + Games', ja: '時間 + ゲーム数', ko: '시간 + 게임 수', zh: '时长 + 游戏数' }],
  ['Mốc 5.000+ giờ', { en: '5,000+ Hours Tier', ja: '5,000+時間目標', ko: '5,000+시간 달성', zh: '5,000+ 小时目标' }],
  ['Mốc 100+ game', { en: '100+ Games Tier', ja: '100+ゲーム目標', ko: '100+게임 달성', zh: '100+ 游戏目标' }],
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

  // Settings
  ['Tự Động Hóa Nhiệm Vụ', { en: 'Quest Automation', ja: 'クエスト自動化', ko: '퀘스트 자동화', zh: '任务自动化' }],
  ['Cơ chế tự động đăng ký và nhận phần thưởng', { en: 'Auto-enrollment and queue progression', ja: '自動参加とキュー進行設定', ko: '자동 등록 및 대기열 진행 설정', zh: '自动接取与队列推进机制' }],
  ['Tự động chuyển tiếp (Auto Next)', { en: 'Auto Next Quest', ja: '自動次へ (Auto Next)', ko: '자동 다음 퀘스트 (Auto Next)', zh: '自动切换下一任务 (Auto Next)' }],
  ['Tự động chuyển sang nhiệm vụ tiếp theo trong hàng đợi khi đạt 100%.', {
    en: 'Automatically advance to the next queued quest upon reaching 100%.',
    ja: '100%達成時に次のキューのクエストへ自動で進みます。',
    ko: '100% 달성 시 대기열의 다음 퀘스트로 자동 이동합니다.',
    zh: '任务达到 100% 时自动切换至队列中的下一个任务。'
  }],
  ['Tự động tham gia Quest (Auto Enroll)', { en: 'Auto Enroll Quest', ja: '自動クエスト参加 (Auto Enroll)', ko: '자동 퀘스트 등록 (Auto Enroll)', zh: '自动接取任务 (Auto Enroll)' }],
  ['Tự gửi yêu cầu ghi danh nhiệm vụ nếu tài khoản chưa bắt đầu.', {
    en: 'Automatically enroll in quests before sending progress.',
    ja: '未開始のクエストに自動で参加リクエストを送信します。',
    ko: '시작하지 않은 퀘스트에 자동으로 참여 요청을 보냅니다.',
    zh: '如果账号尚未开始，自动发送任务接取请求。'
  }],
  ['Tần Suất & Tiến Trình', { en: 'Intervals & Progress', ja: '送信間隔 & 進捗', ko: '전송 주기 및 진행', zh: '频率与进度' }],
  ['Điều chỉnh chu kỳ gửi tiến trình để mô phỏng tự nhiên', { en: 'Adjust heartbeat intervals for natural simulation', ja: '自然な進行を再現するため送信間隔を調整します', ko: '자연스러운 시뮬레이션을 위해 전송 주기를 조정합니다', zh: '调整进度上报周期以自然模拟' }],
  ['Chu kỳ gửi tiến trình Video', { en: 'Video Progress Interval', ja: '動画進捗の送信間隔', ko: '동영상 진행 전송 주기', zh: '视频进度上报周期' }],
  ['Khoảng nghỉ giữa các lần cập nhật xem video (Khuyến nghị: 7s).', {
    en: 'Delay between video watch progress updates (Recommended: 7s).',
    ja: '動画視聴進捗の更新間隔（推奨: 7秒）。',
    ko: '동영상 시청 진행률 업데이트 간격 (권장: 7초).',
    zh: '每次视频进度更新之间的间隔（建议: 7秒）。'
  }],
  ['Chu kỳ gửi tiến trình Chơi Game', { en: 'Game Heartbeat Interval', ja: 'ゲーム心拍の送信間隔', ko: '게임 하트비트 전송 주기', zh: '游戏心跳上报周期' }],
  ['Tần suất gửi heartbeat chơi game ngầm (Chuẩn Discord: 20s, khuyến nghị: 15-20s).', {
    en: 'Background game heartbeat frequency (Discord standard: 20s, recommended: 15-20s).',
    ja: 'バックグラウンドゲーム心拍の頻度（Discord標準: 20秒、推奨: 15〜20秒）。',
    ko: '백그라운드 게임 하트비트 주기 (Discord 표준: 20초, 권장: 15-20초).',
    zh: '后台游戏心跳发送频率（Discord 标准: 20秒，建议: 15-20秒）。'
  }],
  ['Ngẫu nhiên độ trễ (Random Jitter)', { en: 'Random Jitter', ja: 'ランダム遅延 (Jitter)', ko: '랜덤 지터 (Random Jitter)', zh: '随机延迟抖动 (Random Jitter)' }],
  ['Lệch ngẫu nhiên ±1-3 giây để giả lập người thật, tránh pattern máy móc.', {
    en: 'Add ±1–3s random variance to mimic real human activity.',
    ja: '±1〜3秒のランダムな揺らぎを追加し機械的なパターンを回避します。',
    ko: '±1~3초의 무작위 지연을 추가해 실제 사용자처럼 동작합니다.',
    zh: '增加 ±1-3 秒随机偏差以模拟真人操作，避免机械规律。'
  }],
  ['giây', { en: 'sec', ja: '秒', ko: '초', zh: '秒' }],
  ['Cài Đặt Màn Hình Chính & Chia Sẻ', { en: 'Home Screen & Sharing', ja: 'ホーム画面 & 共有設定', ko: '홈 화면 및 공유 설정', zh: '主屏幕与分享设置' }],
  ['Thêm ứng dụng ra màn hình chính điện thoại (Android & iOS)', { en: 'Install web app to mobile Home Screen (Android & iOS)', ja: 'スマホのホーム画面にアプリとして追加 (Android & iOS)', ko: '모바일 홈 화면에 앱 추가 (Android & iOS)', zh: '将应用添加到手机主屏幕 (Android & iOS)' }],
  ['Thêm vào màn hình chính (PWA)', { en: 'Add to Home Screen (PWA)', ja: 'ホーム画面に追加 (PWA)', ko: '홈 화면에 추가 (PWA)', zh: '添加到主屏幕 (PWA)' }],
  ['Mở web dạng app độc lập, full màn hình với logo Discord Quest chính chủ.', {
    en: 'Launch as a standalone fullscreen app with the official Discord Quest icon.',
    ja: '公式ロゴ付きの独立した全画面アプリとして起動します。',
    ko: '공식 로고가 포함된 독립형 전체 화면 앱으로 실행합니다.',
    zh: '以独立全屏应用模式打开，带官方 Discord Quest 图标。'
  }],

  // Modals
  ['Thêm & Xác Thực Token Discord', { en: 'Add & Verify Discord Token', ja: 'Discordトークンの追加と検証', ko: 'Discord 토큰 추가 및 인증', zh: '添加并验证 Discord Token' }],
  ['Lấy token ở đâu?', { en: 'Where to find token?', ja: 'トークンの取得方法は？', ko: '토큰은 어디서 찾나요?', zh: '如何获取 Token？' }],
  ['Dán token tại đây...', { en: 'Paste token here...', ja: 'ここにトークンを貼り付け...', ko: '여기에 토큰을 붙여넣으세요...', zh: '在此粘贴 Token...' }],
  ['Cách 1: Chạy Console (Nhanh nhất – 1 click):', { en: 'Method 1: Console Script (Fastest – 1 click):', ja: '方法1: コンソール実行（最速・1クリック）:', ko: '방법 1: 콘솔 스크립트 (가장 빠름 – 1클릭):', zh: '方式 1：控制台脚本（最快 – 一键复制）：' }],
  ['Cách 2: Lấy qua Network (Thủ công):', { en: 'Method 2: Network Tab (Manual):', ja: '方法2: Networkタブ（手動）:', ko: '방법 2: Network 탭 (수동):', zh: '方式 2：Network 面板（手动）：' }],
  ['Thêm Nhiệm Vụ Bằng Link / ID', { en: 'Add Quest by Link / ID', ja: 'リンク / ID でクエスト追加', ko: '링크 / ID로 퀘스트 추가', zh: '通过链接 / ID 添加任务' }],
  ['Link hoặc ID Quest Discord', { en: 'Discord Quest Link or ID', ja: 'DiscordクエストリンクまたはID', ko: 'Discord 퀘스트 링크 또는 ID', zh: 'Discord 任务链接或 ID' }],

  // Logs & Toasts prefixes / common messages
  ['[Đồng bộ]', { en: '[Sync]', ja: '[同期]', ko: '[동기화]', zh: '[同步]' }],
  ['[Hàng đợi]', { en: '[Queue]', ja: '[キュー]', ko: '[대기열]', zh: '[队列]' }],
  ['[Huy hiệu]', { en: '[Badges]', ja: '[バッジ]', ko: '[배지]', zh: '[徽章]' }],
  ['Đang quét danh sách nhiệm vụ...', { en: 'Scanning quest list...', ja: 'クエスト一覧をスキャン中...', ko: '퀘스트 목록 스캔 중...', zh: '正在扫描任务列表...' }],
  ['Đã dừng theo yêu cầu.', { en: 'Stopped by user request.', ja: 'ユーザー要求により停止しました。', ko: '사용자 요청으로 중지되었습니다.', zh: '已按要求停止。' }],
  ['Đang yêu cầu dừng sau đợt gửi hiện tại...', { en: 'Stopping after current batch...', ja: '現在のバッチ完了後に停止します...', ko: '현재 작업 완료 후 중지합니다...', zh: '正在请求于当前批次后停止...' }],
  ['Đã làm mới dữ liệu huy hiệu từ Discord.', { en: 'Refreshed badge data from Discord.', ja: 'Discordからバッジデータを更新しました。', ko: 'Discord에서 배지 데이터를 새로고침했습니다.', zh: '已从 Discord 刷新徽章数据。' }],
  ['Đã khôi phục cài đặt mặc định!', { en: 'Restored default settings!', ja: 'デフォルト設定に復元しました！', ko: '기본 설정으로 복원되었습니다!', zh: '已恢复默认设置！' }],
  ['Đã lưu cài đặt hệ thống!', { en: 'System settings saved!', ja: 'システム設定を保存しました！', ko: '시스템 설정이 저장되었습니다!', zh: '系统设置已保存！' }]
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

  let out = String(text);

  // Các mẫu câu log động phổ biến
  const regexRules = [
    [
      /^(\[.*?\])?\s*Gửi GET \/api\/quests \((.+?)\)\.\.\.$/,
      {
        en: '$1 Sending GET /api/quests ($2)...',
        ja: '$1 GET /api/quests を送信中 ($2)...',
        ko: '$1 GET /api/quests 전송 중 ($2)...',
        zh: '$1 正在发送 GET /api/quests ($2)...'
      }
    ],
    [
      /^(\[.*?\])?\s*Đồng bộ thành công (\d+) nhiệm vụ\.$/,
      {
        en: '$1 Synced $2 quests successfully.',
        ja: '$1 $2件のクエストを同期しました。',
        ko: '$1 퀘스트 $2개 동기화 완료.',
        zh: '$1 成功同步 $2 个任务。'
      }
    ],
    [
      /^Bắt đầu cày (\d+) game mới \(đã lọc (\d+) game từng chạy\)\.\.\.$/,
      {
        en: 'Starting $1 fresh games ($2 already-played filtered out)...',
        ja: '新規ゲーム$1件を開始中（プレイ済み$2件を除外）...',
        ko: '새 게임 $1개 시작 중 (기실행 $2개 제외)...',
        zh: '开始刷 $1 款新游戏（已过滤 $2 款已玩游戏）...'
      }
    ],
    [
      /^Bắt đầu cày (\d+) game\.\.\.$/,
      {
        en: 'Starting $1 games...',
        ja: '$1件のゲームを開始中...',
        ko: '$1개 게임 시작 중...',
        zh: '开始运行 $1 款游戏...'
      }
    ],
    [
      /^\[(\d+)\/(\d+)\] Hoàn tất: (.+)$/,
      {
        en: '[$1/$2] Completed: $3',
        ja: '[$1/$2] 完了: $3',
        ko: '[$1/$2] 완료: $3',
        zh: '[$1/$2] 已完成: $3'
      }
    ],
    [
      /^(\d+) đang chạy • (\d+) trong hàng đợi • (\d+)\/(\d+) xong$/,
      {
        en: '$1 running • $2 queued • $3/$4 done',
        ja: '実行中 $1 • 待機 $2 • 完了 $3/$4',
        ko: '실행 $1 • 대기 $2 • 완료 $3/$4',
        zh: '$1 运行中 • $2 排队 • $3/$4 已完成'
      }
    ],
    [
      /^Còn thiếu:\s*(.+)$/,
      {
        en: 'Remaining: $1',
        ja: '残り: $1',
        ko: '남은 목표: $1',
        zh: '还差: $1'
      }
    ],
    [
      /^Mốc cuối \((.+)\)$/,
      {
        en: 'Max ($1)',
        ja: '最大 ($1)',
        ko: '최대 ($1)',
        zh: '上限 ($1)'
      }
    ]
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

  return out;
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
      if (parent.hasAttribute('data-i18n')) return NodeFilter.FILTER_REJECT;
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
