/**
 * GHI NHẬT KÝ HỆ THỐNG (js/utils/log.js)
 */

function addLog(level, text) {
  const time = new Date().toTimeString().split(" ")[0];
  state.logs.push({ time, level, text });
  if (state.logs.length > 300) state.logs.shift();
  if (typeof renderLogs === 'function') renderLogs();
  if (typeof renderHomeLogs === 'function') renderHomeLogs();
}
window.addLog = addLog;
