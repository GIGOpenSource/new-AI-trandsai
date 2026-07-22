<script setup>
/**
 * @file pages/home — 首页 Tab（朋友圈）
 * @description
 * - 顶部智能体头像条（横向滚动，含创建入口）
 * - 朋友圈动态：分页、下拉刷新、触底加载
 * - 点赞/评论（乐观更新）；筛选语言/性别/性取向
 * - 图片预览、回顶、未读铃铛；先缓存后刷新
 * @depends homeCache、companionsCache、apiFetch、deviceHeaders
 */
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppMomentImage from "@/components/AppMomentImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth, getCurrentUserId } from "@/composables/useAuth";
import { useRelativeTime } from "@/composables/useRelativeTime";
import apiFetch from "@/utils/api";
import { fetchCompanions } from "@/utils/companionsCache";
import {
  readHomeCompanionsStripCache,
  readHomeMomentsCache,
  writeHomeCompanionsStripCache,
  writeHomeMomentsCache,
} from "@/utils/homeCache";
import { bindAnalyticsTap, bindAnalyticsTapArg } from "@/utils/analytics";
import { useTabScrollStore } from "@/stores/tabScroll";

const TAB_PATH = "/pages/home/index";
const tabScroll = useTabScrollStore();
import { sortCompanionsByUserLang } from "@/utils/companionLang";
import { deviceHeaders } from "@/utils/device";
import { getItem, setItem } from "@/utils/storage";
import { showToast } from "@/stores/toast";
import {
  computeHomeHasUnread,
  findAiRepliesToUser,
  recordLocalReplyNotif,
} from "@/utils/notifications";
import { formatCompanionName } from "@/utils/formatCompanion";

const PAGE_SIZE = 20;

const { t, locale } = useI18n();
const { format: formatRelativeTime } = useRelativeTime("home");
requireAuth();

/** 进入朋友圈详情后，回首页时刷新列表以同步评论 */
let pendingMomentSync = false;
let initialized = false;

// ——— 缓存优先：先用缓存渲染，网络数据到达后替换 ———
const cachedMoments = readHomeMomentsCache();
const cachedCompanions = readHomeCompanionsStripCache();
const hasHomeCache = Boolean(cachedMoments?.length || cachedCompanions?.length);

const companions = ref(cachedCompanions ?? []);
const moments = ref(cachedMoments ?? []);

const loading = ref(!hasHomeCache);
const refreshing = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);

const previewImage = ref(null);
const hasUnread = ref(false);
const showBackToTop = ref(false);

// 分页偏移量
let momentsOffset = 0;

// scroll-view 控制
const scrollTopControl = ref(0);
let lastScrollTop = 0;

// ───────────────── 筛选条件 ─────────────────
const momentFilterLang = ref("");
const momentFilterGender = ref("");
const momentFilterOrientation = ref("");
const showMomentFilter = ref(false);

// 草稿筛选值：弹窗内修改，点"应用"才生效
const draftFilterLang = ref("");
const draftFilterGender = ref("");
const draftFilterOrientation = ref("");

const filterActive = computed(() =>
  Boolean(momentFilterLang.value || momentFilterGender.value || momentFilterOrientation.value)
);

const langOptions = computed(() => [
  { value: "", label: t("home.filterAll") },
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Español" },
  { value: "id", label: "Bahasa Indonesia" },
]);

const genderOptions = computed(() => [
  { value: "", label: t("home.filterAll") },
  { value: "男", label: t("register.male") },
  { value: "女", label: t("register.female") },
]);

const orientationOptions = computed(() => [
  { value: "", label: t("home.filterAll") },
  { value: "heterosexual", label: t("register.heterosexual") },
  { value: "homosexual", label: t("register.homosexual") },
  { value: "bisexual", label: t("register.bisexual") },
  { value: "pansexual", label: t("register.pansexual") },
  { value: "asexual", label: t("register.asexual") },
  { value: "secret", label: t("register.secret") },
]);

function optionLabel(
  options,
  value) {
  return options.find((o) => o.value === value)?.label || options[0].label;
}

// ───────────────── 评论输入（每条动态独立草稿） ─────────────────
const commentDrafts = ref({});
const commentBusy = ref({});
/** uni-input 清空 :value 后 DOM 常不刷新，靠 remount 强制同步 */
const commentInputKeys = ref({});
/** 点击 💬 时聚焦对应输入框（对齐朋友圈详情 / 微信朋友圈） */
const focusedCommentId = ref("");

