<script setup>
/**
 * @file AppPageShell.vue
 * @description 页面壳：自定义顶栏 + 安全区内边距 + 可选底部 TabBar。
 * 规则（对齐 React client）：
 * - 四个主 Tab（showTabBar）不显示返回
 * - 其余下级页默认左上角返回（可用 :show-back="false" 关闭）
 */
import { computed } from "vue";
import { readSafeArea } from "@/composables/useStatusBar";
import { trackButtonClick } from "@/utils/analytics";
import AppTabBar from "./AppTabBar.vue";

const TAB_FALLBACK = "/pages/home/index";

const props = defineProps({
  /** 顶栏标题 */
  title: String,
  /** 是否显示顶栏 */
  showHeader: { type: Boolean, default: true },
  /**
   * 是否显示返回：
   * - true / false：强制开关
   * - 未传：非 Tab 页自动显示（showTabBar=false）
   */
  showBack: { type: Boolean, default: undefined },
  /** 是否挂载底部自定义 TabBar（主 Tab 页） */
  showTabBar: { type: Boolean, default: false },
  /** 是否预留顶栏右侧插槽区域 */
  headerRight: { type: Boolean, default: false },
  /** 返回按钮埋点 ID */
  backAnalyticsId: String,
  /** 返回按钮埋点名称 */
  backAnalyticsName: String,
  /** navigateBack 失败时的兜底路径 */
  backFallbackUrl: { type: String, default: TAB_FALLBACK },
});

const emit = defineEmits(["back"]);

const safe = computed(() => readSafeArea());

const shouldShowBack = computed(() => {
  if (props.showBack === true) return true;
  if (props.showBack === false) return false;
  // 未显式传 show-back：主 Tab 不显示，下级页显示
  return !props.showTabBar;
});

const shellStyle = computed(() => ({
  paddingBottom: props.showTabBar
    ? `${safe.value.safeAreaBottom + 56}px`
    : `${safe.value.safeAreaBottom}px`,
}));

const headerStyle = computed(() => ({
  paddingTop: `${safe.value.safeAreaTop}px`,
}));

function onBack() {
  if (props.backAnalyticsId) {
    trackButtonClick(
      props.backAnalyticsId,
      props.backAnalyticsName || props.backAnalyticsId
    );
  }
  emit("back");

  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack({
      fail: () => uni.reLaunch({ url: props.backFallbackUrl }),
    });
    return;
  }
  // 栈里只有一页（如 Tab redirectTo 后再进下级又被清栈）→ 回首页
  uni.reLaunch({ url: props.backFallbackUrl });
}
</script>

<template>
  <view class="app-shell" :style="shellStyle">
    <view v-if="showHeader" class="app-header" :style="headerStyle">
      <view class="app-header-inner">
        <view class="header-side header-left">
          <view
            v-if="shouldShowBack"
            class="back-btn"
            hover-class="back-btn-hover"
            @tap.stop="onBack"
          >
            <text class="back-icon">‹</text>
          </view>
        </view>

        <view class="header-main">
          <slot name="header-title">
            <text v-if="title" class="app-title">{{ title }}</text>
            <text v-else class="app-title app-title-spacer" />
          </slot>
        </view>

        <view class="header-side header-right">
          <slot name="header-right" />
        </view>
      </view>
    </view>

    <view class="app-shell-body">
      <slot />
    </view>
    <AppTabBar v-if="showTabBar" />
  </view>
</template>

<style scoped lang="scss">
.app-shell-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg);
}

.app-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 16rpx;
  box-sizing: border-box;
  gap: 8rpx;
}

.header-side {
  width: 96rpx;
  min-height: 72rpx;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 2;
}

.header-left {
  justify-content: flex-start;
}

.header-right {
  justify-content: flex-end;
  width: auto;
  min-width: 96rpx;
}

.header-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  width: 100%;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-title-spacer {
  opacity: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.back-btn-hover {
  background: rgba(127, 127, 127, 0.18);
}

.back-icon {
  font-size: 56rpx;
  line-height: 1;
  color: var(--fg);
  font-weight: 300;
  margin-top: -4rpx;
}
</style>
