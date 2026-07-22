/**
 * @file analytics.js
 * @description 埋点上报：队列聚合后优先走 `/api/analytics/batch`（一次 HTTP + 服务端一次事务）。
 * 刻意不走 apiFetch，避免未登录/401 触发 toast 或跳转登录。
 *
 * 传输策略（按优先级）：
 * 1. POST /batch — 主路径，满批/定时 flush
 * 2. H5 退后台：sendBeacon(/batch) — 页面关闭仍尽量送达
 * 3. batch 失败时回退逐条 /page-view、/button-click（兼容旧后端）
 *
 * @depends i18n、device.getDeviceId
 * @usedBy App.vue、各页面按钮
 */

import { i18n } from "@/i18n";
import { getDeviceId } from "@/utils/device";

const ANALYTICS_API = "/api/analytics";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

/** 队列满多少条立即 flush */
const BATCH_SIZE = 10;
/** 最长等待多久 flush（ms） */
const FLUSH_INTERVAL_MS = 5000;
/** 埋点请求超时（短，不阻塞业务） */
const ANALYTICS_TIMEOUT_MS = 4000;
/** 单次上报最多条数（与后端 MAX_BATCH_EVENTS 对齐，留余量） */
const MAX_FLUSH_EVENTS = 50;

/** 后端接受的语言码白名单 */
const ANALYTICS_LANG_CODES = ["zh", "en", "ja", "ko", "pt", "es", "id"];

/**
 * @typedef {{ type: 'page_view'|'button_click', page_path?: string, page_name?: string, button_id?: string, button_name?: string, device_id: string, language: string }} AnalyticsEvent
 */

/** @type {AnalyticsEvent[]} */
const queue = [];
let flushTimer = null;
let flushing = false;
let lifecycleBound = false;
/** batch 接口不可用时永久回退到单条（跨刷新持久化，避免反复 POST 405 刷控制台） */
const BATCH_UNSUPPORTED_KEY = "analytics_batch_unsupported";
let batchUnsupported = false;
try {
  // #ifdef H5
  if (typeof sessionStorage !== "undefined") {
    batchUnsupported = sessionStorage.getItem(BATCH_UNSUPPORTED_KEY) === "1";
  }
  // #endif
} catch {
  /* ignore */
}

function markBatchUnsupported() {
  batchUnsupported = true;
  try {
    // #ifdef H5
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(BATCH_UNSUPPORTED_KEY, "1");
    }
    // #endif
  } catch {
    /* ignore */
  }
}

/** 当前 UI 语言（归一到白名单，否则 en） */
function getCurrentLanguage() {
  const raw = (i18n.global.locale.value || "zh").split("-")[0].toLowerCase();
  return ANALYTICS_LANG_CODES.includes(raw) ? raw : "en";
}

/** 拼埋点 URL：有 VITE_API_BASE_URL 则绝对路径，否则相对（H5 代理） */
function analyticsUrl(path) {
  if (path.startsWith("http")) return path;
  if (API_BASE) return `${API_BASE}${path}`;
  return path;
}

/** 当前路由 path，形如 /pages/home/index */
function getCurrentPagePath() {
  const pages = getCurrentPages();
  const cur = pages[pages.length - 1];
  return cur?.route ? `/${cur.route}` : "";
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushAnalyticsQueue();
  }, FLUSH_INTERVAL_MS);
}

/**
 * 入队一条埋点；满批立即 flush
 * @param {AnalyticsEvent} event
 */
function enqueueEvent(event) {
  ensureAnalyticsLifecycle();
  queue.push(event);
  if (queue.length >= BATCH_SIZE) {
    void flushAnalyticsQueue();
  } else {
    scheduleFlush();
  }
}

/**
 * uni.request Promise 封装（静默）
 * @param {string} url
 * @param {object} data
 * @returns {Promise<{ ok: boolean, status: number }>}
 */
