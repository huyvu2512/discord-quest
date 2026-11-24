/**
 * INTERNATIONALIZATION (i18n) UTILITY (js/utils/i18n.js)
 * Tự động nhận diện ngôn ngữ trình duyệt và hỗ trợ chuyển đổi đa ngôn ngữ.
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
    btn_add_acc: 'Thêm Tài Khoản',
    btn_clear_logs: 'Xóa Logs',
    btn_reset_settings: 'Khôi phục mặc định',
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
    btn_add_acc: 'Add Account',
    btn_clear_logs: 'Clear Logs',
    btn_reset_settings: 'Reset Defaults',
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
    btn_add_acc: 'アカウント追加',
    btn_clear_logs: 'ログ消去',
    btn_reset_settings: '初期設定に戻す',
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
    btn_add_acc: '계정 추가',
    btn_clear_logs: '로그 지우기',
    btn_reset_settings: '기본값 복원',
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
    btn_add_acc: '添加账号',
    btn_clear_logs: '清空日志',
    btn_reset_settings: '恢复默认',
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
};

window.setAppLang = function(lang) {
  const next = SUPPORTED_LANGS.includes(lang) ? lang : detectBrowserLang();
  try {
    localStorage.setItem(I18N_STORAGE_KEY, next);
  } catch {}
  window.applyI18n();
  if (typeof renderAll === 'function') renderAll();
};
