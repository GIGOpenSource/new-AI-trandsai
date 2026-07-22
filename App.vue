<script setup>
/**
 * @file App.vue
 * @description 应用根组件：全局生命周期钩子 + 注入全局 SCSS。
 * 模板为空 view：真实 UI 由 pages.json 路由页面渲染。
 *
 * onLaunch：语言变更 → 通知 chat；H5 全局按钮埋点；首次页面浏览埋点
 * onShow：App 回到前台 → chat 重连/同步；再次页面浏览埋点（去重）
 * onHide：冲刷埋点队列，减少丢失与后台积压
 */
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useChatStore } from "@/stores/chat";
import { i18n } from "@/i18n";
import { watch } from "vue";
import { isLoggedIn } from "@/composables/useAuth";
import {
  setupGlobalButtonTracking,
  trackCurrentPageIfChanged,
  flushAnalyticsQueue,
} from "@/utils/analytics";

onLaunch(() => {
  const chat = useChatStore();
  // UI 语言切换时，WS 侧需带上新 lang
  watch(
    () => i18n.global.locale.value,
    () => chat.onLanguageChanged()
  );

  setupGlobalButtonTracking();

  // 预留：非公开路由未登录时可在此 reLaunch（当前首页即 login，首启安全）
  const pages = getCurrentPages();
  const route = pages[0]?.route || "";
  const publicRoutes = ["pages/login/index", "pages/register/index"];
  if (!isLoggedIn() && !publicRoutes.some((r) => route.includes(r))) {
    // 首次启动由 login 作为 pages.json 第一项处理
  }

  trackCurrentPageIfChanged();
});

onShow(() => {
  useChatStore().onAppShow();
  trackCurrentPageIfChanged();
});

onHide(() => {
  void flushAnalyticsQueue();
});
</script>

<style lang="scss">
/* 全局主题变量与基础样式，所有页面共享 */
@import "@/static/styles/theme.scss";
</style>

<template>
  <!-- 勿放占位 view：H5 上可能叠在页面上方拦截点击/输入 -->
</template>
