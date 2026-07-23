<script setup>
/**
 * @file AppAvatarImage.vue
 * @description 头像：normalizeMediaUrl + 失败兜底（Dicebear）；可选 generating 态。
 * size: sm | md | lg
 */
import { ref, watch, computed } from "vue";
import { normalizeMediaUrl } from "@/utils/media";

const props = defineProps({
  src: String,
  seed: String,
  size: { type: String, default: "md" },
  generating: { type: Boolean, default: false },
});

const failed = ref(false);
const displaySrc = ref("");

watch(
  () => [props.src, props.seed],
  () => {
    failed.value = false;
    displaySrc.value = props.src ? normalizeMediaUrl(props.src) || "" : "";
  },
  { immediate: true }
);

const fallback = computed(
  () =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(props.seed || "default")}`
);

const finalSrc = computed(() => {
  if (failed.value || !displaySrc.value) return fallback.value;
  return displaySrc.value;
});

function onError() {
  failed.value = true;
}
</script>

<template>
  <view class="avatar-root" :class="'size-' + size">
    <view v-if="generating" class="avatar-gen">
      <view class="spinner" />
    </view>
    <image
      v-else
      class="avatar-img"
      :src="finalSrc"
      mode="aspectFill"
      lazy-load
      @error="onError"
    />
  </view>
</template>

<style scoped lang="scss">
.avatar-root {
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-input);
  flex-shrink: 0;
}
.size-sm {
  width: 64rpx;
  height: 64rpx;
}
.size-md {
  width: 80rpx;
  height: 80rpx;
}
.size-lg {
  width: 160rpx;
  height: 160rpx;
}
.avatar-img {
  width: 100%;
  height: 100%;
}
.avatar-gen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid var(--border);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
