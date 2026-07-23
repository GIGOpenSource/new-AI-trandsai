<script setup>
/**
 * @file pages/chat — 与伴侣一对一聊天
 * @description 历史消息分页、WebSocket 实时收发、虚拟列表、表情选择、清空会话。
 * @depends stores/chat、useChatVirtualWindow、apiFetch、chatTime
 */
import {
  ref,
  computed,
  watch,
  nextTick,
  getCurrentInstance,
  onMounted,
  onUnmounted,
} from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppChatEmojiPicker from "@/components/AppChatEmojiPicker.vue";
import AppConfirmDialog from "@/components/AppConfirmDialog.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth } from "@/composables/useAuth";
import { useChatStore } from "@/stores/chat";
import apiFetch from "@/utils/api";
import {
  formatMessageTime,
  formatChatDateSeparator,
  calendarDayKeyFromIso,
} from "@/utils/chatTime";
import { isWsConnectWelcomeNotice } from "@/utils/chatConnectNotice";
import { showToast } from "@/stores/toast";
import { useChatVirtualWindow } from "@/composables/useChatVirtualWindow";
import { bindAnalyticsTap } from "@/utils/analytics";
import { formatCompanionName } from "@/utils/formatCompanion";

const { t, locale } = useI18n();
const chat = useChatStore();
requireAuth();

let companionId = "";

// ——— 页面状态 ———

const CHAT_GROUP_GAP_MIN = 4;

const input = ref("");
const companion = ref({
  name: t("common.loading"),
  avatar: "",
  online: true,
});
const historyLoading = ref(true);
const accessDenied = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const offset = ref(0);
const isSending = ref(false);
const showEmojiPicker = ref(false);
const showMenu = ref(false);
const showClearConfirm = ref(false);
const scrollInto = ref("");
const scrollTop = ref(0);
const viewScrollTop = ref(0);
const nearBottom = ref(true);
const scrollViewHeight = ref(0);

const initialScrollDone = ref(false);
const prevMessageCount = ref(0);
const lastLoadMoreAt = ref(0);

const connected = computed(() => chat.isConnected[companionId] || false);
const isTyping = computed(() => chat.typingCompanions[companionId] || false);

// ——— 消息列表与气泡布局 ———

const visibleMessages = computed(() => {
  void chat.messages;
  return chat
    .getDisplayMessages(companionId)
    .filter(
      (m) => !(m.sender === "system" && isWsConnectWelcomeNotice(m.text))
    );
});

const chatListRows = computed(() => {
  const list = visibleMessages.value;
  const rows = [];
  let lastDayKey = "";
  let bubbleIndex = 0;
  let prevRowWasDate = false;

  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const prev = i > 0 ? list[i - 1] : null;
    const next = i < list.length - 1 ? list[i + 1] : null;

    if (m.ts) {
      const dk = calendarDayKeyFromIso(m.ts);
      if (dk && dk !== lastDayKey) {
        rows.push({
          kind: "date",
          key: `sep-${dk}-${m.id}`,
          label: formatChatDateSeparator(m.ts, locale.value),
        });
        lastDayKey = dk;
        prevRowWasDate = true;
      }
    }

    let groupWithPrev = false;
    if (
      prev &&
      isConvSender(m.sender) &&
      isConvSender(prev.sender) &&
      !breaksConversationGroup(prev.sender) &&
      !breaksConversationGroup(m.sender)
    ) {
      if (prev.sender === m.sender) {
        const gapMin =
          Math.abs(messageInstant(m) - messageInstant(prev)) / 60000;
        if (gapMin < CHAT_GROUP_GAP_MIN) groupWithPrev = true;
      }
    }

    let groupWithNext = false;
    if (
      next &&
      isConvSender(m.sender) &&
      isConvSender(next.sender) &&
      !breaksConversationGroup(next.sender) &&
      !breaksConversationGroup(m.sender)
    ) {
      if (next.sender === m.sender) {
        const gapMin =
          Math.abs(messageInstant(next) - messageInstant(m)) / 60000;
        if (gapMin < CHAT_GROUP_GAP_MIN) groupWithNext = true;
      }
    }

    const showAvatar =
      m.sender === "ai" && !(groupWithPrev && prev?.sender === "ai");
    const avatarSpacer = m.sender === "ai" && !showAvatar;
    const showFootTime = Boolean(
      m.time && (!isConvSender(m.sender) || !groupWithNext)
    );

    const marginTopClass = prevRowWasDate
      ? "mt-date"
      : bubbleIndex === 0
        ? groupWithPrev
          ? "mt-tight"
          : "mt-none"
        : groupWithPrev
          ? "mt-tight"
          : "mt-normal";

    rows.push({
      kind: "bubble",
      key: m.id,
      message: m,
      layout: {
        groupWithPrev,
        groupWithNext,
        showAvatar,
        avatarSpacer,
        showFootTime,
      },
      marginTopClass,
    });
    bubbleIndex += 1;
    prevRowWasDate = false;
  }
  return rows;
});

