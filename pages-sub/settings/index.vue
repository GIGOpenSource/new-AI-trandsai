<script setup>
/**
 * @file pages-sub/settings — 通知设置
 * @description 本地开关（推送偏好等）读写 storage，与 React 版键名对齐。
 * @depends storage
 */
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import { getItem, setItem } from "@/utils/storage";
import { bindAnalyticsTap, trackButtonClick } from "@/utils/analytics";

const STORAGE_KEY = "notification_prefs";

// ——— 偏好读写 ———
function loadPrefs() {
  try {
    const raw = getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { moments: true, messages: true, system: true, sound: true, email: false };
}

const { t } = useI18n();
const prefs = ref(loadPrefs());

watch(prefs, (v) => setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true });

// ——— 开关项 ———
const items = [
  { key: "moments", icon: "🔗", label: () => t("notification.moments"), desc: () => t("notification.momentsDesc") },
  { key: "messages", icon: "💬", label: () => t("notification.messages"), desc: () => t("notification.messagesDesc") },
  { key: "system", icon: "🔔", label: () => t("notification.system"), desc: () => t("notification.systemDesc") },
  { key: "sound", icon: "🔊", label: () => t("notification.sound"), desc: () => t("notification.soundDesc") },
  { key: "email", icon: "✉️", label: () => t("notification.email"), desc: () => t("notification.emailDesc") },
];

function toggle(key) {
  trackButtonClick(`notification-toggle-${key}`, `通知开关-${key}`);
  prefs.value[key] = !prefs.value[key];
}
</script>

<template>
  <AppPageShell
    :title="t('profile.notificationSettings')"
    :show-back="true"
    back-analytics-id="notification-settings-back"
    back-analytics-name="通知设置页返回"
  >
    <view class="px-md py-sm">
      <text class="text-muted tip">{{ t("notification.tip") }}</text>
      <view v-for="item in items" :key="item.key" class="card row mt-md">
        <text class="icon">{{ item.icon }}</text>
        <view class="flex-1">
          <text class="label">{{ item.label() }}</text>
          <text class="text-muted desc">{{ item.desc() }}</text>
        </view>
        <view class="switch" :class="{ on: prefs[item.key] }" @tap="toggle(item.key)">
          <view class="knob" />
        </view>
      </view>
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.tip { display: block; font-size: 26rpx; margin-bottom: 16rpx; }
.row { display: flex; align-items: center; gap: 16rpx; padding: 24rpx; }
.icon { font-size: 36rpx; }
.label { display: block; font-weight: 500; }
.desc { display: block; font-size: 24rpx; margin-top: 4rpx; }
.switch {
  width: 96rpx; height: 56rpx; border-radius: 999px; background: var(--bg-input); position: relative;
  &.on { background: var(--brand); }
}
.knob {
  position: absolute; top: 4rpx; left: 4rpx; width: 48rpx; height: 48rpx;
  background: #fff; border-radius: 50%; transition: transform 0.2s;
  .on & { transform: translateX(40rpx); }
}
.flex-1 { flex: 1; }
</style>
