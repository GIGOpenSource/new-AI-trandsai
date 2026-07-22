/**
 * @file api.js
 * @description 统一 HTTP API 客户端（uni-app 版）
 *
 * 设计目标（对齐本目录架构）：
 * 1. 与 React `client/src/app/utils/api.ts` 契约一致（路径、401、toast）
 * 2. 底层使用 `uni.request`，适配 H5 / App，不依赖 `window.fetch`
 * 3. 鉴权头委托 `authHeaders.js`；本地清 token 委托 `storage.js`
 * 4. Toast 委托 `stores/toast.js`，避免在 utils 里直接操作 UI 细节
 * 5. 文件上传走 `device.js` 的 `uni.uploadFile`，本文件的 `api.upload`
 *    仅用于 H5 FormData 场景；App 端请优先 `uploadImage`
 *
 * 调用约定（uni 风格，全项目统一）：
 * - options.header  — 请求头（不是 fetch 的 headers）
 * - options.data    — 请求体（对象会 JSON.stringify；字符串原样发送）
 * - options.method  — GET / POST / PUT / DELETE …
 *
 * 导出：
 * - apiFetch / default — 需登录的业务请求，成功返回 JSON/data
 * - rawFetch           — 登录/注册专用，返回 { ok, status, data }，不触发 401 跳转
 * - api / apiUpload    — get/post/put/delete/upload 便捷封装
 */

import { removeItem } from "./storage";
import { getAuthHeaders } from "./authHeaders";
import { showToast } from "../stores/toast";

/** 生产构建写入；H5 开发留空则走 vite 相对路径代理 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
/** 业务 REST 默认超时（ms）；弱网尽快失败，避免挂死连接与 loading */
const DEFAULT_TIMEOUT_MS = 15000;
/** 登录/注册可稍长 */
const AUTH_TIMEOUT_MS = 20000;

/**
 * 拼接完整 URL：绝对地址原样返回，相对路径加 API_BASE
 * @param {string} url
 * @returns {string}
 */
