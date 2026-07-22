/**
 * @file loadPresets.js
 * @description 按 UI 语言动态 import 创建伴侣预设 JSON 与城市列表。
 * 供 pages-sub/create 使用；城市表见同目录 cities.json。
 */

/** 各语言预设人设懒加载器（减少首包体积） */
const PRESET_LOADERS = {
  zh: () => import("./presets/zh.json"),
  en: () => import("./presets/en.json"),
  ja: () => import("./presets/ja.json"),
  ko: () => import("./presets/ko.json"),
  pt: () => import("./presets/pt.json"),
  es: () => import("./presets/es.json"),
  id: () => import("./presets/id.json"),
};

/**
 * 加载指定语言的预设人设列表；未知语言回退 zh
 * @param {string} lang
 * @returns {Promise<any>}
 */
export async function loadPresetPersonas(lang) {
  const key = (lang || "zh").split("-")[0];
  const load = PRESET_LOADERS[key] ?? PRESET_LOADERS.zh;
  const mod = await load();
  return mod.default;
}

/**
 * 加载 cities.json 中对应语言的城市数组
 * @param {string} lang
 * @returns {Promise<string[]>}
 */
export async function loadCitiesByLang(lang) {
  const key = (lang || "zh").split("-")[0];
  const mod = await import("./cities.json");
  const all = mod.default;
  return all[key] ?? all.zh ?? [];
}
