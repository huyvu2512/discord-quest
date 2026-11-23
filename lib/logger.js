/**
 * SERVER CONSOLE LOGGER (api/logger.js)
 * Định dạng log terminal đồng bộ với nhật ký trên giao diện web:
 * [HH:MM:SS] [LEVEL] <nội dung>
 */

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[90m',
  info: '\x1b[38;2;88;101;242m',
  success: '\x1b[38;2;87;242;135m',
  warn: '\x1b[38;2;254;231;92m',
  error: '\x1b[38;2;237;66;69m'
};

export function serverLog(level = 'info', message = '') {
  const time = new Date().toTimeString().split(' ')[0];
  const lvl = String(level || 'info').toLowerCase();
  const color = COLORS[lvl] || COLORS.info;
  const tag = `[${lvl.toUpperCase()}]`.padEnd(9, ' ');
  console.log(`${COLORS.dim}[${time}]${COLORS.reset} ${color}${COLORS.bold}${tag}${COLORS.reset} ${message}`);
}
