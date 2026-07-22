<script setup>
/**
 * @file AppTabBar.vue
 * @description 自定义底部 TabBar（替代 pages.json 原生 tabBar）。
 * - 四个主 Tab：首页 / 消息 / 发现 / 我的
 * - 消息角标：chat.totalUnread
 * - 当前 Tab 再点：若已滚动则触发回顶（tabScroll）
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useChatStore } from "@/stores/chat";
import { useTabScrollStore } from "@/stores/tabScroll";
import { readSafeArea } from "@/composables/useStatusBar";
import AppTabIcon from "./AppTabIcon.vue";

const { t } = useI18n();
const chat = useChatStore();
const tabScroll = useTabScrollStore();
const safe = computed(() => readSafeArea());

/** Tab 配置；badge 仅消息页展示未读 */
const tabs = computed(() => [
  { path: "/pages/home/index", icon: "home", label: t("nav.home") },
  { path: "/pages/messages/index", icon: "messages", label: t("nav.messages"), badge: true },
  { path: "/pages/discover/index", icon: "discover", label: t("nav.discover") },
  { path: "/pages/profile/index", icon: "profile", label: t("nav.profile") },
]);

const totalUnread = computed(() => chat.totalUnread);

function isActive(path) {
  const pages = getCurrentPages();
  const cur = pages[pages.length - 1];
  if (!cur) return false;
  const normalized = path.replace(/^\//, "");
  return cur.route === normalized;
}

function showBackToTop(path) {
  return isActive(path) && tabScroll.isScrolled(path);
}

function onTabTap(path) {
  if (isActive(path)) {
    if (tabScroll.isScrolled(path)) {
      tabScroll.requestScrollToTop(path);
    }
    return;
  }
  tabScroll.resetScroll(path);
  // 与 React 版 Tab 切换一致：替换当前页，不清空整栈（避免闪屏/异常回退）
  uni.redirectTo({
    url: path,
    fail: () => uni.reLaunch({ url: path }),
  });
}
</script>

<template>
  <view class="tab-bar" :style="{ paddingBottom: safe.safeAreaBottom + 'px' }">
    <view class="tab-bar-inner">
      <view
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-item"
        @tap="onTabTap(tab.path)"
      >
        <view style="position: relative">
          <AppTabIcon
            :name="showBackToTop(tab.path) ? 'arrow-up' : tab.icon"
            :active="isActive(tab.path)"
          />
          <view
            v-if="tab.badge && totalUnread > 0 && !showBackToTop(tab.path)"
            class="tab-badge"
          >{{ totalUnread > 99 ? "99+" : totalUnread }}</view>
        </view>
        <text
          class="tab-label"
          :class="{ active: isActive(tab.path), muted: !isActive(tab.path) }"
        >{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.tab-label {
  &.active {
    color: var(--fg);
  }
  &.muted {
    color: var(--fg-muted);
  }
}
</style>
