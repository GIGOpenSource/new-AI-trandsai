<script setup>
/**
 * @file pages-sub/post — 社区帖子详情
 * @description 单帖详情、点赞、评论；带 x-device-id。
 * @depends apiFetch、deviceHeaders
 */
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth, getCurrentUserId } from "@/composables/useAuth";
import { deviceHeaders } from "@/utils/device";
import { normalizeMediaUrl } from "@/utils/media";
import apiFetch from "@/utils/api";
import { showToast } from "@/stores/toast";
import { useRelativeTime } from "@/composables/useRelativeTime";

let postId = "";
const { t } = useI18n();
const { format: formatTime } = useRelativeTime("discover");
requireAuth();

// ——— 状态 ———
const post = ref(null);
const loading = ref(true);
const commentText = ref("");
const commentInputKey = ref(0);
const sending = ref(false);
const inputFocus = ref(false);

onLoad((q) => {
  postId = String(q?.id || "");
  // 发现页点评论入口时带 focus=1，进入后自动聚焦输入框
  if (q?.focus === "1" || q?.focus === "true") {
    inputFocus.value = true;
  }
});

// ——— 加载详情 ———
async function fetchPost({ silent = false } = {}) {
  if (!silent && !post.value) loading.value = true;
  try {
    post.value = await apiFetch(`/api/posts/${postId}`, { header: deviceHeaders() });
  } catch (e) {
    const err = e;
    if (err.status === 401) uni.navigateBack();
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPost);

function onCommentInput(e) {
  commentText.value = e?.detail?.value ?? "";
}

function focusCommentInput() {
  inputFocus.value = false;
  // 先关掉再开，强制触发 uni-input focus
  setTimeout(() => {
    inputFocus.value = true;
  }, 0);
}

// ——— 点赞评论 ———
async function handleLike() {
  if (!post.value) return;
  try {
    const data = await apiFetch(
      `/api/posts/${post.value.id}/like`,
      { method: "POST", header: deviceHeaders() }
    );
    if (data?.ok && post.value) {
      post.value.liked = !!data.liked;
      post.value.likes_count = data.likes_count ?? post.value.likes_count;
    }
  } catch (e) {
    console.error("点赞失败:", e);
  }
}

async function handleSendComment() {
  const content = commentText.value.trim();
  if (!content || !post.value || sending.value) return;
  sending.value = true;
  try {
    const data = await apiFetch(`/api/posts/${post.value.id}/comment`, {
      method: "POST",
      header: {
        ...deviceHeaders(),
        "Content-Type": "application/json",
      },
      data: { content },
    });

    // 成功：清空输入（remount 强制同步 uni-input）+ 乐观追加
    commentText.value = "";
    commentInputKey.value += 1;
    inputFocus.value = false;

    if (data?.ok || data?.id != null) {
      const next = {
        id: data.id,
        user_id: getCurrentUserId(),
        user_name: data.user_name || "我",
        content: data.content || content,
        created_at: data.created_at || new Date().toISOString(),
      };
      const comments = [...(post.value.comments || []), next];
      post.value = {
        ...post.value,
        comments,
        comments_count: (post.value.comments_count || 0) + 1,
      };
      // 静默刷新对齐服务端
      void fetchPost({ silent: true });
    } else {
      await fetchPost({ silent: true });
    }
  } catch (e) {
    const err = e;
    if (err.status === 401) showToast(t("discover.loginExpired"));
    else console.error("评论失败:", e);
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <AppPageShell :title="t('discover.postDetail')" :show-back="true">
    <view class="detail-wrap">
      <scroll-view scroll-y class="scroll-area">
        <AppListSkeleton v-if="loading && !post" :rows="3" />
        <view v-else-if="!post" class="center text-muted">{{ t("discover.postNotFound") }}</view>
        <template v-else>
          <view class="card block">
            <view class="flex-row items-center gap-sm">
              <AppAvatarImage :src="post.avatar" :seed="String(post.user_id || 'user')" size="sm" />
              <view class="min-w-0">
                <text class="author-name">{{ post.user_name }}</text>
                <text class="text-muted author-time">{{ formatTime(post.created_at) }}</text>
              </view>
            </view>
            <text class="post-title">{{ post.title }}</text>
            <text class="post-content">{{ post.content }}</text>
            <image
              v-for="(img, idx) in post.images"
              :key="idx"
              class="post-img"
              :src="normalizeMediaUrl(img) || ''"
              mode="widthFix"
            />
            <view class="actions flex-row gap-sm mt-md">
              <text :class="{ liked: post.liked }" @tap="handleLike">
                {{ post.liked ? "♥" : "♡" }} {{ post.likes_count || 0 }}
              </text>
              <text class="text-muted" @tap="focusCommentInput">
                💬 {{ post.comments_count || 0 }}
              </text>
            </view>
          </view>

          <view class="comments-section px-md">
            <text class="section-title">
              {{ t("discover.comments") }} ({{ post.comments_count || 0 }})
            </text>

            <view v-if="!(post.comments && post.comments.length)" class="empty-comments text-muted">
              {{ t("discover.noComments") }}
            </view>

            <view
              v-for="c in post.comments"
              :key="c.id"
              class="comment-row flex-row gap-sm"
            >
              <AppAvatarImage
                :src="c.avatar"
                :seed="String(c.user_id || c.user_name || 'user')"
                size="sm"
              />
              <view class="comment-main min-w-0">
                <view class="comment-bubble">
                  <text class="comment-name">{{ c.user_name }}</text>
                  <text class="comment-body">{{ c.content }}</text>
                </view>
                <text class="text-muted comment-time">{{ formatTime(c.created_at) }}</text>
              </view>
            </view>
          </view>
        </template>
      </scroll-view>

      <view class="input-bar flex-row items-center gap-sm">
        <input
          :key="`post-cmt-${commentInputKey}`"
          class="input-field flex-1"
          :value="commentText"
          :placeholder="t('discover.commentPlaceholder')"
          :disabled="sending || !post"
          :focus="inputFocus"
          maxlength="500"
          confirm-type="send"
          @input="onCommentInput"
          @confirm="handleSendComment"
          @blur="inputFocus = false"
        />
        <view
          class="send-btn"
          :class="{ disabled: sending || !commentText.trim() || !post }"
          @tap="handleSendComment"
        >
          <text>{{ sending ? "…" : "➤" }}</text>
        </view>
      </view>
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.detail-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.scroll-area {
  flex: 1;
  min-height: 0;
  height: 0;
}

.center {
  text-align: center;
  padding: 80rpx 0;
}

.block {
  margin: 24rpx 32rpx;
  padding: 24rpx;
}

.author-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--fg);
}

.author-time {
  display: block;
  font-size: 22rpx;
  margin-top: 4rpx;
}

.post-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin: 16rpx 0;
  color: var(--fg);
}

.post-content {
  display: block;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 16rpx;
  color: var(--fg);
  font-size: 28rpx;
}

.post-img {
  width: 100%;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
}

.actions {
  font-size: 28rpx;
}

.liked {
  color: var(--brand);
}

.comments-section {
  padding-bottom: 32rpx;
}

.section-title {
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
  color: var(--fg);
}

.empty-comments {
  text-align: center;
  padding: 48rpx 0;
  font-size: 26rpx;
}

.comment-row {
  margin-bottom: 24rpx;
}

.comment-main {
  flex: 1;
}

.comment-bubble {
  background: var(--bg-input);
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 8rpx;
}

.comment-name {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
  color: var(--fg);
}

.comment-body {
  display: block;
  font-size: 28rpx;
  color: var(--fg);
  word-break: break-word;
}

.comment-time {
  font-size: 20rpx;
  margin-left: 8rpx;
}

.input-bar {
  flex-shrink: 0;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}

.send-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 28rpx;

  &.disabled {
    opacity: 0.45;
    pointer-events: none;
  }
}

.flex-1 {
  flex: 1;
}

.min-w-0 {
  min-width: 0;
}
</style>
