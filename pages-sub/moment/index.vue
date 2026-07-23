<script setup>
/**
 * @file pages-sub/moment — 朋友圈动态详情
 * @description 单条 moment 详情、点赞、评论；带 x-device-id。
 * @depends apiFetch、deviceHeaders、useAuth
 */
import { ref, onMounted, nextTick } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppMomentImage from "@/components/AppMomentImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth, getCurrentUserId } from "@/composables/useAuth";
import { deviceHeaders } from "@/utils/device";
import apiFetch from "@/utils/api";
import { useRelativeTime } from "@/composables/useRelativeTime";
import { showToast } from "@/stores/toast";
import { findAiRepliesToUser, recordLocalReplyNotif } from "@/utils/notifications";
import { formatCompanionName } from "@/utils/formatCompanion";

let momentId = "";
const { t } = useI18n();
const { format: formatTime } = useRelativeTime("home");
requireAuth();

// ——— 状态 ———
const moment = ref(null);
const loading = ref(true);
const commentText = ref("");
const commentInputKey = ref(0);
const commentFocus = ref(false);
const sending = ref(false);
const previewImage = ref(null);
const replyTo = ref(null);

onLoad((q) => { momentId = String(q?.id || ""); });

function captureReplyNotifs(prevReplyIds = new Set()) {
  const m = moment.value;
  if (!m) return;
  for (const c of findAiRepliesToUser(m.comments)) {
    if (prevReplyIds.has(String(c.id))) continue;
    recordLocalReplyNotif({
      replyId: c.id,
      momentId: m.id,
      title: c.companion_name || m.companion_name || t("home.defaultCompanionName"),
      content: c.content || "",
      avatar: m.companion_avatar || "",
      imageUrl: m.image_url || "",
      time: c.created_at,
      companionId: c.companion_id || m.companion_id,
    });
  }
}

