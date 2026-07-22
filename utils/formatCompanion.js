/**
 * @file formatCompanion.js
 * @description 伴侣资料展示格式化（年龄单位空格、性别本地化等）。
 */

/**
 * @param {unknown} locale
 * @returns {string}
 */
export function uiLangCode(locale) {
  return String(locale || "zh").split("-")[0] || "zh";
}

/**
 * 性别文案本地化（后端存 男/女/保密）
 * @param {unknown} gender
 * @param {(k: string) => string} t
 */
export function formatCompanionGender(gender, t) {
  const g = String(gender || "").trim();
  if (!g) return "";
  if (g === "男" || g === "male") return t("register.male");
  if (g === "女" || g === "female") return t("register.female");
  if (g === "保密" || g === "secret") return t("register.secret");
  return g;
}

/**
 * 年龄 + 单位（英文等拉丁单位前补空格，避免 "24years old"）
 * @param {unknown} age
 * @param {(k: string) => string} t
 */
export function formatCompanionAge(age, t) {
  if (age == null || age === "") return "";
  const unit = String(t("companionProfile.ageUnit") || "").trim();
  if (!unit) return String(age);
  const needsSpace = /^[A-Za-z]/.test(unit);
  return `${age}${needsSpace ? " " : ""}${unit}`;
}

/**
 * 名称旁元信息：年龄 · 性别 · 城市
 * @param {{ age?: unknown, gender?: unknown, city?: unknown }} profile
 * @param {(k: string) => string} t
 * @param {{ includeCity?: boolean }} [opts]
 */
export function formatCompanionMeta(profile, t, opts = {}) {
  const includeCity = opts.includeCity !== false;
  const parts = [
    formatCompanionAge(profile?.age, t),
    formatCompanionGender(profile?.gender, t),
  ];
  if (includeCity && profile?.city) parts.push(String(profile.city));
  return parts.filter(Boolean).join(" · ");
}

/**
 * 确保展示用名字是干净字符串
 * @param {unknown} name
 * @param {string} [fallback]
 */
export function formatCompanionName(name, fallback = "") {
  if (name == null) return fallback;
  if (typeof name === "string") {
    const s = name.trim();
    return s || fallback;
  }
  if (typeof name === "object" && name.name != null) {
    return formatCompanionName(name.name, fallback);
  }
  const s = String(name).trim();
  if (!s || s === "[object Object]") return fallback;
  return s;
}