function requestJson(url, data) {
  return new Promise((resolve) => {
    try {
      uni.request({
        url,
        method: "POST",
        header: { "Content-Type": "application/json" },
        data,
        timeout: ANALYTICS_TIMEOUT_MS,
        success(res) {
          const status = res.statusCode || 0;
          resolve({ ok: status >= 200 && status < 300, status });
        },
        fail: () => resolve({ ok: false, status: 0 }),
      });
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

/**
 * H5：sendBeacon 发 batch（页面隐藏/关闭时最稳）
 * @param {AnalyticsEvent[]} events
 * @returns {boolean} 是否已交出浏览器队列
 */
function trySendBeaconBatch(events) {
  // #ifdef H5
  try {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.sendBeacon !== "function"
    ) {
      return false;
    }
    const url = analyticsUrl(`${ANALYTICS_API}/batch`);
    const blob = new Blob([JSON.stringify({ events })], {
      type: "application/json",
    });
    return navigator.sendBeacon(url, blob);
  } catch {
    return false;
  }
  // #endif
  // #ifndef H5
  return false;
  // #endif
}

/**
 * 逐条回退（旧后端无 /batch 时）
 * @param {AnalyticsEvent[]} events
 */
async function flushLegacyOneByOne(events) {
  for (const ev of events) {
    if (ev.type === "page_view") {
      await requestJson(analyticsUrl(`${ANALYTICS_API}/page-view`), {
        page_path: ev.page_path,
        page_name: ev.page_name,
        device_id: ev.device_id,
        language: ev.language,
      });
    } else if (ev.type === "button_click") {
      await requestJson(analyticsUrl(`${ANALYTICS_API}/button-click`), {
        button_id: ev.button_id,
        button_name: ev.button_name,
        page_path: ev.page_path,
        device_id: ev.device_id,
        language: ev.language,
      });
    }
  }
}

/**
 * 冲刷队列：优先 batch，失败则回退单条
 * 导出供 App onHide 调用
 */
export async function flushAnalyticsQueue() {
  if (flushing) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!queue.length) return;
  flushing = true;
  try {
    while (queue.length) {
      const chunk = queue.splice(0, MAX_FLUSH_EVENTS);

      // 退后台：优先 Beacon（不阻塞卸载）
      // #ifdef H5
      try {
        if (
          typeof document !== "undefined" &&
          document.visibilityState === "hidden" &&
          !batchUnsupported &&
          trySendBeaconBatch(chunk)
        ) {
          continue;
        }
      } catch {
        /* fallthrough */
      }
      // #endif

      if (!batchUnsupported) {
        const res = await requestJson(analyticsUrl(`${ANALYTICS_API}/batch`), {
          events: chunk,
        });
        if (res.ok) continue;
        // 404/405：后端未部署 batch，本会话改走 legacy
        if (res.status === 404 || res.status === 405) {
          markBatchUnsupported();
        } else if (res.status === 0) {
          // 网络失败：丢弃本批（埋点允许丢），避免无限重试拖垮设备
          continue;
        } else {
          // 其它错误也回退一次，保证尽量入库
          await flushLegacyOneByOne(chunk);
          continue;
        }
      }

      await flushLegacyOneByOne(chunk);
    }
  } finally {
    flushing = false;
    if (queue.length) scheduleFlush();
  }
}

/** 绑定退后台自动 flush（只绑一次） */
function ensureAnalyticsLifecycle() {
  if (lifecycleBound) return;
  lifecycleBound = true;
  try {
    uni.onAppHide(() => {
      void flushAnalyticsQueue();
    });
  } catch {
    /* ignore */
  }
  // #ifdef H5
  try {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          void flushAnalyticsQueue();
        }
      });
    }
  } catch {
    /* ignore */
  }
  // #endif
}

/** 页面浏览 */
export function trackPageView(pagePath, pageName) {
  enqueueEvent({
    type: "page_view",
    page_path: pagePath,
    page_name: pageName,
    device_id: getDeviceId(),
    language: getCurrentLanguage(),
  });
}

/** 按钮点击 */
export function trackButtonClick(buttonId, buttonName, pagePath) {
  enqueueEvent({
    type: "button_click",
    button_id: buttonId,
    button_name: buttonName,
    page_path: pagePath || getCurrentPagePath(),
    device_id: getDeviceId(),
    language: getCurrentLanguage(),
  });
}

/**
 * uni 路径与 React 历史路径 → 中文页名（与后端/报表对齐）
 */