// ——— 加载详情 ———
async function fetchMoment() {
  if (!moment.value) loading.value = true;
  try {
    moment.value = await apiFetch(`/api/moments/${momentId}`, { header: deviceHeaders() });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchMoment);

// ——— 点赞评论 ———
async function handleLike() {
  if (!moment.value) return;
  const data = await apiFetch(
    `/api/moments/${moment.value.id}/like`,
    { method: "POST", header: deviceHeaders() }
  );
  if (data?.ok && moment.value) {
    moment.value.liked = !!data.liked;
    moment.value.likes_count = data.likes_count ?? moment.value.likes_count;
  }
}

function onCommentInput(e) {
  commentText.value = e?.detail?.value ?? "";
}

function focusCommentInput() {
  commentFocus.value = false;
  void nextTick(() => {
    commentFocus.value = true;
  });
}

function onCommentBlur() {
  commentFocus.value = false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** AI 后台生成完成后刷新详情评论 */
async function pollAiReply(afterCount) {
  const prevReplyIds = new Set(
    findAiRepliesToUser(moment.value?.comments).map((c) => String(c.id))
  );
  for (let i = 0; i < 20; i++) {
    await sleep(2000);
    try {
      await fetchMoment();
      const count = moment.value?.comments?.length || 0;
      if (count > afterCount) {
        captureReplyNotifs(prevReplyIds);
        return;
      }
    } catch (e) {
      console.warn("轮询 AI 回复失败:", e);
    }
  }
}

async function handleSendComment(e) {
  const fromEvent = typeof e?.detail?.value === "string" ? e.detail.value : null;
  const content = (fromEvent ?? commentText.value).trim();
  if (!content || !moment.value || sending.value) return;
  sending.value = true;
  const prevCount = moment.value.comments?.length || 0;
  try {
    const body = { content };
    if (replyTo.value) body.parent_id = replyTo.value.id;
    const data = await apiFetch(`/api/moments/${moment.value.id}/comment`, {
      method: "POST",
      header: {
        ...deviceHeaders(),
        "Content-Type": "application/json",
      },
      data: body,
      // 仅等用户评论落库；AI 后台生成
      timeout: 20000,
    });
    if (data?.ok === false || data?.error) {
      showToast(String(data.error || data.detail || "评论失败"));
      return;
    }
    commentText.value = "";
    commentInputKey.value += 1;
    commentFocus.value = false;
    replyTo.value = null;
    await fetchMoment();
    if (data?.ai_reply) {
      captureReplyNotifs(new Set());
    } else {
      void pollAiReply(prevCount + 1);
    }
  } catch (err) {
    console.error("评论失败:", err);
    const msg = String(err?.errMsg || err?.message || err || "");
    if (/timeout|超时|timed?\s*out/i.test(msg)) {
      void pollAiReply(prevCount);
    }
  } finally {
    sending.value = false;
  }
}

function isMe(comment) {
  if (!comment) return false;
  // 优先用接口返回的 is_me 字段
  if (comment.is_me === true) return true;
  // 兼容未返回 is_me 的情况，回退 user_id 比对
  const uid = getCurrentUserId();
  const userId = comment.user_id;
  return userId != null && uid != null && String(userId) === String(uid);
}

function setReplyTo(comment) {
  replyTo.value = comment;
  focusCommentInput();
}
</script>

<template>
  <AppPageShell title="朋友圈详情" :show-back="true">
    <view class="detail-wrap">
      <scroll-view scroll-y class="scroll-area">
        <AppListSkeleton v-if="loading && !moment" :rows="3" />
        <view v-else-if="!moment" class="center text-muted">朋友圈不存在</view>
        <template v-else>
        <view class="card block">
          <view class="flex-row items-center gap-sm">
            <AppAvatarImage :src="moment.companion_avatar" :seed="moment.companion_id" size="sm" />
            <view>
              <text>{{ formatCompanionName(moment.companion_name, t("home.defaultCompanionName")) }}</text>
              <text class="text-muted" style="display: block; font-size: 22rpx">{{ formatTime(moment.created_at) }}</text>
            </view>
          </view>
          <text class="caption">{{ moment.caption }}</text>
          <view v-if="moment.image_generating" class="generating">图片生成中...</view>
          <AppMomentImage
            v-else-if="moment.image_url"
            :src="moment.image_url"
            :prefer-thumb="false"
            img-class="hero-img"
            @click="previewImage = moment.image_url"
          />
          <view class="actions flex-row gap-sm mt-md">
            <text :class="{ liked: moment.liked }" @tap="handleLike">♥ {{ moment.likes_count }}</text>
            <text class="text-muted" @tap="focusCommentInput">💬 {{ moment.comments_count }}</text>
          </view>
        </view>

        <view class="px-md py-sm">
          <text class="section-title">评论 ({{ moment.comments_count || 0 }})</text>
          <view
            v-for="c in moment.comments"
            :key="c.id"
            class="comment-row"
            @tap="setReplyTo(c)"
          >
            <view class="comment-avatar">{{ (c.companion_name || "?").charAt(0) }}</view>
            <view class="flex-1">
              <view class="comment-bubble">
                <text class="comment-name" :class="{ me: isMe(c) }">{{
                  isMe(c)
                    ? t("common.me")
                    : (c.companion_name || formatCompanionName(c.companion_name, t("home.defaultCompanionName")))
                }}</text>
                <text>
                <text v-if="!isMe(c) && (c.is_reply_me || c.reply_to_name)" :class="{ 'text-primary': c.is_reply_me }">@{{ c.is_reply_me ? t("common.me") : c.reply_to_name }} </text>
                  {{ c.content }}
                </text>
              </view>
              <text class="text-muted" style="font-size: 20rpx; margin-top: 8rpx">{{ formatTime(c.created_at) }}</text>
            </view>
          </view>
        </view>
        </template>
      </scroll-view>

      <view class="input-bar">
        <view v-if="replyTo" class="reply-hint flex-row justify-between">
          <text class="text-muted">{{
            t("home.replyTo", {
              name: isMe(replyTo)
                ? t("common.me")
                : formatCompanionName(replyTo.companion_name, t("home.defaultCompanionName")),
            })
          }}</text>
          <text @tap="replyTo = null">{{ t("common.cancel") }}</text>
        </view>
        <view class="flex-row gap-sm">
          <input
            :key="`moment-cmt-${commentInputKey}`"
            :value="commentText"
            class="input-field flex-1"
            :placeholder="
              replyTo
                ? t('home.replyPlaceholder', {
                    name: isMe(replyTo)
                      ? t('common.me')
                      : formatCompanionName(replyTo.companion_name, t('home.defaultCompanionName')),
                  })
                : t('home.writeComment')
            "
            maxlength="200"
            confirm-type="send"
            :focus="commentFocus"
            :disabled="sending"
            @input="onCommentInput"
            @confirm="handleSendComment"
            @blur="onCommentBlur"
          />
          <button class="send-btn" :class="{ busy: sending }" :disabled="sending || !commentText.trim() || !moment" @tap="handleSendComment">
            <text v-if="sending" class="send-spinner"></text>
            <text v-else>➤</text>
          </button>
        </view>
      </view>
    </view>

    <view v-if="previewImage" class="preview-mask" @tap="previewImage = null">
      <AppMomentImage :src="previewImage" :prefer-thumb="false" img-class="preview-img" @click.stop />
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.center { text-align: center; padding: 80rpx 0; }
.detail-wrap { display: flex; flex-direction: column; height: calc(100vh - 120rpx); }
.scroll-area { flex: 1; }
.block { margin: 24rpx 32rpx; padding: 24rpx; }
.caption { display: block; margin: 16rpx 0; line-height: 1.6; }
.generating { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-input); border-radius: 16rpx; color: var(--fg-muted); }
.hero-img { width: 100%; border-radius: 16rpx; }
.liked { color: var(--brand); }
.section-title { font-weight: 600; margin-bottom: 16rpx; display: block; }
.comment-row { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.comment-avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%; background: var(--bg-input);
  display: flex; align-items: center; justify-content: center; font-size: 24rpx; flex-shrink: 0;
}
.comment-bubble { background: var(--bg-input); border-radius: 16rpx; padding: 16rpx 20rpx; }
.comment-name { display: block; font-size: 22rpx; margin-bottom: 4rpx; &.me { color: var(--brand); } }
.input-bar {
  border-top: 1px solid var(--border); background: var(--bg-card);
}
.send-btn {
  width: 72rpx; height: 72rpx; border-radius: 50%; padding: 0;
  background: var(--brand); color: #fff; font-size: 28rpx;
}
.send-spinner {
  display: inline-block;
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: send-spin 0.6s linear infinite;
}
@keyframes send-spin {
  to { transform: rotate(360deg); }
}
.preview-mask {
  position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
}
.preview-img { max-width: 90%; max-height: 90%; }
.flex-1 { flex: 1; }
</style>
