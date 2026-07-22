/**
 * @file storage.js
 * @description localStorage 适配层：统一走 uni 同步存储 API，屏蔽各端差异与异常。
 * @usedBy api.js、authHeaders、device、homeCache、companionsCache、theme、i18n 等依赖本地持久化的模块。
 */

/**
 * 读取字符串存储项。
 * @param {string} key 存储键
 * @returns {string|null} 存在时返回字符串；空串/缺失/异常时返回 null
 */
export function getItem(key) {
  try {
    const v = uni.getStorageSync(key);
    if (v === "" || v == null) return null;
    return typeof v === "string" ? v : String(v);
  } catch {
    return null;
  }
}

/**
 * 写入存储项（失败时静默，常见于配额不足）。
 * @param {string} key 存储键
 * @param {string} value 要写入的值
 */
export function setItem(key, value) {
  try {
    uni.setStorageSync(key, value);
  } catch {
    /* quota */
  }
}

/**
 * 删除单个存储项。
 * @param {string} key 存储键
 */
export function removeItem(key) {
  try {
    uni.removeStorageSync(key);
  } catch {
    /* ignore */
  }
}

/**
 * 读取并解析 JSON 存储项。
 * @param {string} key 存储键
 * @returns {any|null} 解析成功返回对象；缺失或解析失败返回 null
 */
export function getJson(key) {
  const raw = getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 将值序列化为 JSON 后写入。
 * @param {string} key 存储键
 * @param {any} value 可 JSON 序列化的值
 */
export function setJson(key, value) {
  setItem(key, JSON.stringify(value));
}

/**
 * 列出以指定前缀开头的全部存储键。
 * @param {string} prefix 键前缀
 * @returns {string[]} 匹配的键列表；异常时返回空数组
 */
export function keysWithPrefix(prefix) {
  try {
    const info = uni.getStorageInfoSync();
    return (info.keys || []).filter((k) => k.startsWith(prefix));
  } catch {
    return [];
  }
}

/**
 * 删除所有带指定前缀的存储键（用于缓存整批失效）。
 * @param {string} prefix 键前缀
 */
export function removeKeysWithPrefix(prefix) {
  for (const k of keysWithPrefix(prefix)) {
    removeItem(k);
  }
}
