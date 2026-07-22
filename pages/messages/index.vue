<script setup>
/**
 * @file pages/messages — 消息 Tab：会话列表
 * @description 基于 companions + chat.lastMessages/unread 组装会话；点击进入聊天页。
 * @depends stores/chat、companionsCache、AppPageShell(show-tab-bar)
 */
import { ref, computed, watch } from "vue";
import { onShow, onPageScroll } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth, isLoggedIn } from "@/composables/useAuth";
import { useChatStore } from "@/stores/chat";
import { fetchCompanions, getCachedCompanions } from "@/utils/companionsCache";
import { useRelativeTime } from "@/composables/useRelativeTime";
import { showToast } from "@/stores/toast";
import { bindAnalyticsTap, bindAnalyticsTapArg } from "@/utils/analytics";
import { useTabScrollStore } from "@/stores/tabScroll";
import { formatCompanionName } from "@/utils/formatCompanion";

const TAB_PATH = "/pages/messages/index";
const tabScroll = useTabScrollStore();

const MESSAGES_FILTER = { filter_type: "mine_chatted" };
const { t } = useI18n();
const chat = useChatStore();
const { format: formatRelativeTime } = useRelativeTime("messages");
requireAuth();

// ——— 状态 ———

const initialCached = getCachedCompanions(MESSAGES_FILTER) ?? [];

// ——— 组装会话 ———