const typingShowsCompanionAvatar = computed(() => {
  const list = visibleMessages.value;
  if (list.length === 0) return true;
  return list[list.length - 1].sender !== "ai";
});

const instance = getCurrentInstance();

function isConvSender(s) {
  return s === "user" || s === "ai";
}

function breaksConversationGroup(s) {
  return s === "system" || s === "thinking" || s === "filler";
}

function messageInstant(m) {
  if (m.ts) {
    const tMs = Date.parse(m.ts);
    if (!Number.isNaN(tMs)) return tMs;
  }
  return Date.now();
}

function userBubbleShape(layout) {
  const { groupWithPrev, groupWithNext: gNext } = layout;
  if (groupWithPrev && gNext) return "shape-mid-user";
  if (groupWithPrev) return "shape-top-user";
  if (gNext) return "shape-bottom-user";
  return "shape-single-user";
}

function aiBubbleShape(layout) {
  const { groupWithPrev, groupWithNext: gNext } = layout;
  if (groupWithPrev && gNext) return "shape-mid-ai";
  if (groupWithPrev) return "shape-top-ai";
  if (gNext) return "shape-bottom-ai";
  return "shape-single-ai";
}

// ——— 滚动与虚拟列表 ———

function queryScrollMetrics() {
  return new Promise((resolve) => {
    const q = uni.createSelectorQuery().in(instance?.proxy);
    q.select("#chat-scroll")
      .fields({ scrollOffset: true, size: true }, (res) => {
        resolve({
          scrollTop: res?.scrollTop ?? 0,
          scrollHeight: res?.scrollHeight ?? 0,
        });
      })
      .exec();
  });
}

function measureScrollViewHeight() {
  const q = uni.createSelectorQuery().in(instance?.proxy);
  q.select("#chat-scroll")
    .boundingClientRect((rect) => {
      if (rect?.height) scrollViewHeight.value = rect.height;
    })
    .exec();
}

function scrollToBottom() {
  scrollInto.value = "";
  nextTick(() => {
    scrollInto.value = "chat-bottom";
  });
}

function onScroll(e) {
  const { scrollTop: top, scrollHeight } = e.detail;
  viewScrollTop.value = top;
  const viewH = scrollViewHeight.value || 0;
  nearBottom.value =
    viewH <= 0 || top + viewH >= scrollHeight - 100;
}

const {
  enabled: virtualEnabled,
  slice: virtualChatRows,
  topPad: virtualTopPad,
  bottomPad: virtualBottomPad,
} = useChatVirtualWindow(chatListRows, viewScrollTop, scrollViewHeight);

// ——— 历史加载与伴侣资料 ———