function buildUrl(url) {
  if (!url) return API_BASE || "/";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${path}`;
}

/**
 * 合并请求头：默认认证头 + 调用方 header；非 FormData 时补 Content-Type
 * @param {Record<string, string>} [extra]
 * @param {boolean} skipJsonContentType
 */
function mergeHeaders(extra = {}, skipJsonContentType = false) {
  const header = {
    ...getAuthHeaders(),
    ...extra,
  };
  if (!skipJsonContentType && !header["Content-Type"] && !header["content-type"]) {
    header["Content-Type"] = "application/json";
  }
  return header;
}

/**
 * 规范化请求体：对象 → JSON 字符串；已是字符串则原样；无体则 undefined
 * @param {*} data
 */
function normalizeData(data) {
  if (data == null) return undefined;
  if (typeof data === "string") return data;
  // H5 FormData：交由运行时处理（部分端需走 uploadFile，见 device.js）
  if (typeof FormData !== "undefined" && data instanceof FormData) return data;
  return JSON.stringify(data);
}

/**
 * 登录过期：清本地态并回登录页（与 React 版 window.location=/login 等价）
 */
function handle401() {
  removeItem("user_token");
  removeItem("user_info");
  showToast("登录已过期，请重新登录");
  uni.reLaunch({ url: "/pages/login/index" });
}

/**
 * 从 uni.request 成功回调里解析错误详情
 * @param {*} data
 * @param {number} status
 */
function pickErrorDetail(data, status) {
  if (data == null) return `HTTP ${status}`;
  if (typeof data === "string") return data;
  return data.detail || data.message || data.error || `HTTP ${status}`;
}

/**
 * 业务请求：自动带 token，失败 toast，401 跳登录
 *
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {Record<string, string>} [options.header]
 * @param {*} [options.data]  请求体（对象或 JSON 字符串）
 * @param {number} [options.timeout] 超时 ms，默认 15000
 * @returns {Promise<*>} 成功时一般为 JSON body；非 JSON 时返回完整 res
 */
export function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const rawData = options.data;
  const isFormData =
    typeof FormData !== "undefined" && rawData instanceof FormData;
  const header = mergeHeaders(options.header || {}, isFormData);
  const data = normalizeData(rawData);
  const fullUrl = buildUrl(url);
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      header,
      data,
      timeout,
      success(res) {
        const status = res.statusCode || 0;

        // 2xx：优先返回解析后的 JSON
        if (status >= 200 && status < 300) {
          const ct =
            res.header?.["content-type"] ||
            res.header?.["Content-Type"] ||
            "";
          let body = res.data;
          if (
            typeof body !== "object" ||
            body === null
          ) {
            if (typeof body === "string") {
              try {
                body = JSON.parse(body);
              } catch {
                /* keep string */
              }
            }
          } else if (
            typeof ct === "string" &&
            ct.includes("application/json") &&
            typeof body === "string"
          ) {
            try {
              body = JSON.parse(body);
            } catch {
              /* keep */
            }
          }

          // 运营机偶发 HTTP 200 但 body 带 error / 无 ok（鉴权包装）
          if (
            body &&
            typeof body === "object" &&
            body.ok !== true &&
            (body.error || body.detail) &&
            body.id == null &&
            body.token == null
          ) {
            const msg = pickErrorDetail(body, status);
            const error = new Error(msg);
            error.status = Number(body.status_code) || status;
            error.detail = body.detail || body.error;
            if (error.status === 401 || /登录|鉴权|权限|IsAuthenticated/i.test(msg)) {
              handle401();
            } else {
              showToast(msg || "请求失败");
            }
            reject(error);
            return;
          }

          resolve(body);
          return;
        }

        // 非 2xx：构造带 status/detail 的 Error，供页面按状态分支
        const errorData = res.data || {};
        const error = new Error(pickErrorDetail(errorData, status));
        error.status = status;
        error.detail =
          typeof errorData === "object" ? errorData.detail : undefined;

        if (status === 401) {
          handle401();
        } else if (status >= 500) {
          showToast("服务器错误，请稍后重试");
        } else {
          showToast(pickErrorDetail(errorData, status) || "请求失败");
        }
        reject(error);
      },
      fail(err) {
        console.error("网络错误:", err);
        showToast("网络错误，请检查您的网络连接或稍后重试");
        reject(new Error("网络连接失败，请检查网络"));
      },
    });
  });
}

/**
 * 未认证请求（登录/注册）：
 * - 不注入业务失败 toast（由页面展示表单错误）
 * - 不因 401 清 token / 跳转（避免登录页死循环）
 * - 返回形态接近 fetch Response：{ ok, status, data }
 *
 * @param {string} url
 * @param {object} [options]
 * @returns {Promise<{ ok: boolean, status: number, data: * }>}
 */
export function rawFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const rawData = options.data;
  const isFormData =
    typeof FormData !== "undefined" && rawData instanceof FormData;
  const header = {
    ...(options.header || {}),
  };
  if (!isFormData && !header["Content-Type"] && !header["content-type"]) {
    header["Content-Type"] = "application/json";
  }
  const data = normalizeData(rawData);
  const fullUrl = buildUrl(url);
  const timeout = options.timeout ?? AUTH_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      header,
      data,
      timeout,
      success(res) {
        const status = res.statusCode || 0;
        let body = res.data;
        if (typeof body === "string") {
          try {
            body = JSON.parse(body);
          } catch {
            /* 保持字符串 */
          }
        }
        resolve({
          ok: status >= 200 && status < 300,
          status,
          data: body,
        });
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

/**
 * 便捷方法：与 React `api` 对象同名同语义，参数适配 uni `data`
 */
export const api = {
  /** GET */
  get(url, options = {}) {
    return apiFetch(url, { ...options, method: "GET" });
  },

  /** POST JSON（data 为对象） */
  post(url, data, options = {}) {
    return apiFetch(url, { ...options, method: "POST", data });
  },

  /** PUT JSON */
  put(url, data, options = {}) {
    return apiFetch(url, { ...options, method: "PUT", data });
  },

  /** DELETE */
  delete(url, options = {}) {
    return apiFetch(url, { ...options, method: "DELETE" });
  },

  /**
   * H5 FormData 上传；App 端图片请用 `@/utils/device` 的 uploadImage
   */
  upload(url, formData, options = {}) {
    return apiFetch(url, {
      ...options,
      method: "POST",
      data: formData,
      header: { ...(options.header || {}) },
    });
  },
};

/** 兼容旧导入名 */
export const apiUpload = api.upload;

export default apiFetch;