// ====================================================================
// 加载顶部智能体头像条
// ====================================================================
async function loadCompanionStrip() {
  const companionsRes = await fetchCompanions({ filter_type: "mine" });
  const userLang = locale.value || "zh";
  const sorted = sortCompanionsByUserLang(companionsRes || [], userLang);
  const mapped = sorted.map((c) => ({
    id: c.profile?.id || "",
    name: formatCompanionName(c.profile?.name, t("home.defaultCompanionName")),
    avatar:
      c.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profile?.id}`,
    affection: c.state?.affection || 0,
    gender: c.profile?.gender || "",
    avatar_generating: c.avatar_generating,
  }));
  companions.value = mapped;
  writeHomeCompanionsStripCache(mapped);
}

// ====================================================================
// 加载朋友圈动态（分页）
//   isRefresh: true=刷新（offset=0, 替换列表）, false=加载更多（追加去重）
//   filters:   可选筛选参数，不传则用当前生效筛选值
// ====================================================================
async function loadMomentsPage(
  isRefresh,
  filters
) {
  const currentOffset = isRefresh ? 0 : momentsOffset;
  const fl = filters?.filter_lang ?? momentFilterLang.value;
  const fg = filters?.gender ?? momentFilterGender.value;
  const fo = filters?.orientation ?? momentFilterOrientation.value;

  const mq = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(currentOffset),
    lang: locale.value || "zh",
  });
  if (fl) mq.set("filter_lang", fl);
  if (fg) mq.set("gender", fg);
  if (fo) mq.set("orientation", fo);

  const momentsRes = await apiFetch(
    `/api/moments?${mq.toString()}`,
    { header: deviceHeaders() }
  );

  const newMoments = momentsRes.moments || [];
  const newTotal = momentsRes.total || 0;

  const nextOffset = currentOffset + newMoments.length;
  momentsOffset = nextOffset;

  if (isRefresh) {
    moments.value = newMoments;
    writeHomeMomentsCache(newMoments);
  } else {
    const existingIds = new Set(moments.value.map((m) => m.id));
    const uniqueNew = newMoments.filter((m) => !existingIds.has(m.id));
    const merged = [...moments.value, ...uniqueNew];
    moments.value = merged;
    writeHomeMomentsCache(merged);
  }

  hasMore.value = nextOffset < newTotal;

  // 检测未读：新动态 / AI 回复评论 / 聊天未读
  if (isRefresh) {
    hasUnread.value = computeHomeHasUnread(newMoments);
  }
}

// ====================================================================
// 全量刷新：智能体条 + 朋友圈首页
//   isPull=true  → 下拉刷新（refreshing 状态）
//   isPull=false → 首次加载（无缓存时 loading 状态 → 骨架屏）
// ====================================================================
async function performFullRefresh(isPull) {
  const hasCachedUi = companions.value.length > 0 || moments.value.length > 0;
  if (isPull) refreshing.value = true;
  else if (!hasCachedUi) loading.value = true;
  try {
    await Promise.all([loadCompanionStrip(), loadMomentsPage(true)]);
  } catch (e) {
    console.error("加载失败:", e);
  } finally {
    if (isPull) refreshing.value = false;
    else loading.value = false;
  }
}

// ====================================================================
// 滚动到底部 → 加载下一页
// ====================================================================
async function loadMore() {
  if (loadingMore.value || !hasMore.value || loading.value) return;
  loadingMore.value = true;
  try {
    await loadMomentsPage(false);
  } catch (e) {
    console.error("加载更多失败:", e);
  } finally {
    loadingMore.value = false;
  }
}

function onRefresh() {
  if (refreshing.value) return;
  void performFullRefresh(true);
}

function onScroll(e) {
  lastScrollTop = e.detail.scrollTop;
  showBackToTop.value = e.detail.scrollTop > 200;
  tabScroll.setScroll(TAB_PATH, e.detail.scrollTop);
}

watch(
  () => tabScroll.scrollToTopTick[TAB_PATH],
  () => {
    scrollHomeToTop();
  }
);

function scrollHomeToTop() {
  // :scroll-top 只在值变化时生效，先同步到当前位置再归零
  scrollTopControl.value = lastScrollTop;
  void nextTick(() => {
    scrollTopControl.value = 0;
  });
}

// ====================================================================
// 点赞/取消点赞（乐观更新，后端返回最终状态）
// ====================================================================
function sameMomentId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

function draftKey(momentId) {
  return String(momentId);
}

function onCommentInput(momentId, e) {
  const key = draftKey(momentId);
  const value = e?.detail?.value ?? "";
  commentDrafts.value = { ...commentDrafts.value, [key]: value };
}

function onCommentBlur(momentId) {
  if (focusedCommentId.value === draftKey(momentId)) {
    focusedCommentId.value = "";
  }
}

/** 点击 💬：聚焦本条评论框，不跳详情打断输入 */
function focusMomentComment(momentId) {
  const key = draftKey(momentId);
  focusedCommentId.value = "";
  void nextTick(() => {
    focusedCommentId.value = key;
  });
}

async function handleLike(momentId) {
  try {
    const data = await apiFetch(
      `/api/moments/${momentId}/like`,
      { method: "POST", header: deviceHeaders() }
    );
    if (data?.ok) {
      moments.value = moments.value.map((m) =>
        sameMomentId(m.id, momentId)
          ? { ...m, liked: !!data.liked, likes_count: data.likes_count ?? m.likes_count }
          : m
      );
      writeHomeMomentsCache(moments.value);
    } else if (data?.error) {
      showToast(String(data.error));
    }
  } catch (e) {
    console.error("点赞失败:", e);
  }
}

function patchMomentComments(momentId, patchFn) {
  moments.value = moments.value.map((m) => {
    if (!sameMomentId(m.id, momentId)) return m;
    return patchFn(m);
  });
  writeHomeMomentsCache(moments.value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 后台 AI 回复就绪后合并进列表（不阻塞输入） */
async function pollMomentAiReply(momentId, userCommentId) {
  for (let i = 0; i < 20; i++) {
    await sleep(2000);
    try {
      const detail = await apiFetch(`/api/moments/${momentId}`, {
        header: deviceHeaders(),
      });
      const remote = detail?.comments || [];
      if (!remote.length) continue;

      const aiReady = remote.some(
        (c) =>
          !c.is_user &&
          (userCommentId == null ||
            String(userCommentId).startsWith("tmp-") ||
            sameMomentId(c.parent_id, userCommentId))
      );

      patchMomentComments(momentId, (m) => {
        const prev = m.comments || [];
        const byId = new Map(
          prev
            .filter((c) => !String(c.id).startsWith("tmp-"))
            .map((c) => [String(c.id), c])
        );
        for (const c of remote) {
          byId.set(String(c.id), c);
        }
        const merged = [...byId.values()].sort((a, b) => {
          const ta = new Date(a.created_at || 0).getTime();
          const tb = new Date(b.created_at || 0).getTime();
          return ta - tb;
        });
        return {
          ...m,
          comments: merged,
          comments_count: detail.comments_count ?? Math.max(m.comments_count || 0, merged.length),
        };
      });
      if (aiReady) {
        const replies = findAiRepliesToUser(remote).filter(
          (c) =>
            userCommentId == null ||
            String(userCommentId).startsWith("tmp-") ||
            sameMomentId(c.parent_id, userCommentId)
        );
        const momentRow = moments.value.find((m) => sameMomentId(m.id, momentId));
        for (const c of replies) {
          recordLocalReplyNotif({
            replyId: c.id,
            momentId,
            title:
              c.companion_name ||
              momentRow?.companion_name ||
              t("home.defaultCompanionName"),
            content: c.content || "",
            avatar: momentRow?.companion_avatar || "",
            imageUrl: momentRow?.image_url || "",
            time: c.created_at,
            companionId: c.companion_id || momentRow?.companion_id,
          });
        }
        hasUnread.value = computeHomeHasUnread(moments.value);
        return;
      }
    } catch (e) {
      console.warn("轮询 AI 回复失败:", e);
    }
  }
}

// ====================================================================
// 发送评论：
//   1. 立刻乐观追加用户评论并清空输入（不 loading 等 AI）
//   2. POST 只等待评论落库；AI 后台生成
//   3. 轮询合并 AI 回复；失败则回滚乐观评论
// ====================================================================
async function handleComment(momentId, e) {
  const key = draftKey(momentId);
  const fromEvent = typeof e?.detail?.value === "string" ? e.detail.value : null;
  const content = (fromEvent ?? commentDrafts.value[key] ?? "").trim();
  if (!content || commentBusy.value[key]) return;

  const tempId = `tmp-${key}-${Date.now()}`;
  commentBusy.value = { ...commentBusy.value, [key]: true };
  commentDrafts.value = { ...commentDrafts.value, [key]: "" };
  commentInputKeys.value = {
    ...commentInputKeys.value,
    [key]: (commentInputKeys.value[key] || 0) + 1,
  };
  focusedCommentId.value = "";

  patchMomentComments(momentId, (m) => ({
    ...m,
    comments_count: (m.comments_count || 0) + 1,
    comments: [
      ...(m.comments || []),
      {
        id: tempId,
        user_id: getCurrentUserId(),
        is_user: true,
        companion_id: null,
        companion_name: t("common.me"),
        content,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ],
  }));
  // 输入区立刻恢复，不因 AI 生成卡住
  commentBusy.value = { ...commentBusy.value, [key]: false };

  try {
    const data = await apiFetch(`/api/moments/${momentId}/comment`, {
      method: "POST",
      header: {
        ...deviceHeaders(),
        "Content-Type": "application/json",
      },
      data: { content },
      // 仅等用户评论落库；AI 在后台
      timeout: 20000,
    });
    if (data?.ok) {
      patchMomentComments(momentId, (m) => {
        const prev = m.comments || [];
        const hadTemp = prev.some((c) => c.id === tempId);
        const hadReal = prev.some((c) => sameMomentId(c.id, data.id));
        const withoutDup = prev.filter(
          (c) => c.id !== tempId && !sameMomentId(c.id, data.id)
        );
        const newComments = [
          ...withoutDup,
          {
            id: data.id,
            user_id: getCurrentUserId(),
            is_user: true,
            companion_id: null,
            companion_name: t("common.me"),
            content: data.content || content,
            created_at: data.created_at,
          },
        ];
        let countDelta = 0;
        if (!hadTemp && !hadReal) countDelta += 1;
        // 兼容仍同步返回 ai_reply 的旧后端
        if (
          data.ai_reply &&
          !prev.some((c) => sameMomentId(c.id, data.ai_reply.id)) &&
          !newComments.some((c) => sameMomentId(c.id, data.ai_reply.id))
        ) {
          newComments.push(data.ai_reply);
          countDelta += 1;
        }
        return {
          ...m,
          comments_count: (m.comments_count || 0) + countDelta,
          comments: newComments,
        };
      });
      if (!data.ai_reply) {
        void pollMomentAiReply(momentId, data.id);
      } else {
        const momentRow = moments.value.find((m) => sameMomentId(m.id, momentId));
        recordLocalReplyNotif({
          replyId: data.ai_reply.id,
          momentId,
          title:
            data.ai_reply.companion_name ||
            momentRow?.companion_name ||
            t("home.defaultCompanionName"),
          content: data.ai_reply.content || "",
          avatar: momentRow?.companion_avatar || "",
          imageUrl: momentRow?.image_url || "",
          time: data.ai_reply.created_at,
          companionId: data.ai_reply.companion_id || momentRow?.companion_id,
        });
        hasUnread.value = computeHomeHasUnread(moments.value);
      }
    } else {
      patchMomentComments(momentId, (m) => ({
        ...m,
        comments_count: Math.max(0, (m.comments_count || 0) - 1),
        comments: (m.comments || []).filter((c) => c.id !== tempId),
      }));
      commentDrafts.value = { ...commentDrafts.value, [key]: content };
      commentInputKeys.value = {
        ...commentInputKeys.value,
        [key]: (commentInputKeys.value[key] || 0) + 1,
      };
      showToast(String(data?.error || data?.detail || t("common.networkError")));
    }
  } catch (err) {
    console.error("评论失败:", err);
    const msg = String(err?.errMsg || err?.message || err || "");
    const timedOut = /timeout|超时|timed?\s*out/i.test(msg);
    if (timedOut) {
      // 旧后端仍同步等 AI 时可能超时：不回滚，改为轮询同步
      void pollMomentAiReply(momentId, tempId);
    } else {
      patchMomentComments(momentId, (m) => ({
        ...m,
        comments_count: Math.max(0, (m.comments_count || 0) - 1),
        comments: (m.comments || []).filter((c) => c.id !== tempId),
      }));
      commentDrafts.value = { ...commentDrafts.value, [key]: content };
      commentInputKeys.value = {
        ...commentInputKeys.value,
        [key]: (commentInputKeys.value[key] || 0) + 1,
      };
    }
  }
}

function isCommentByMe(comment) {
  if (!comment) return false;
  if (comment.is_user) return true;
  const currentUserId = getCurrentUserId();
  const userId = comment.user_id;
  return (
    userId != null &&
    currentUserId != null &&
    String(userId) === String(currentUserId)
  );
}

// ───────────────── 筛选弹窗 ─────────────────
function openMomentFilter() {
  draftFilterLang.value = momentFilterLang.value;
  draftFilterGender.value = momentFilterGender.value;
  draftFilterOrientation.value = momentFilterOrientation.value;
  showMomentFilter.value = true;
}

function resetDraftFilter() {
  draftFilterLang.value = "";
  draftFilterGender.value = "";
  draftFilterOrientation.value = "";
}

function applyMomentFilter() {
  momentFilterLang.value = draftFilterLang.value;
  momentFilterGender.value = draftFilterGender.value;
  momentFilterOrientation.value = draftFilterOrientation.value;
  momentsOffset = 0;
  showMomentFilter.value = false;
  void (async () => {
    loading.value = true;
    try {
      await Promise.all([
        loadCompanionStrip(),
        loadMomentsPage(true, {
          filter_lang: draftFilterLang.value,
          gender: draftFilterGender.value,
          orientation: draftFilterOrientation.value,
        }),
      ]);
    } finally {
      loading.value = false;
    }
  })();
}

function onPickLang(e) {
  draftFilterLang.value = langOptions.value[Number(e.detail.value)]?.value ?? "";
}
function onPickGender(e) {
  draftFilterGender.value = genderOptions.value[Number(e.detail.value)]?.value ?? "";
}
function onPickOrientation(e) {
  draftFilterOrientation.value =
    orientationOptions.value[Number(e.detail.value)]?.value ?? "";
}

// ───────────────── 导航 ─────────────────
function openCompanion(id) {
  uni.navigateTo({ url: `/pages-sub/companion/index?id=${id}` });
}

function openMoment(id) {
  // 从详情返回后同步首页评论/点赞
  pendingMomentSync = true;
  uni.navigateTo({ url: `/pages-sub/moment/index?id=${id}` });
}

function goCreate() {
  uni.navigateTo({ url: "/pages-sub/create/index" });
}

function goNotifications() {
  uni.navigateTo({ url: "/pages-sub/notifications/index" });
}

function closePreview() {
  previewImage.value = null;
}

const onLikeTap = bindAnalyticsTapArg(
  "home-moment-like",
  handleLike,
  "首页朋友圈点赞"
);
const onCommentOpenTap = bindAnalyticsTapArg(
  "home-moment-comment",
  focusMomentComment,
  "首页朋友圈评论"
);
const onMomentDetailTap = bindAnalyticsTapArg(
  "home-moment-detail",
  openMoment,
  "首页朋友圈详情"
);
const onSendCommentTap = bindAnalyticsTapArg(
  "home-send-comment",
  handleComment,
  "首页发送评论"
);
const onCompanionStripTap = bindAnalyticsTapArg(
  (id) => `home-companion-${id}`,
  openCompanion
);

// ───────────────── 展示辅助 ─────────────────
function getCompanionById(id) {
  return companions.value.find((c) => c.id === id);
}

function displayName(m) {
  return formatCompanionName(
    m.companion_name || getCompanionById(m.companion_id)?.name,
    t("home.defaultCompanionName")
  );
}

function displayGender(m) {
  return m.companion_gender ?? getCompanionById(m.companion_id)?.gender ?? "";
}

function displayAvatar(m) {
  return m.companion_avatar || getCompanionById(m.companion_id)?.avatar || "";
}

// ───────────────── 生命周期 ─────────────────
onMounted(() => {
  void performFullRefresh(false).finally(() => {
    initialized = true;
  });
});

// 对齐 React visibilitychange：切回首页刷智能体条；从详情返回时再刷朋友圈
onShow(() => {
  if (!initialized) return;
  hasUnread.value = computeHomeHasUnread(moments.value);
  void loadCompanionStrip().catch((e) => console.error(e));
  if (!pendingMomentSync) return;
  pendingMomentSync = false;
  const commenting = Object.values(commentBusy.value).some(Boolean);
  if (commenting) return;
  void loadMomentsPage(true).catch((e) => console.error(e));
});
</script>

<template>
  <AppPageShell :show-header="false" show-tab-bar>
    <view class="home-page">
      <!-- ═════════════ 顶部标题栏 + 筛选/通知 ═════════════ -->
      <view class="home-header">
        <view class="flex-row justify-between items-center">
          <text class="page-title">Moments</text>
          <view class="flex-row items-center header-actions">
            <text v-if="refreshing" class="text-muted refreshing-hint">⟳</text>
            <!-- 筛选按钮：筛选激活时显示小粉点 -->
            <view class="icon-btn" @tap="bindAnalyticsTap('home-moment-filter', openMomentFilter, '朋友圈筛选')">
              <text class="icon-txt">⚙️</text>
              <view v-if="filterActive" class="dot" />
            </view>
            <!-- 通知铃铛 -->
            <view class="icon-btn" @tap="bindAnalyticsTap('home-notification', goNotifications, '通知')">
              <text class="icon-txt">🔔</text>
              <view v-if="hasUnread" class="dot" />
            </view>
          </view>
        </view>
      </view>

      <!-- ═════════════ 首屏骨架（无缓存时） ═════════════ -->
      <view v-if="loading && !companions.length && !moments.length" class="home-body">
        <AppListSkeleton :rows="6" />
      </view>

      <!-- ═════════════ 主滚动区：下拉刷新 + 无限滚动 ═════════════ -->
      <scroll-view
        v-else
        scroll-y
        class="home-body"
        :scroll-top="scrollTopControl"
        scroll-with-animation
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        refresher-background="var(--bg)"
        :lower-threshold="240"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        @scroll="onScroll"
      >
        <!-- ── 智能体头像横滑条（含创建入口） ── -->
        <view class="strip-wrap">
          <scroll-view scroll-x class="companion-strip" show-scrollbar="false">
            <view class="strip-row">
              <view class="strip-item" @tap="bindAnalyticsTap('home-create-companion', goCreate, '创建伴侣')">
                <view class="strip-create">
                  <text class="strip-plus">＋</text>
                </view>
                <text class="strip-name text-muted">{{ t("home.create") }}</text>
              </view>
              <view
                v-for="c in companions"
                :key="c.id"
                class="strip-item"
                @tap="onCompanionStripTap(c.id)"
              >
                <view class="strip-avatar">
                  <AppAvatarImage
                    :src="c.avatar"
                    :seed="c.id"
                    :generating="c.avatar_generating"
                  />
                </view>
                <text class="strip-name">{{ c.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- ── 朋友圈动态列表 ── -->
        <view v-if="!moments.length" class="empty text-muted">
          {{ t("home.noMoments") }}
        </view>

        <view v-for="m in moments" :key="m.id" class="moment-card">
          <!-- 发布者信息 -->
          <view class="flex-row items-center gap-sm moment-head">
            <view @tap="openCompanion(m.companion_id)">
              <AppAvatarImage :src="displayAvatar(m)" :seed="m.companion_id" size="sm" />
            </view>
            <view class="flex-1">
              <view class="flex-row items-center name-row">
                <text class="moment-name">{{ displayName(m) }}</text>
                <text v-if="displayGender(m) === '男'" class="gender male">♂</text>
                <text v-if="displayGender(m) === '女'" class="gender female">♀</text>
              </view>
              <text class="text-muted moment-time">{{ formatRelativeTime(m.created_at) }}</text>
            </view>
          </view>

          <!-- 文案 -->
          <text class="moment-caption">{{ m.caption }}</text>

          <!-- 图片：生成中 → 占位 spinner，否则可点击预览 -->
          <view v-if="m.image_generating" class="moment-generating">
            <text class="text-muted">{{ t("common.loading") }}</text>
          </view>
          <AppMomentImage
            v-else
            :src="m.image_url"
            mode="aspectFill"
            img-class="moment-img"
            @click="previewImage = m.image_url"
          />

          <!-- 点赞 / 评论（💬 聚焦输入；点评论区进详情） -->
          <view class="moment-actions flex-row items-center">
            <view class="action-btn flex-row items-center" @tap="onLikeTap(m.id)">
              <text class="action-icon" :class="{ liked: m.liked }">
                {{ m.liked ? "♥" : "♡" }}
              </text>
              <text class="action-count">{{ m.likes_count }}</text>
            </view>
            <view class="action-btn flex-row items-center" @tap="onCommentOpenTap(m.id)">
              <text class="action-icon">💬</text>
              <text class="action-count">{{ m.comments_count }}</text>
            </view>
          </view>

          <!-- 评论列表 -->
          <view
            v-if="m.comments && m.comments.length"
            class="comments-box"
            @tap="onMomentDetailTap(m.id)"
          >
            <view v-for="comment in m.comments" :key="comment.id" class="comment-line">
              <text
                class="comment-name"
                :class="isCommentByMe(comment) ? 'mine' : 'text-primary'"
              >
                {{
                  isCommentByMe(comment)
                    ? t("common.me")
                    : formatCompanionName(comment.companion_name, t("home.defaultCompanionName"))
                }}
              </text>
              <text class="comment-content" :class="{ pending: comment.pending }">
                <text v-if="comment.reply_to_name" class="text-primary reply-to">
                  @{{
                    comment.reply_to_name === "我"
                      ? t("common.me")
                      : comment.reply_to_name
                  }}
                </text>
                {{ comment.content }}
              </text>
            </view>
          </view>

          <!-- 评论输入（uni-input 清空 :value 不刷新 DOM，靠 :key remount） -->
          <view class="comment-input-row flex-row items-center gap-sm">
            <input
              :key="`cmt-${m.id}-${commentInputKeys[String(m.id)] || 0}`"
              :value="commentDrafts[String(m.id)] || ''"
              class="comment-input"
              :focus="focusedCommentId === String(m.id)"
              :disabled="!!commentBusy[String(m.id)]"
              :placeholder="t('home.writeComment')"
              confirm-type="send"
              @input="onCommentInput(m.id, $event)"
              @confirm="handleComment(m.id, $event)"
              @blur="onCommentBlur(m.id)"
            />
            <view
              class="send-btn"
              :class="{ disabled: commentBusy[String(m.id)] || !(commentDrafts[String(m.id)] || '').trim() }"
              @tap="onSendCommentTap(m.id)"
            >
              <text>➤</text>
            </view>
          </view>
        </view>

        <!-- 底部加载状态 -->
        <view class="footer-hint">
          <text v-if="loadingMore" class="text-muted">{{ t("common.loading") }}</text>
          <text v-else-if="!hasMore && moments.length" class="text-muted no-more">
            {{ t("home.noMoreMoments") }}
          </text>
        </view>
      </scroll-view>

      <!-- ═════════════ 返回顶部悬浮按钮 ═════════════ -->
      <view v-if="showBackToTop" class="back-to-top" @tap="bindAnalyticsTap('home-back-to-top', scrollHomeToTop, '返回顶部')">
        <text>↑</text>
      </view>
    </view>

    <!-- ═════════════ 筛选弹窗 ═════════════ -->
    <view v-if="showMomentFilter" class="modal-mask" @tap="showMomentFilter = false">
      <view class="modal-sheet" @tap.stop>
        <view class="modal-header flex-row justify-between items-center">
          <text class="modal-title">{{ t("home.momentFilter") }}</text>
          <text class="modal-close text-muted" @tap="showMomentFilter = false">✕</text>
        </view>

        <view class="modal-body">
          <!-- 语言筛选 -->
          <view class="filter-group">
            <text class="filter-label text-muted">{{ t("home.filterLanguage") }}</text>
            <picker
              mode="selector"
              :range="langOptions.map((o) => o.label)"
              @change="onPickLang"
            >
              <view class="filter-select flex-row justify-between items-center">
                <text>{{ optionLabel(langOptions, draftFilterLang) }}</text>
                <text class="text-muted">›</text>
              </view>
            </picker>
          </view>

          <!-- 性别筛选 -->
          <view class="filter-group">
            <text class="filter-label text-muted">{{ t("home.filterGender") }}</text>
            <picker
              mode="selector"
              :range="genderOptions.map((o) => o.label)"
              @change="onPickGender"
            >
              <view class="filter-select flex-row justify-between items-center">
                <text>{{ optionLabel(genderOptions, draftFilterGender) }}</text>
                <text class="text-muted">›</text>
              </view>
            </picker>
          </view>

          <!-- 性取向筛选 -->
          <view class="filter-group">
            <text class="filter-label text-muted">{{ t("home.filterOrientation") }}</text>
            <picker
              mode="selector"
              :range="orientationOptions.map((o) => o.label)"
              @change="onPickOrientation"
            >
              <view class="filter-select flex-row justify-between items-center">
                <text>{{ optionLabel(orientationOptions, draftFilterOrientation) }}</text>
                <text class="text-muted">›</text>
              </view>
            </picker>
          </view>

          <!-- 重置 / 应用 -->
          <view class="flex-row gap-sm filter-footer">
            <view class="filter-btn reset" @tap="resetDraftFilter">
              <text>{{ t("home.resetFilter") }}</text>
            </view>
            <view class="filter-btn apply" @tap="applyMomentFilter">
              <text>{{ t("home.applyFilter") }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ═════════════ 图片全屏预览 ═════════════ -->
    <view v-if="previewImage" class="preview-mask" @tap="closePreview">
      <view class="preview-close" @tap="bindAnalyticsTap('home-close-preview', closePreview, '关闭预览')">
        <text>✕</text>
      </view>
      <view class="preview-body" @tap.stop>
        <AppMomentImage
          :src="previewImage"
          :prefer-thumb="false"
          mode="aspectFit"
          img-class="preview-img"
        />
      </view>
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  background: var(--bg);
}

.home-header {
  flex-shrink: 0;
  padding: calc(env(safe-area-inset-top) + 16rpx) 32rpx 20rpx;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--fg);
}

.header-actions { gap: 8rpx; }

.refreshing-hint {
  font-size: 32rpx;
  margin-right: 8rpx;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-btn {
  position: relative;
  padding: 12rpx;
}

.icon-txt { font-size: 40rpx; }

.dot {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 14rpx;
  height: 14rpx;
  background: var(--brand);
  border-radius: 50%;
}

.home-body {
  flex: 1;
  height: 0;
  min-height: 0;
  box-sizing: border-box;
}

.strip-wrap {
  border-bottom: 1px solid var(--border);
  padding: 24rpx 0;
}

.companion-strip {
  white-space: nowrap;
  box-sizing: border-box;
  width: 100%;
}

.strip-row {
  display: inline-flex;
  flex-direction: row;
  gap: 28rpx;
  padding: 0 32rpx;
}

.strip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 128rpx;
}

.strip-create {
  display: flex;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: var(--bg-input);
  border: 2rpx dashed var(--border);
}

.strip-plus {
  font-size: 56rpx;
  color: var(--fg-muted);
  line-height: 1;
}

.strip-avatar :deep(.avatar-root) {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
}

.strip-name {
  font-size: 22rpx;
  margin-top: 12rpx;
  max-width: 160rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  color: var(--fg);
}

.empty {
  text-align: center;
  font-size: 26rpx;
  padding: 80rpx 32rpx;
}

.moment-card {
  border-bottom: 1px solid var(--border);
  padding: 32rpx;
}

.moment-head { margin-bottom: 16rpx; }
.name-row { gap: 8rpx; }
.moment-name { font-size: 28rpx; font-weight: 500; color: var(--fg); }
.gender {
  font-size: 22rpx;
  &.male { color: #60a5fa; }
  &.female { color: #f472b6; }
}
.moment-time { font-size: 22rpx; }
.moment-caption {
  display: block;
  font-size: 28rpx;
  line-height: 1.5;
  color: var(--fg);
  margin: 12rpx 0 16rpx;
}
.moment-generating {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 360rpx;
  background: var(--bg-input);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}
:deep(.moment-img) {
  width: 100%;
  max-height: 720rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
}
.moment-actions { gap: 40rpx; margin: 8rpx 0 16rpx; }
.action-btn { gap: 8rpx; }
.action-icon {
  font-size: 40rpx;
  color: var(--fg-muted);
  &.liked { color: var(--brand); }
}
.action-count { font-size: 26rpx; color: var(--fg-muted); }
.comments-box {
  background: var(--bg-input);
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
}
.comment-line {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--fg);
  margin-bottom: 8rpx;
}
.comment-name {
  font-weight: 500;
  margin-right: 8rpx;
  color: var(--brand);
  &.mine { color: var(--brand); }
}
.comment-content {
  word-break: break-all;
  &.pending { opacity: 0.65; }
}
.reply-to { font-weight: 500; margin-right: 4rpx; }
.comment-input-row { margin-top: 8rpx; }
.comment-input {
  flex: 1;
  border-radius: 999px;
  font-size: 26rpx;
  background: var(--bg-input);
  border: 1px solid var(--border);
  color: var(--fg);
  padding: 16rpx 28rpx;
  height: auto !important;
  min-height: 64rpx;
  line-height: 1.4;
  overflow: visible;
  box-sizing: border-box;
}
.send-btn {
  font-size: 32rpx;
  padding: 12rpx 16rpx;
  color: var(--brand);
  &.disabled { opacity: 0.45; pointer-events: none; }
}
.footer-hint {
  text-align: center;
  font-size: 26rpx;
  padding: 32rpx 0 48rpx;
  .no-more { font-size: 22rpx; }
}
.back-to-top {
  position: fixed;
  right: 32rpx;
  bottom: calc(var(--safe-tab) + 48rpx);
  z-index: 40;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  font-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
  color: var(--fg);
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal-sheet {
  width: 100%;
  max-width: 672px;
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: calc(var(--safe-tab) + 24rpx);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 32rpx; font-weight: 600; }
.modal-close { font-size: 36rpx; color: var(--fg-muted); padding: 8rpx; }
.modal-body { padding: 32rpx; }
.filter-group { margin-bottom: 32rpx; }
.filter-label {
  display: block;
  font-size: 24rpx;
  margin-bottom: 12rpx;
  color: var(--fg-muted);
}
.filter-select {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 24rpx;
  font-size: 28rpx;
  color: var(--fg);
  padding: 20rpx 28rpx;
}
.filter-footer { display: flex; gap: 20rpx; margin-top: 16rpx; }
.filter-btn {
  flex: 1;
  text-align: center;
  border-radius: 24rpx;
  font-size: 28rpx;
  padding: 22rpx 0;
  &.reset { background: var(--bg-input); color: var(--fg); }
  &.apply {
    background: linear-gradient(90deg, var(--brand), var(--brand-end));
    color: #fff;
  }
}
.preview-mask {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-close {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 24rpx);
  right: 32rpx;
  z-index: 111;
  font-size: 48rpx;
  color: #fff;
  padding: 16rpx;
}
.preview-body {
  width: 100%;
  box-sizing: border-box;
  padding: 48rpx;
}
:deep(.preview-img) {
  width: 100%;
  max-height: 80vh;
}
</style>