/** 从服务端分页拉取历史消息并合并到 store */
async function loadMessages(loadOffset, isInitial) {
  if (!companionId) return;
  try {
    if (isInitial) historyLoading.value = true;
    else loadingMore.value = true;

    const data = await apiFetch(`/companions/${companionId}/messages?limit=20&offset=${loadOffset}`);

    const rawMessages = data.messages || [];
    const total = data.total || 0;

    const formatted = rawMessages.map((m, idx) => ({
      id: typeof m.id === "number" ? m.id : loadOffset + idx + 1,
      companionId,
      sender: m.role === "user" ? "user" : "ai",
      text: m.content || "",
      time: m.timestamp
        ? formatMessageTime(m.timestamp, locale.value)
        : "",
      ts: typeof m.timestamp === "string" ? m.timestamp : undefined,
    }));

    if (isInitial) {
      chat.mergeHistoryMessages(companionId, formatted, "initial");
      offset.value = rawMessages.length;
      hasMore.value = rawMessages.length < total;
    } else {
      const before = await queryScrollMetrics();
      chat.mergeHistoryMessages(companionId, formatted, "prepend");
      offset.value += rawMessages.length;
      hasMore.value = loadOffset + rawMessages.length < total;
      await nextTick();
      const after = await queryScrollMetrics();
      const delta = after.scrollHeight - before.scrollHeight;
      scrollTop.value = before.scrollTop + delta + 0.01;
    }
  } catch (err) {
    const status = (err)?.status;
    if (status === 403) {
      accessDenied.value = true;
      return;
    }
    console.error("加载聊天记录失败:", err);
  } finally {
    if (isInitial) historyLoading.value = false;
    else loadingMore.value = false;
  }
}

function onScrollToUpper() {
  if (loadingMore.value || !hasMore.value || !companionId) return;
  const now = Date.now();
  if (now - lastLoadMoreAt.value < 450) return;
  lastLoadMoreAt.value = now;
  loadMessages(offset.value, false);
}

