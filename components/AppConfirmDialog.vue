<script setup>
/**
 * @file AppConfirmDialog.vue
 * @description 确认弹窗：v-model:open，confirm / 可选 destructive 样式。
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  confirmText: { type: String, default: "确定" },
  cancelText: { type: String, default: "取消" },
  destructive: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "confirm"]);

function close() {
  emit("update:open", false);
}

function onConfirm() {
  emit("confirm");
  close();
}
</script>

<template>
  <view v-if="open" class="mask" @tap="close">
    <view class="dialog card" @tap.stop>
      <text v-if="title" class="dlg-title">{{ title }}</text>
      <text v-if="description" class="dlg-desc text-muted">{{ description }}</text>
      <view class="dlg-actions flex-row">
        <button class="dlg-btn cancel" @tap="close">{{ cancelText }}</button>
        <button
          class="dlg-btn confirm"
          :class="{ destructive }"
          @tap="onConfirm"
        >
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}
.dialog {
  width: 100%;
  max-width: 600rpx;
  padding: 40rpx 32rpx 32rpx;
}
.dlg-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.dlg-desc {
  display: block;
  font-size: 28rpx;
  line-height: 1.5;
  margin-bottom: 32rpx;
}
.dlg-actions {
  gap: 20rpx;
}
.dlg-btn {
  flex: 1;
  border-radius: 40rpx;
  font-size: 28rpx;
  padding: 10rpx 0;
  border: none;
  &.cancel {
    background: var(--bg-input);
    color: var(--fg);
  }
  &.confirm {
    background: linear-gradient(90deg, var(--brand), var(--brand-end));
    color: #fff;
  }
  &.confirm.destructive {
    background: var(--destructive);
  }
}
</style>
