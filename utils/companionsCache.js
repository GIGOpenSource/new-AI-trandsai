/**
 * @file companionsCache.js
 * @description 伴侣列表内存 + 本地双重缓存，降低发现页/首页条带重复请求。
 *
 * 设计：
 * - 内存 Map：同页多次读即时命中
 * - Storage（TTL 60s）：冷启动可先出 UI
 * - inflight：同一 key 并发请求合并为一次网络
 *
 * @depends api.js（apiFetch）、storage.js
 * @usedBy pages/discover、pages/home、pages-sub/my-companions 等
 */

import { apiFetch } from "./api";
import { getItem, setItem, removeKeysWithPrefix } from "./storage";

/** 缓存有效期：60 秒 */
const CACHE_TTL_MS = 60_000;
/** 本地存储键前缀 */
const LS_PREFIX = "companions_cache_v1:";
/** 进程内内存缓存：key → { data, ts } */
const cache = new Map();
/** 进行中的请求：key → Promise，用于去重 */
const inflight = new Map();

/**
 * 将查询参数对象规范为稳定字符串键（键名排序，保证等价 params 命中同一缓存）
 * @param {Record<string, *>} params
 * @returns {string}
 */
function cacheKey(params) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] ?? ""}`)
    .join("&");
  return sorted || "default";
}

/**
 * 从本地存储读取未过期缓存
 * @param {string} key
 * @returns {{ data: any[], ts: number }|null}
 */
function readLsCache(key) {
  try {
    const raw = getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || Date.now() - parsed.ts >= CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 写入本地缓存（带时间戳）
 * @param {string} key
 * @param {any[]} data
 */
function writeLsCache(key, data) {
  try {
    setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* 配额不足时静默失败，不影响主流程 */
  }
}

/** 主动失效：创建/删除伴侣后调用，避免列表陈旧 */
export function invalidateCompanionsCache() {
  cache.clear();
  removeKeysWithPrefix(LS_PREFIX);
}

/**
 * 同步读取缓存（不发网络）。先内存后本地。
 * @param {Record<string, *>} [params]
 * @returns {any[]|null}
 */
export function getCachedCompanions(params = {}) {
  const key = cacheKey(params);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.data;
  const ls = readLsCache(key);
  if (ls) {
    cache.set(key, ls);
    return ls.data;
  }
  return null;
}

/**
 * 拉取伴侣列表：优先缓存，miss 时请求 `/companions?...`
 * @param {Record<string, *>} [params] 查询参数（lang、gender 等）
 * @param {{ force?: boolean }} [options] force=true 跳过缓存强制刷新
 * @returns {Promise<any[]>}
 */
export async function fetchCompanions(params = {}, options = {}) {
  const key = cacheKey(params);
  const now = Date.now();

  // 非强制：走缓存 / 合并 inflight
  if (!options.force) {
    const hit = cache.get(key);
    if (hit && now - hit.ts < CACHE_TTL_MS) return hit.data;
    const ls = readLsCache(key);
    if (ls) {
      cache.set(key, ls);
      return ls.data;
    }
    const pending = inflight.get(key);
    if (pending) return pending;
  }

  // 组装查询串
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  const url = `/companions${qs.toString() ? `?${qs}` : ""}`;

  const promise = apiFetch(url)
    .then((data) => {
      const list = Array.isArray(data) ? data : [];
      const entry = { data: list, ts: Date.now() };
      cache.set(key, entry);
      writeLsCache(key, list);
      return list;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
