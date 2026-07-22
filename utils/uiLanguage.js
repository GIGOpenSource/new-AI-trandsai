/**
 * @description 界面语言规范化：与后端 normalize_ui_language 对齐，保证 IM 的 lang 与 i18n 一致。
 */

const SUPPORTED = new Set(["zh", "en", "ja", "ko", "pt", "es", "id"]);

/**
 * 将任意语言标识规范化为受支持的 UI 语言代码。
 * @param {string|null|undefined} lang - 原始语言标识（如 zh-CN、en_US）
 * @returns {string} 规范后的语言代码（zh/en/ja/ko/pt/es/id），默认 "zh"，未知语言回退 "en"
 */
export function normalizeUiLang(lang) {
  if (!lang || typeof lang !== "string") return "zh";
  const cleaned = lang.trim().replace(/_/g, "-");
  const lower = cleaned.toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  const base = cleaned.split("-")[0]?.toLowerCase() ?? "";
  if (base && SUPPORTED.has(base)) return base;
  return "en";
}
