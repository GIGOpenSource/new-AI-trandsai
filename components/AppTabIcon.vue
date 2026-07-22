<script setup>
/**
 * @file AppTabIcon.vue
 * @description Tab / 回顶图标（简易 SVG path）：name = home|messages|discover|profile|arrow-up。
 */
defineProps({
  name: {
    type: String,
    required: true,
    validator: (v) =>
      ["home", "messages", "discover", "profile", "arrow-up"].includes(v),
  },
  active: { type: Boolean, default: false },
});
</script>

<template>
  <view class="tab-icon-svg" :class="{ active }">
    <!-- uni-app 无原生 svg 组件时用 text 符号兜底；H5 可用 image+data-uri，此处用 emoji 风格字符保证多端 -->
    <text class="icon-glyph" :class="{ active }">
      {{
        name === "home"
          ? "⌂"
          : name === "messages"
            ? "💬"
            : name === "discover"
              ? "◎"
              : name === "profile"
                ? "☺"
                : "↑"
      }}
    </text>
  </view>
</template>

<style scoped lang="scss">
.tab-icon-svg {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-glyph {
  font-size: 40rpx;
  line-height: 1;
  color: var(--fg-muted);
  opacity: 0.85;
  &.active {
    color: var(--fg);
    opacity: 1;
  }
}
</style>