/** 拉取伴侣资料并更新页头展示 */
async function loadCompanion() {
  try {
    const data = await apiFetch(
      `/companions/${companionId}`
    );
    const profile = (data.profile || {});
    const avatar = String(data.avatar || "");
    companion.value = {
      name: formatCompanionName(profile.name, t("chat.defaultName")),
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${companionId}`,
      online: connected.value,
    };
  } catch (err) {
    const status = (err)?.status;
    if (status === 403) {
      accessDenied.value = true;
      throw err;
    }
    throw err;
  }
}

// ——— 发送 / 表情 / 菜单 / 清空 ———

/** 发送用户输入并滚动到底部 */
function handleSend() {
  if (!input.value.trim() || !companionId || isSending.value) return;
  const text = input.value.trim();
  input.value = "";
  isSending.value = true;
  chat.sendMessage(companionId, text);
  nextTick(() => scrollToBottom());
}

function copyMessage(text) {
  uni.setClipboardData({
    data: text,
    success() {
      showToast(t("chat.copySuccess"));
    },
  });
}

async function handleClearMessages() {
  if (!companionId) return;
  try {
    await apiFetch(`/companions/${companionId}/clear-messages`, {
      method: "POST",
    });
    offset.value = 0;
    hasMore.value = true;
    chat.clearMessages(companionId);
    showToast(t("chat.clearSuccess"));
  } catch (err) {
    console.error("清空聊天记录失败:", err);
    showToast(t("chat.clearFailed"));
  }
}

function handleEmojiPick(emoji) {
  input.value += emoji;
  showEmojiPicker.value = false;
}

function goProfile() {
  showMenu.value = false;
  uni.navigateTo({
    url: `/pages-sub/companion/index?id=${companionId}`,
  });
}

function openClearConfirm() {
  showMenu.value = false;
  showClearConfirm.value = true;
}

function onProfileTap() {
  bindAnalyticsTap("chat-view-profile", goProfile, "查看资料");
}

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
}

function goBackFromDenied() {
  uni.navigateBack();
}

onLoad((query) => {
  companionId = String(query?.id || "");
});

onMounted(async () => {
  if (!companionId) return;

  initialScrollDone.value = false;
  prevMessageCount.value = 0;
  accessDenied.value = false;

  chat.setActiveCompanionId(companionId);
  chat.connect(companionId);
  chat.clearUnread(companionId);

  try {
    await Promise.all([loadCompanion(), loadMessages(0, true)]);
  } catch (err) {
    console.error("加载失败:", err);
    historyLoading.value = false;
  }

  nextTick(() => {
    measureScrollViewHeight();
    if (!historyLoading.value && visibleMessages.value.length > 0) {
      scrollToBottom();
      initialScrollDone.value = true;
    }
  });
});

onUnmounted(() => {
  chat.setActiveCompanionId(null);
});

watch(connected, (conn) => {
  companion.value = { ...companion.value, online: conn };
  if (!conn) isSending.value = false;
});

watch(
  () => visibleMessages.value.length,
  (count) => {
    if (count > prevMessageCount.value) {
      prevMessageCount.value = count;
      if (!historyLoading.value && !loadingMore.value && nearBottom.value) {
        nextTick(() => {
          measureScrollViewHeight();
          scrollToBottom();
        });
      }
      isSending.value = false;
    } else {
      prevMessageCount.value = count;
    }
  }
);

watch(isTyping, (typing) => {
  if (!historyLoading.value && !loadingMore.value && typing) {
    nextTick(() => scrollToBottom());
  }
});

watch(historyLoading, (loading) => {
  if (
    !loading &&
    visibleMessages.value.length > 0 &&
    !initialScrollDone.value
  ) {
    nextTick(() => {
      scrollToBottom();
      initialScrollDone.value = true;
    });
  }
});
</script>

<template>
  <view v-if="accessDenied" class="access-denied">
    <text class="access-text">{{ t("chat.accessDenied") }}</text>
    <button class="access-back" @tap="bindAnalyticsTap('chat-access-denied-back', goBackFromDenied, '返回')">
      {{ t("chat.back") }}
    </button>
  </view>

  <AppPageShell
    v-else
    :show-back="true"
    back-analytics-id="chat-back"
    back-analytics-name="聊天页返回"
  >
    <template #header-title>
      <view class="chat-header-info" @tap="onProfileTap">
        <AppAvatarImage
          :src="companion.avatar"
          :seed="companionId"
          size="sm"
        />
        <view class="chat-header-meta">
          <view class="flex-row items-center gap-sm">
            <text class="chat-header-name">{{ companion.name || t("common.loading") }}</text>
            <view v-if="companion.online" class="online-dot" />
          </view>
          <text class="chat-header-status text-muted">
            {{ connected ? t("chat.online") : t("chat.connecting") }}
          </text>
        </view>
      </view>
    </template>

    <template #header-right>
      <text class="menu-btn" @tap.stop="bindAnalyticsTap('chat-menu', toggleMenu, '聊天菜单')">⋮</text>
    </template>

    <view v-if="showMenu" class="menu-mask" @tap="closeMenu" />
    <view v-if="showMenu" class="header-menu">
      <text class="menu-item" @tap="bindAnalyticsTap('chat-menu-view-profile', goProfile, '查看资料')">{{ t("chat.viewProfile") }}</text>
      <text class="menu-item destructive" @tap="bindAnalyticsTap('chat-clear-messages', openClearConfirm, '清空消息')">
        {{ t("chat.clearMessages") }}
      </text>
    </view>

    <view class="chat-wrap">
      <scroll-view
        id="chat-scroll"
        scroll-y
        class="chat-scroll"
        :scroll-into-view="scrollInto"
        :scroll-top="scrollTop"
        :upper-threshold="50"
        :enable-flex="true"
        scroll-with-animation
        @scroll="onScroll"
        @scrolltoupper="onScrollToUpper"
      >
        <view v-if="loadingMore" class="load-more">
          <view class="spinner spinner-sm" />
          <text class="text-muted">{{ t("chat.loadingEarlier") }}</text>
        </view>

        <AppListSkeleton
          v-if="historyLoading && visibleMessages.length === 0"
          :rows="6"
        />

        <view
          v-if="!historyLoading && visibleMessages.length === 0"
          class="empty-hint text-muted"
        >
          {{ t("chat.noMessages") }}
        </view>

        <view
          v-if="virtualEnabled"
          class="virtual-pad"
          :style="{ height: virtualTopPad + 'px' }"
        />

        <template v-for="row in virtualChatRows" :key="row.key">
          <view v-if="row.kind === 'date'" class="date-sep">
            <text class="date-sep-label">{{ row.label }}</text>
          </view>

          <view
            v-else
            :id="'msg-' + row.message.id"
            :class="row.marginTopClass"
          >
            <!-- thinking -->
            <view
              v-if="row.message.sender === 'thinking'"
              class="center-row"
            >
              <text
                class="bubble-thinking"
                @tap="chat.dismissMessage(row.message.id)"
              >
                {{ row.message.text }}
              </text>
            </view>

            <!-- filler -->
            <view
              v-else-if="row.message.sender === 'filler'"
              class="center-row"
            >
              <text class="bubble-filler">{{ row.message.text }}</text>
            </view>

            <!-- system -->
            <view
              v-else-if="row.message.sender === 'system'"
              class="center-row"
            >
              <view class="bubble-system">
                <text>{{ row.message.text }}</text>
                <text v-if="row.message.time" class="system-time">
                  {{ row.message.time }}
                </text>
              </view>
            </view>

            <!-- user -->
            <view
              v-else-if="row.message.sender === 'user'"
              class="flex-row bubble-row-user"
            >
              <view class="bubble-col">
                <view class="bubble-with-status">
                  <view
                    v-if="chat.sendingMsgIds.has(row.message.id)"
                    class="pending-indicator"
                  >
                    <view class="status-spinner" />
                  </view>
                  <view
                    v-else-if="chat.pendingMsgIds.has(row.message.id)"
                    class="pending-indicator"
                  >
                    <up-icon name="info-circle-fill" color="#ef4444" size="20" />
                  </view>
                  <view
                    class="chat-bubble-user"
                    :class="userBubbleShape(row.layout)"
                    @longpress="copyMessage(row.message.text)"
                  >
                    <text class="bubble-text">{{ row.message.text }}</text>
                  </view>
                </view>
                <text
                  v-if="row.layout.showFootTime && row.message.time"
                  class="foot-time foot-time-user"
                >
                  {{ row.message.time }}
                </text>
              </view>
            </view>

            <!-- ai -->
            <view v-else class="flex-row bubble-row-ai">
              <AppAvatarImage
                v-if="row.layout.showAvatar"
                :src="companion.avatar"
                :seed="companionId"
                size="sm"
              />
              <view
                v-else-if="row.layout.avatarSpacer"
                class="avatar-spacer"
              />
              <view class="bubble-col">
                <view
                  class="chat-bubble-ai"
                  :class="aiBubbleShape(row.layout)"
                  @longpress="copyMessage(row.message.text)"
                >
                  <text class="bubble-text">{{ row.message.text }}</text>
                </view>
                <text
                  v-if="row.layout.showFootTime && row.message.time"
                  class="foot-time"
                >
                  {{ row.message.time }}
                </text>
              </view>
            </view>
          </view>
        </template>

        <view
          v-if="virtualEnabled"
          class="virtual-pad"
          :style="{ height: virtualBottomPad + 'px' }"
        />

        <view
          v-if="isTyping"
          class="typing-row"
          :class="{ 'typing-after-msgs': visibleMessages.length > 0 }"
        >
          <AppAvatarImage
            v-if="typingShowsCompanionAvatar"
            :src="companion.avatar"
            :seed="companionId"
            size="sm"
          />
          <view v-else class="avatar-spacer" />
          <view class="typing-bubble">
            <view class="typing-dots">
              <view class="typing-dot" />
              <view class="typing-dot delay-1" />
              <view class="typing-dot delay-2" />
            </view>
          </view>
        </view>

        <view id="chat-bottom" class="scroll-anchor" />
      </scroll-view>

      <view class="chat-input-bar">
        <view class="emoji-wrap">
          <text
            class="emoji-toggle"
            @tap="bindAnalyticsTap('chat-emoji', toggleEmojiPicker, '表情')"
          >☺</text>
          <view v-if="showEmojiPicker" class="emoji-panel">
            <AppChatEmojiPicker @pick="handleEmojiPick" />
          </view>
        </view>

        <input
          v-model="input"
          class="input-field chat-input"
          :placeholder="t('chat.placeholder')"
          confirm-type="send"
          @confirm="handleSend"
        />

        <button
          class="send-btn"
          :class="{ active: input.trim() && !isSending }"
          :disabled="!input.trim() || isSending"
          @tap="bindAnalyticsTap('chat-send', handleSend, '发送消息')"
        >
          ➤
        </button>
      </view>
    </view>

    <AppConfirmDialog
      v-model:open="showClearConfirm"
      :title="t('chat.clearMessages')"
      :description="t('chat.confirmClearMessages')"
      destructive
      @confirm="handleClearMessages"
    />
  </AppPageShell>
</template>

<style scoped lang="scss">
/* 对齐 React Chat：整屏列布局 + 底部输入栏固定可点 */

.access-denied {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  background: var(--bg);
}
.access-text {
  text-align: center;
  margin-bottom: 48rpx;
  font-size: 30rpx;
  color: var(--fg-muted);
}
.access-back {
  border-radius: 999px;
  font-size: 28rpx;
  padding: 16rpx 48rpx;
  background: var(--bg-input);
  color: var(--fg);
  border: 1px solid var(--border);
}

.menu-btn {
  font-size: 40rpx;
  line-height: 1;
  padding: 8rpx 12rpx;
}

.menu-mask {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: transparent;
}

.header-menu {
  position: absolute;
  right: 24rpx;
  top: calc(env(safe-area-inset-top) + 96rpx);
  z-index: 50;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.18);
  min-width: 280rpx;
  padding: 8rpx 0;
  overflow: hidden;
}

.menu-item {
  display: block;
  font-size: 28rpx;
  padding: 24rpx 32rpx;
  color: var(--fg);
  &.destructive {
    color: var(--destructive);
  }
}

.chat-header-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  min-width: 0;
  padding: 4rpx 8rpx;
  box-sizing: border-box;
}

.chat-header-meta {
  min-width: 0;
  flex: 1;
}

.chat-header-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 360rpx;
}

.online-dot {
  width: 14rpx;
  height: 14rpx;
  background: #22c55e;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-header-status {
  font-size: 22rpx;
  margin-top: 2rpx;
  display: block;
}

.chat-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
}

.chat-scroll {
  flex: 1;
  min-height: 0;
  height: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 24rpx 32rpx;
}

.load-more,
.load-center {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx 0;
  font-size: 24rpx;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320rpx;
  font-size: 28rpx;
}

.spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid rgba(236, 72, 153, 0.25);
  border-top-color: rgba(236, 72, 153, 0.8);
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
  &.spinner-sm {
    width: 24rpx;
    height: 24rpx;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.mt-none { margin-top: 0; }
.mt-tight { margin-top: 8rpx; }
.mt-normal { margin-top: 24rpx; }
.mt-date { margin-top: 16rpx; }

.date-sep {
  display: flex;
  justify-content: center;
  padding: 12rpx 0;
}
.date-sep-label {
  font-size: 22rpx;
  color: var(--fg-muted);
  background: rgba(63, 63, 70, 0.45);
  border: 1px solid rgba(63, 63, 70, 0.35);
  border-radius: 999px;
  padding: 6rpx 20rpx;
}

.center-row {
  display: flex;
  justify-content: center;
}

.bubble-thinking {
  max-width: 90%;
  border-radius: 24rpx;
  font-size: 24rpx;
  text-align: center;
  padding: 16rpx 24rpx;
  background: rgba(63, 63, 70, 0.55);
  color: var(--fg-muted);
  border: 1px solid rgba(63, 63, 70, 0.4);
}

.bubble-filler {
  max-width: 90%;
  border-radius: 16rpx;
  font-size: 24rpx;
  text-align: center;
  font-style: italic;
  padding: 12rpx 20rpx;
  color: var(--brand);
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid rgba(236, 72, 153, 0.12);
}

.bubble-system {
  max-width: 90%;
  border-radius: 24rpx;
  font-size: 24rpx;
  text-align: center;
  padding: 16rpx 24rpx;
  background: rgba(63, 63, 70, 0.55);
  color: var(--fg-muted);
  border: 1px solid rgba(63, 63, 70, 0.4);
}
.system-time {
  display: block;
  font-size: 20rpx;
  margin-top: 8rpx;
}

.bubble-row-user {
  display: flex;
  justify-content: flex-end;
}
.bubble-row-ai {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.bubble-col {
  max-width: 75%;
  min-width: 0;
}

.bubble-with-status {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
}

.pending-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  flex-shrink: 0;
  margin-bottom: 8rpx;
}

.status-spinner {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid rgba(236, 72, 153, 0.25);
  border-top-color: rgba(236, 72, 153, 0.8);
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}

.bubble-text {
  font-size: 30rpx;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.foot-time {
  display: block;
  font-size: 22rpx;
  margin-top: 4rpx;
  color: var(--fg-muted);
}
.foot-time-user {
  text-align: right;
}

.avatar-spacer {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
}

.shape-single-user { border-radius: 32rpx; }
.shape-top-user { border-radius: 32rpx 32rpx 8rpx 32rpx; }
.shape-bottom-user { border-radius: 32rpx 8rpx 32rpx 32rpx; }
.shape-mid-user { border-radius: 32rpx 8rpx 8rpx 32rpx; }

.shape-single-ai { border-radius: 32rpx; }
.shape-top-ai { border-radius: 32rpx 32rpx 32rpx 8rpx; }
.shape-bottom-ai { border-radius: 8rpx 32rpx 32rpx 32rpx; }
.shape-mid-ai { border-radius: 8rpx 32rpx 32rpx 8rpx; }

.typing-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 16rpx;
  margin-top: 0;
  &.typing-after-msgs {
    margin-top: 8rpx;
  }
}

.typing-bubble {
  display: flex;
  border-radius: 32rpx 32rpx 32rpx 8rpx;
  min-height: 80rpx;
  align-items: center;
  padding: 20rpx 28rpx;
  background: var(--bg-input);
  border: 1px solid var(--border);
}

.typing-dots {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
}

.typing-dot {
  width: 12rpx;
  height: 12rpx;
  background: var(--fg-muted);
  border-radius: 50%;
  opacity: 0.7;
  animation: typing-soft 1s ease-in-out infinite;
  &.delay-1 { animation-delay: 0.2s; }
  &.delay-2 { animation-delay: 0.4s; }
}

@keyframes typing-soft {
  0%, 100% { opacity: 0.35; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-4rpx); }
}

.scroll-anchor {
  height: 2rpx;
  width: 100%;
}

.chat-input-bar {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 16rpx;
  flex-shrink: 0;
  padding: 20rpx 24rpx;
  /* 安全区由 AppPageShell paddingBottom 统一处理，避免叠加把输入栏顶飞 */
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}

.emoji-wrap {
  position: relative;
  flex-shrink: 0;
}

.emoji-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  font-size: 44rpx;
  border-radius: 50%;
}

.emoji-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 16rpx;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.18);
  z-index: 50;
  padding: 16rpx;
}

.chat-input {
  flex: 1;
  border-radius: 999px;
  max-height: 192rpx;
  background: var(--bg-input);
  border: none;
  height: auto !important;
  min-height: 72rpx;
  line-height: 1.4;
  overflow: visible;
}

.send-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  font-size: 32rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: var(--bg-input);
  color: var(--fg-muted);
  &.active {
    background: linear-gradient(90deg, var(--brand), var(--brand-end));
    color: #fff;
  }
  &[disabled] {
    opacity: 0.7;
  }
}
</style>
