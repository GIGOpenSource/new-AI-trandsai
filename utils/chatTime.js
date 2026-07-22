/**
 * @description 聊天消息时间格式化工具：将 ISO 时间转为界面语言对应的本地时间/日期展示。
 */

/**
 * 将界面语言代码解析为 `toLocaleTimeString` / `toLocaleDateString` 可用的 locale 字符串。
 * @param {string} lang - 界面语言代码（如 zh、en-US）
 * @returns {string} BCP 47 locale（如 zh-CN、en-US）
 */
export function resolveMessageLocale(lang) {
  const base = (lang || "zh").split("-")[0]?.toLowerCase() || "zh";
  const map = {
    zh: "zh-CN",
    en: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
    pt: "pt-BR",
    es: "es-ES",
    id: "id-ID",
  };
  return map[base] || lang || "zh-CN";
}

/**
 * 格式化单条消息的发送时间（仅时分，不含日期）。
 * @param {string|number|Date} isoOrDate - ISO 字符串、时间戳或 Date 对象
 * @param {string} lang - 界面语言代码
 * @returns {string} 本地化时间字符串，无效输入返回空字符串
 */
export function formatMessageTime(isoOrDate, lang) {
  const d =
    typeof isoOrDate === "object"
      ? isoOrDate
      : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(resolveMessageLocale(lang), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化当前时刻的消息时间（用于「正在输入」等实时场景）。
 * @param {string} lang - 界面语言代码
 * @returns {string} 本地化时间字符串
 */
export function formatNowMessageTime(lang) {
  return formatMessageTime(new Date(), lang);
}

/**
 * 获取本地时区下某天的零点时间戳。
 * @param {Date} d - 日期对象
 * @returns {number} 毫秒时间戳
 */
function _startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * 聊天列表日期分隔文案：今天 / 昨天 / 其余显示本地化具体日期。
 * @param {string} iso - ISO 时间字符串
 * @param {string} lang - 界面语言代码
 * @returns {string} 分隔标签文案，无效输入返回空字符串
 */
export function formatChatDateSeparator(iso, lang) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sd = _startOfLocalDay(d);
  const sn = _startOfLocalDay(now);
  const diffDays = Math.round((sn - sd) / 86400000);
  const base = (lang || "zh").split("-")[0]?.toLowerCase() || "zh";
  const today = {
    zh: "今天",
    en: "Today",
    ja: "今日",
    ko: "오늘",
    pt: "Hoje",
    es: "Hoy",
    id: "Hari ini",
  };
  const yesterday = {
    zh: "昨天",
    en: "Yesterday",
    ja: "昨日",
    ko: "어제",
    pt: "Ontem",
    es: "Ayer",
    id: "Kemarin",
  };
  if (diffDays === 0) return today[base] || today.en;
  if (diffDays === 1) return yesterday[base] || yesterday.en;
  const loc = resolveMessageLocale(lang);
  if (base === "zh") {
    return d.toLocaleDateString(loc, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return d.toLocaleDateString(loc, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * 从 ISO 时间生成日历日唯一键（用于消息分组）。
 * @param {string} iso - ISO 时间字符串
 * @returns {string} 形如 YYYY-M-D 的键，无效输入返回空字符串
 */
export function calendarDayKeyFromIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
