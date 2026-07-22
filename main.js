/**
 * @file main.js
 * @description uni-app 应用入口。必须导出 createApp()，由运行时调用。
 *
 * 启动顺序：
 * 1. createSSRApp(App) — uni-app 3 标准写法（H5/App 均可）
 * 2. Pinia — stores（chat / theme / toast / tabScroll）
 * 3. i18n — vue-i18n
 * 4. chat.setupLifecycle — 前后台、WS 生命周期
 * 5. chat.watchPersistEffects — 未读/最后消息持久化
 * 6. useThemeStore() — 初始化主题（读本地 + 写 CSS class）
 */

import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import i18n from "./i18n";
import { useChatStore } from "./stores/chat";
import { useThemeStore } from "./stores/theme";

/**
 * uni-app 约定导出；勿改为默认 export 单例
 * @returns {{ app: import('vue').App }}
 */
export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(i18n);

  // Pinia 已安装后才能 useXxxStore
  const chat = useChatStore();
  chat.setupLifecycle();
  chat.watchPersistEffects();

  // 触发主题 store 构造副作用（应用 dark/light）
  useThemeStore();

  return { app };
}
