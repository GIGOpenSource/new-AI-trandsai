/**
 * @file device.js
 * @description 设备标识与图片上传（App/H5 统一走 uni API）。
 *
 * 分层说明：
 * - getDeviceId / deviceHeaders：匿名互动（点赞评论）所需 x-device-id
 * - uploadImage / chooseAndUploadImages：multipart 上传，不走 apiFetch
 *   （uni.uploadFile 与 uni.request 行为不同）
 *
 * @depends storage.js
 * @related api.js（JSON REST）、media.js（URL 规范化）
 */

import { getItem, setItem } from "./storage";

/** 与 api.js 相同的 API 根；H5 开发留空走相对路径 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * 拼接上传地址
 * @param {string} url
 * @returns {string}
 */
function buildUrl(url) {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * 获取或生成持久化设备 ID（本地随机串）
 * @returns {string}
 */
export function getDeviceId() {
  let id = getItem("device_id");
  if (!id) {
    // 非加密 ID，仅用于区分设备维度的互动
    id = Math.random().toString(36).substring(2, 15);
    setItem("device_id", id);
  }
  return id;
}

/**
 * 返回带 x-device-id 的请求头对象，供 apiFetch options.header 合并
 * @returns {{ "x-device-id": string }}
 */
export function deviceHeaders() {
  return { "x-device-id": getDeviceId() };
}

/**
 * 上传单张本地图片到 `/api/upload/image`
 * @param {string} filePath uni.chooseImage 返回的临时路径
 * @returns {Promise<{ url: string }>}
 */
export function uploadImage(filePath) {
  const token = getItem("user_token");
  const header = {
    ...deviceHeaders(),
    ...(token ? { "x-token": token } : {}),
  };
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl("/api/upload/image"),
      filePath,
      name: "file", // 后端字段名
      header,
      success(res) {
        try {
          // uploadFile 的 data 恒为字符串，需手动 JSON.parse
          const data = JSON.parse(res.data);
          if (data.url) resolve(data);
          else reject(new Error(data.detail || "upload failed"));
        } catch {
          reject(new Error("parse upload response failed"));
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

/**
 * 选图并逐张上传，返回远端 URL 列表
 * @param {number} [max=9] 最多张数上限
 * @param {number} [existing=0] 已有张数，用于计算本次可选数量
 * @returns {Promise<string[]>}
 */
export function chooseAndUploadImages(max = 9, existing = 0) {
  const count = Math.max(1, Math.min(max - existing, 9));
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      success: async (res) => {
        const paths = res.tempFilePaths || [];
        const urls = [];
        try {
          for (const p of paths) {
            const data = await uploadImage(p);
            if (data.url) urls.push(data.url);
          }
          resolve(urls);
        } catch (e) {
          reject(e);
        }
      },
      fail: reject,
    });
  });
}