const PAGE_NAME_MAP = {
  "/pages/login/index": "登录页",
  "/pages/register/index": "注册页",
  "/pages/home/index": "首页",
  "/pages/messages/index": "消息列表页",
  "/pages/discover/index": "发现页",
  "/pages/profile/index": "个人中心",
  "/pages/chat/index": "聊天页",
  "/pages-sub/companion/index": "伴侣详情页",
  "/pages-sub/create/index": "创建伴侣页",
  "/pages-sub/feedback/index": "反馈页",
  "/pages-sub/my-companions/index": "我的伴侣页",
  "/pages-sub/intimacy/index": "亲密度记录页",
  "/pages-sub/my-posts/index": "我的帖子页",
  "/pages-sub/settings/index": "通知设置页",
  "/pages-sub/notifications/index": "通知页",
  "/pages-sub/privacy/index": "隐私政策",
  "/pages-sub/moment/index": "朋友圈详情",
  "/pages-sub/post/index": "帖子详情",
  "/pages-sub/not-found/index": "404",
  // React 时代路径兼容
  "/": "登录页",
  "/register": "注册页",
  "/home": "首页",
  "/messages": "消息列表页",
  "/discover": "发现页",
  "/profile": "个人中心",
  "/chat": "聊天页",
  "/companion": "伴侣详情页",
  "/create": "创建伴侣页",
  "/feedback": "反馈页",
  "/my-companions": "我的伴侣页",
  "/intimacy-record": "亲密度记录页",
  "/my-posts": "我的帖子页",
  "/notification-settings": "通知设置页",
};

export function getPageName(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (PAGE_NAME_MAP[normalized]) return PAGE_NAME_MAP[normalized];
  for (const [key, name] of Object.entries(PAGE_NAME_MAP)) {
    if (normalized.startsWith(`${key}/`) || normalized.startsWith(`${key}?`)) {
      return name;
    }
  }
  if (normalized.includes("/chat/") || normalized.includes("pages/chat")) return "聊天页";
  if (normalized.includes("/companion/") || normalized.includes("companion/index")) return "伴侣详情页";
  return normalized;
}

/** 上次已上报路由，避免 onShow 重复刷浏览 */
let lastTrackedRoute = "";

export function trackCurrentPageIfChanged() {
  const path = getCurrentPagePath();
  if (!path || path === lastTrackedRoute) return;
  lastTrackedRoute = path;
  trackPageView(path, getPageName(path));
}

/**
 * 包装无参点击：先埋点再执行。
 * 模板用法：@tap="bindAnalyticsTap('id', handler, 'name')"
 * （Vue 点击时会调用本函数本身，因此这里直接执行，不再返回闭包）
 * 脚本里同样直接调用，不要再加一层 ()。
 */
export function bindAnalyticsTap(buttonId, handler, buttonName) {
  trackButtonClick(buttonId, buttonName || buttonId);
  handler?.();
}

/** 包装带参点击；buttonId/Name 可为函数 */
export function bindAnalyticsTapArg(buttonId, handler, buttonName) {
  return (arg) => {
    const id = typeof buttonId === "function" ? buttonId(arg) : buttonId;
    const name =
      typeof buttonName === "function"
        ? buttonName(arg)
        : buttonName || id;
    trackButtonClick(id, name);
    handler(arg);
  };
}

/** 仅埋点、无后续逻辑 */
export function tapAnalytics(buttonId, buttonName) {
  trackButtonClick(buttonId, buttonName || buttonId);
}

/**
 * H5：捕获带 data-analytics-button 属性的点击
 * App 端请用 bindAnalyticsTap / trackButtonClick
 */
export function setupGlobalButtonTracking() {
  ensureAnalyticsLifecycle();
  // #ifdef H5
  if (typeof document === "undefined") return;
  document.addEventListener("click", (e) => {
    const target = e.target;
    const trackable = target?.closest?.("[data-analytics-button]");
    if (!trackable) return;
    const buttonId = trackable.getAttribute("data-analytics-button") || "";
    const btnName = trackable.getAttribute("data-analytics-name") || buttonId;
    const pagePath = trackable.getAttribute("data-analytics-page") || getCurrentPagePath();
    if (buttonId) trackButtonClick(buttonId, btnName, pagePath);
  });
  // #endif
}