/** 将伴侣列表与 chat store 组装为会话行 */
function buildConversations(companions) {
  const list = companions.map((c) => {
    const profile = c.profile || {};
    const id = String(profile.id || "");
    const lastMsg = chat.lastMessages[id];
    return {
      id,
      name: formatCompanionName(profile.name, t("chat.defaultName")),
      avatar:
        c.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id || "default")}`,
      lastMessage: lastMsg?.text || c.last_message || "",
      time: lastMsg?.fullTime
        ? formatRelativeTime(lastMsg.fullTime)
        : formatRelativeTime(c.last_message_time),
      rawTime: lastMsg?.fullTime || c.last_message_time || "",
      unread: chat.unreadCounts[id] || 0,
      avatar_generating: c.avatar_generating,
    };
  });
  list.sort((a, b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    const aTime = a.rawTime ? new Date(a.rawTime).getTime() : 0;
    const bTime = b.rawTime ? new Date(b.rawTime).getTime() : 0;
    return bTime - aTime;
  });
  return list;
}

function buildContextConversations() {
  const ids = new Set([
    ...Object.keys(chat.lastMessages),
    ...Object.keys(chat.unreadCounts),
  ]);
  const list = Array.from(ids).map((id) => {
    const lastMsg = chat.lastMessages[id];
    return {
      id,
      name: t("chat.defaultName"),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
      lastMessage: lastMsg?.text || "",
      time: lastMsg?.fullTime ? formatRelativeTime(lastMsg.fullTime) : "",
      rawTime: lastMsg?.fullTime || "",
      unread: chat.unreadCounts[id] || 0,
    };
  });
  list.sort((a, b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    const aTime = a.rawTime ? new Date(a.rawTime).getTime() : 0;
    const bTime = b.rawTime ? new Date(b.rawTime).getTime() : 0;
    return bTime - aTime;
  });
  return list;
}

const rawCompanions = ref((initialCached) ?? []);
const conversations = ref(
  initialCached?.length ? buildConversations(initialCached) : buildContextConversations()
);
const loading = ref(!initialCached?.length && !Object.keys(chat.lastMessages).length);
const showMenu = ref(false);
const searchQuery = ref("");

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return conversations.value;
  return conversations.value.filter(
    (c) => c.name.toLowerCase().includes(q) || (c.lastMessage || "").toLowerCase().includes(q)
  );
});

function connectBackgroundWs(all) {
  const scored = [...all].sort((a, b) =>
    new Date(String(b.last_message_time || 0)).getTime() - new Date(String(a.last_message_time || 0)).getTime()
  );
  scored.slice(0, 2).forEach((c, idx) => {
    const profile = (c.profile || {});
    const id = String(profile.id || "");
    if (id) setTimeout(() => chat.connect(id), idx * 100);
  });
}

/** 拉取会话列表并建立后台 WebSocket */
async function loadConversations(background = false) {
  if (!background) {
    const cached = getCachedCompanions(MESSAGES_FILTER);
    const hasLocal = (cached?.length ?? 0) > 0 || Object.keys(chat.lastMessages).length > 0;
    if (!hasLocal) loading.value = true;
  }
  try {
    const all = (await fetchCompanions(MESSAGES_FILTER)) || [];
    rawCompanions.value = all;
    conversations.value = buildConversations(all);
    connectBackgroundWs(all);
  } finally {
    loading.value = false;
  }
}

// ——— 跳转 ———

function openChat(id) {
  chat.connect(id);
  uni.navigateTo({ url: `/pages/chat/index?id=${id}` });
}

function goFeedback() {
  if (!isLoggedIn()) {
    showToast(t("messages.loginRequiredFeedback"));
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }
  uni.navigateTo({ url: "/pages-sub/feedback/index" });
}

function openMenu() {
  showMenu.value = true;
}

function closeMenu() {
  showMenu.value = false;
}

function goCreateCompanion() {
  showMenu.value = false;
  uni.navigateTo({ url: "/pages-sub/create/index" });
}

function goMyCompanions() {
  showMenu.value = false;
  uni.navigateTo({ url: "/pages-sub/my-companions/index" });
}

const onOpenChatTap = bindAnalyticsTapArg(
  (id) => `messages-open-chat-${id}`,
  openChat
);

watch(
  () => [chat.unreadCounts, chat.lastMessages, rawCompanions.value],
  () => {
    conversations.value = rawCompanions.value.length
      ? buildConversations(rawCompanions.value)
      : buildContextConversations();
  },
  { deep: true }
);

// 仅用 onShow：首进页也会触发，避免再叠 onMounted 导致后台 WS 连两次被立刻关掉
let messagesShownOnce = false;
onShow(() => {
  const background = messagesShownOnce || Boolean(initialCached?.length);
  messagesShownOnce = true;
  loadConversations(background);
});

onPageScroll((e) => {
  tabScroll.setScroll(TAB_PATH, e.scrollTop);
});

watch(
  () => tabScroll.scrollToTopTick[TAB_PATH],
  () => {
    uni.pageScrollTo({ scrollTop: 0, duration: 300 });
  }
);
</script>

<template>
  <AppPageShell :title="t('messages.title')" show-tab-bar>
    <view class="header px-md">
      <view class="flex-row justify-between items-center mb-md">
        <text class="page-title">{{ t("messages.title") }}</text>
        <text class="menu-btn" @tap="bindAnalyticsTap('messages-menu', openMenu, '消息页菜单')">＋</text>
      </view>
      <view class="search-wrap flex-row items-center gap-sm">
        <text>🔍</text>
        <input v-model="searchQuery" class="search-input" :placeholder="t('messages.searchPlaceholder')" />
      </view>
    </view>

    <view class="feedback-row px-md" @tap="bindAnalyticsTap('messages-feedback', goFeedback, '意见反馈')">
      <view class="feedback-icon">💬</view>
      <view>
        <text class="feedback-title">{{ t("messages.feedback") }}</text>
        <text class="text-muted feedback-desc">{{ t("messages.feedbackDesc") }}</text>
      </view>
    </view>

    <AppListSkeleton v-if="loading && !conversations.length" />

    <view v-else-if="!conversations.length" class="empty center">
      <text class="text-muted">{{ t("messages.noMessages") }}</text>
      <text class="text-muted hint">{{ t("messages.createCompanionHint") }}</text>
    </view>

    <view v-else-if="!filtered.length" class="empty center text-muted">{{ t("messages.searchNoResults") }}</view>

    <view v-else class="list">
      <view v-for="c in filtered" :key="c.id" class="conv-row" @tap="onOpenChatTap(c.id)">
        <view class="avatar-wrap">
          <AppAvatarImage :src="c.avatar" :seed="c.id" :generating="c.avatar_generating" />
          <view v-if="c.unread" class="badge">{{ c.unread > 99 ? "99+" : c.unread }}</view>
        </view>
        <view class="flex-1">
          <view class="flex-row justify-between">
            <text class="name">{{ c.name }}</text>
            <text class="text-muted time">{{ c.time }}</text>
          </view>
          <text v-if="chat.typingCompanions[c.id]" class="typing">{{ t("messages.typing") }}</text>
          <text v-else class="preview text-muted">{{ c.lastMessage || t("messages.noMessageYet") }}</text>
        </view>
      </view>
    </view>

    <view v-if="showMenu" class="sheet-mask" @tap="bindAnalyticsTap('messages-close-menu', closeMenu, '关闭菜单')">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">{{ t("messages.chooseAction") }}</text>
        <view class="sheet-item" @tap="bindAnalyticsTap('messages-create-companion', goCreateCompanion, '创建伴侣')">
          <text>➕ {{ t("home.create") }}</text>
          <text class="text-muted">{{ t("messages.createCompanionHint") }}</text>
        </view>
        <view class="sheet-item" @tap="bindAnalyticsTap('messages-my-companions', goMyCompanions, '我的伴侣')">
          <text>👥 {{ t("messages.viewAllCompanions") }}</text>
          <text class="text-muted">{{ t("messages.allCompanionsDesc") }}</text>
        </view>
      </view>
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.header { padding-top: 16rpx; }
.page-title { font-size: 40rpx; font-weight: 600; }
.menu-btn { font-size: 48rpx; padding: 8rpx 16rpx; }
.search-wrap { display: flex; align-items: center; gap: 12rpx; background: var(--bg-input); border-radius: 999px; padding: 16rpx 24rpx; margin-bottom: 16rpx; }
.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--fg);
  height: auto !important;
  min-height: 56rpx;
  line-height: 1.4;
  overflow: visible;
}
.feedback-row {
  display: flex; gap: 16rpx; align-items: center; padding: 24rpx 32rpx; border-bottom: 1px solid var(--border);
}
.feedback-icon {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 40rpx;
}
.feedback-title { display: block; font-weight: 500; }
.feedback-desc { font-size: 24rpx; }
.list { border-top: 1px solid var(--border); }
.conv-row { display: flex; gap: 16rpx; padding: 24rpx 32rpx; border-bottom: 1px solid var(--border); }
.avatar-wrap { position: relative; flex-shrink: 0; }
.badge {
  position: absolute; top: -4rpx; right: -4rpx; min-width: 36rpx; height: 36rpx;
  background: var(--brand); color: #fff; font-size: 20rpx; border-radius: 999px;
  display: flex; align-items: center; justify-content: center; padding: 0 8rpx;
}
.name { font-weight: 500; }
.time { font-size: 22rpx; }
.preview { display: block; font-size: 26rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 420rpx; }
.typing { color: var(--brand); font-size: 26rpx; }
.empty { padding: 80rpx 32rpx; text-align: center; }
.hint { display: block; font-size: 24rpx; margin-top: 8rpx; }
.center { text-align: center; }
.sheet-mask {
  position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: 100%; max-width: 750rpx; background: var(--bg-card); border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx; padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}
.sheet-title { display: block; font-weight: 600; margin-bottom: 24rpx; }
.sheet-item { padding: 24rpx; background: var(--bg-input); border-radius: 16rpx; margin-bottom: 16rpx; }
.flex-1 { flex: 1; min-width: 0; }
.mb-md { margin-bottom: 24rpx; }
</style>
