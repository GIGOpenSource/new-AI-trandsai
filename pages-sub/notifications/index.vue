<script setup>
/**
 * @file pages-sub/notifications — 通知列表
 * @description 聚合：新动态、AI 回复评论、系统通知。聊天未读只在 IM 列表展示。
 * @depends apiFetch、storage、utils/notifications
 */
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppMomentImage from "@/components/AppMomentImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth } from "@/composables/useAuth";
import { getItem, setItem } from "@/utils/storage";
import { deviceHeaders } from "@/utils/device";
import apiFetch from "@/utils/api";
import { readHomeMomentsCache } from "@/utils/homeCache";
import { useRelativeTime } from "@/composables/useRelativeTime";
import {
  buildMomentPostItems,
  buildMomentReplyItems,
  mergeMomentsComments,
  parseStoredIdList,
  readViewedReplyIds,
  writeViewedReplyIds,
} from "@/utils/notifications";

const { t, locale } = useI18n();
const { format: formatTime } = useRelativeTime("messages");
requireAuth();

const notifications = ref([]);
const filter = ref("all");

const filtered = computed(() =>
  filter.value === "all"
    ? notifications.value
    : notifications.value.filter((n) => n.type === filter.value)
);

const tabs = computed(() => [
  ["all", t("notifications.tabAll")],
  ["moment", t("notification.moments")],
  ["system", t("notification.system")],
]);

function buildFromMoments(moments) {
  const lastViewed = getItem("moments_last_viewed");
  const viewedReplies = readViewedReplyIds();
  return [
    ...buildMomentPostItems(moments, lastViewed, t),
    ...buildMomentReplyItems(moments, viewedReplies, t),
  ];
}

function hydrateFromHomeCache() {
  const cached = readHomeMomentsCache();
  if (!cached?.length) return false;
  const list = buildFromMoments(cached);
  list.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  notifications.value = list;
  return true;
}

hydrateFromHomeCache();
const loading = ref(!notifications.value.length);

async function safeFetch(label, fn) {
  try {
    return await fn();
  } catch (e) {
    console.error(`加载${label}失败:`, e);
    return null;
  }
}

async function loadNotifications(silent = false) {
  if (!silent && !notifications.value.length) loading.value = true;
  try {
    const [momentsRes, sysRes] = await Promise.all([
      safeFetch("朋友圈", () =>
        apiFetch(`/api/moments?limit=20&lang=${encodeURIComponent(locale.value || "zh")}`, {
          header: deviceHeaders(),
        })
      ),
      safeFetch("系统通知", () =>
        apiFetch(`/api/notifications?language=${locale.value}&limit=20`)
      ),
    ]);

    const moments = mergeMomentsComments(
      momentsRes?.moments || [],
      readHomeMomentsCache() || []
    );
    const list = [...buildFromMoments(moments)];

    const viewedKey = `sys_notifications_viewed_${locale.value}`;
    let viewedIds = parseStoredIdList(getItem(viewedKey));

    for (const n of sysRes?.notifications || []) {
      list.push({
        id: `sys-${n.id}`,
        type: "system",
        title: n.title,
        content: n.content,
        time: n.created_at,
        read: viewedIds.includes(String(n.id)),
      });
    }

    list.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

    setItem("moments_last_viewed", new Date().toISOString());
    const replyIds = list.filter((n) => n.replyId).map((n) => n.replyId);
    if (replyIds.length) {
      writeViewedReplyIds([...readViewedReplyIds(), ...replyIds]);
    }
    if (sysRes?.notifications) {
      setItem(
        viewedKey,
        JSON.stringify((sysRes.notifications || []).map((n) => n.id))
      );
    }

    notifications.value = list.map((n) => ({ ...n, read: true }));
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadNotifications(!!notifications.value.length));

function handleClick(item) {
  if (item.type === "moment" && item.momentId) {
    uni.navigateTo({ url: `/pages-sub/moment/index?id=${item.momentId}` });
  }
}
</script>

<template>
  <AppPageShell
    :title="t('notifications.title')"
    :show-back="true"
    back-analytics-id="notifications-back"
    back-analytics-name="通知页返回"
  >
    <view class="tabs flex-row px-md">
      <text
        v-for="tab in tabs"
        :key="tab[0]"
        :class="{ active: filter === tab[0] }"
        @tap="filter = tab[0]"
      >{{ tab[1] }}</text>
    </view>

    <view class="list-region">
      <AppListSkeleton v-if="loading && !notifications.length" />
      <view v-else-if="!filtered.length" class="center text-muted py-lg">{{ t("notifications.empty") }}</view>
      <view v-else>
        <view
          v-for="item in filtered"
          :key="item.id"
          class="notif-row"
          :class="{ unread: !item.read }"
          @tap="handleClick(item)"
        >
          <AppAvatarImage v-if="item.avatar" :src="item.avatar" :seed="item.companionId || item.id" size="sm" />
          <view v-else class="icon-wrap">{{ item.type === "moment" ? "📷" : "ℹ️" }}</view>
          <view class="flex-1">
            <view class="flex-row justify-between">
              <text class="title">{{ item.title }}</text>
              <text class="text-muted time">{{ formatTime(item.time) }}</text>
            </view>
            <text class="text-muted snippet">{{ item.content }}</text>
            <AppMomentImage v-if="item.imageUrl" :src="item.imageUrl" img-class="thumb" />
          </view>
        </view>
      </view>
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.tabs text {
  flex: 1; text-align: center; padding: 20rpx 8rpx; color: var(--fg-muted); font-size: 24rpx;
  &.active { color: var(--brand); border-bottom: 2px solid var(--brand); }
}
.center { text-align: center; padding: 80rpx 0; }
.notif-row {
  display: flex; gap: 16rpx; padding: 24rpx 32rpx; border-bottom: 1px solid var(--border);
  &.unread { background: color-mix(in srgb, var(--brand) 6%, transparent); }
}
.icon-wrap { width: 64rpx; height: 64rpx; border-radius: 50%; background: var(--bg-input); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.title { font-weight: 500; font-size: 28rpx; }
.time { font-size: 22rpx; }
.snippet { display: block; font-size: 26rpx; margin-top: 8rpx; overflow: hidden; max-height: 80rpx; }
.thumb { width: 128rpx; height: 128rpx; border-radius: 12rpx; margin-top: 12rpx; }
.flex-1 { flex: 1; min-width: 0; }
.py-lg { padding: 80rpx 0; }
</style>
