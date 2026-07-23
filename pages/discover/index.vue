<script setup>
/**
 * @file pages/discover — 发现 Tab：社区帖子 + 伴侣发现
 * @description 双 Tab（posts/companions）；发帖含选图上传；伴侣筛选与排序。
 * @depends apiFetch、deviceHeaders、chooseAndUploadImages、companionsCache
 */
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth } from "@/composables/useAuth";
import { useRelativeTime } from "@/composables/useRelativeTime";
import { useChatStore } from "@/stores/chat";
import { showToast } from "@/stores/toast";
import apiFetch from "@/utils/api";
import { fetchCompanions, getCachedCompanions } from "@/utils/companionsCache";
import { sortCompanionsByUserLang } from "@/utils/companionLang";
import { formatAffectionDisplay } from "@/utils/formatAffection";
import {
  formatCompanionMeta,
  formatCompanionName,
  uiLangCode,
} from "@/utils/formatCompanion";
import { translatePersonalityTag } from "@/utils/personalityTags";
import { normalizeMediaUrl } from "@/utils/media";
import { deviceHeaders, chooseAndUploadImages } from "@/utils/device";
import { getItem, setItem } from "@/utils/storage";
import { bindAnalyticsTap, bindAnalyticsTapArg } from "@/utils/analytics";
import { useTabScrollStore } from "@/stores/tabScroll";

const TAB_PATH = "/pages/discover/index";
const tabScroll = useTabScrollStore();
let discoverLastScrollTop = 0;
const discoverScrollTop = ref(0);

const POST_CATEGORIES = [
  { key: "", label: "discover.catAll" },
  { key: "dating", label: "discover.catDating" },
  { key: "psychology", label: "discover.catPsychology" },
  { key: "tips", label: "discover.catTips" },
  { key: "story", label: "discover.catStory" },
  { key: "offtopic", label: "discover.catOfftopic" },
];

const POSTS_PAGE_SIZE = 20;
const IMAGE_FALLBACK =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5pWw5o2u5aSE55CG6ZSZ6K+vPC90ZXh0Pjwvc3ZnPg==";

const { t, te, locale } = useI18n();
const chat = useChatStore();
const { format: formatRelativeTime } = useRelativeTime("discover");
requireAuth();

// ——— Tab / 帖子 / 发帖 / 伴侣状态 ———

function loadSavedTab() {
  const saved = getItem("discover_tab");
  return saved === "companions" ? "companions" : "posts";
}

const activeTab = ref(loadSavedTab());

// 帖子
const posts = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const postsOffsetRef = ref(0);
const loadingMoreGuard = ref(false);
const hasMoreGuard = ref(true);

const searchQuery = ref("");
const searchResults = ref([]);
const searchLoading = ref(false);
let searchTimer = null;

const activeCategory = ref("");

// 发帖
const showCreate = ref(false);
const newTitle = ref("");
const newContent = ref("");
const newCategory = ref("");
const newImages = ref([]);
const uploadingImages = ref(false);
const creating = ref(false);

// 伴侣
const initialCachedCompanions = getCachedCompanions() ?? [];
const companions = ref(
  initialCachedCompanions.length
    ? sortCompanionsByUserLang(initialCachedCompanions, locale.value || "zh")
    : []
);
const companionFilter = ref("all");
const companionsLoading = ref(!initialCachedCompanions.length);
const refreshing = ref(false);

const displayPosts = computed(() =>
  searchQuery.value.trim() ? searchResults.value : posts.value
);
const isSearchLoading = computed(() => Boolean(searchQuery.value.trim()) && searchLoading.value);

const uiLang = computed(() => uiLangCode(locale.value));

const displayCompanions = computed(() => {
  if (companionFilter.value === "recommended") {
    return [...companions.value]
      .sort((a, b) => {
        const ma = (a.profile.language || "").split("-")[0] === uiLang.value ? 1 : 0;
        const mb = (b.profile.language || "").split("-")[0] === uiLang.value ? 1 : 0;
        if (mb !== ma) return mb - ma;
        return (b.state.turns || 0) - (a.state.turns || 0);
      })
      .slice(0, 10);
  }
  return companions.value;
});

function categoryLabel(key) {
  if (!key) return "";
  const i18nKey = `discover.cat_${key}`;
  // 运营机可能返回中文分类名（如「日常」），无对应文案时直接展示原文，避免 intlify 缺键告警
  if (typeof te === "function" && !te(i18nKey)) return String(key);
  const label = t(i18nKey);
  return label === i18nKey ? String(key) : label;
}

function splitPersonalities(personality) {
  if (!personality) return [];
  return personality.split(/[、,，]/).filter(Boolean).slice(0, 3);
}

// ——— 帖子加载 ———

/** 按分类/分页加载社区帖子列表 */
async function fetchPosts(reset = true) {
  if (!reset) {
    if (loadingMoreGuard.value || !hasMoreGuard.value) return;
    loadingMoreGuard.value = true;
    loadingMore.value = true;
  } else {
    loading.value = true;
    postsOffsetRef.value = 0;
    hasMoreGuard.value = true;
    hasMorePosts.value = true;
  }

  try {
    const offset = reset ? 0 : postsOffsetRef.value;
    const params = new URLSearchParams({
      limit: String(POSTS_PAGE_SIZE),
      offset: String(offset),
    });
    if (activeCategory.value) params.set("category", activeCategory.value);

    const data = await apiFetch(
      `/api/posts?${params}`,
      { header: deviceHeaders() }
    );
    const batch = data.posts || [];
    const total = typeof data.total === "number" ? data.total : 0;

    if (reset) {
      posts.value = batch;
      postsOffsetRef.value = batch.length;
      const more = batch.length < total;
      hasMoreGuard.value = more;
      hasMorePosts.value = more;
    } else {
      const ids = new Set(posts.value.map((p) => p.id));
      posts.value = [...posts.value, ...batch.filter((p) => !ids.has(p.id))];
      const nextOffset = offset + batch.length;
      postsOffsetRef.value = nextOffset;
      const more = nextOffset < total && batch.length > 0;
      hasMoreGuard.value = more;
      hasMorePosts.value = more;
    }
  } catch (err) {
    console.error("加载帖子失败:", err);
  } finally {
    loading.value = false;
    loadingMoreGuard.value = false;
    loadingMore.value = false;
  }
}

// ——— 伴侣列表 ———

/** 拉取发现页伴侣列表并排序 */
async function loadCompanions() {
  const cached = getCachedCompanions();
  if (cached?.length && !companions.value.length) {
    companions.value = sortCompanionsByUserLang(cached, locale.value || "zh");
  }
  if (!companions.value.length) {
    companionsLoading.value = true;
  }
  try {
    const data = await fetchCompanions();
    const userLang = locale.value || "zh";
    companions.value = sortCompanionsByUserLang(data || [], userLang);
  } catch (err) {
    console.error("加载智能体列表失败:", err);
  } finally {
    companionsLoading.value = false;
  }
}

function onScrollToLower() {
  if (activeTab.value !== "posts" || searchQuery.value.trim()) return;
  fetchPosts(false);
}

async function onRefresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await Promise.all([
      activeTab.value === "posts" ? fetchPosts(true) : Promise.resolve(),
      loadCompanions(),
    ]);
  } finally {
    refreshing.value = false;
  }
}

// ——— 发帖与互动 ———

async function handleCreatePost() {
  const title = newTitle.value.trim();
  const content = newContent.value.trim();
  if (!title || !content) return;
  creating.value = true;
  try {
    await apiFetch("/api/posts", {
      method: "POST",
      header: deviceHeaders(),
      data: {
        title,
        content,
        category: newCategory.value,
        images: newImages.value,
      },
    });
    newTitle.value = "";
    newContent.value = "";
    newCategory.value = "";
    newImages.value = [];
    showCreate.value = false;
    fetchPosts(true);
  } catch {
    /* apiFetch handles errors */
  } finally {
    creating.value = false;
  }
}

async function handleAddImages() {
  if (newImages.value.length >= 9) {
    showToast((t("discover.maxImages")) || "最多上传 9 张图片");
    return;
  }
  uploadingImages.value = true;
  try {
    const urls = await chooseAndUploadImages(9, newImages.value.length);
    newImages.value = [...newImages.value, ...urls];
  } catch (err) {
    console.error("图片上传失败:", err);
    showToast((t("discover.imageUploadFailed")) || "图片上传失败");
  } finally {
    uploadingImages.value = false;
  }
}

function handleRemoveImage(index) {
  newImages.value = newImages.value.filter((_, i) => i !== index);
}

function closeCreateModal() {
  showCreate.value = false;
  newImages.value = [];
}

async function handleLike(postId) {
  try {
    const data = await apiFetch(
      `/api/posts/${postId}/like`,
      { method: "POST", header: deviceHeaders() }
    );
    if (data.ok) {
      const patch = (list) =>
        list.map((p) =>
          p.id === postId
            ? { ...p, liked: !!data.liked, likes_count: data.likes_count ?? p.likes_count }
            : p
        );
      posts.value = patch(posts.value);
      searchResults.value = patch(searchResults.value);
    }
  } catch (e) {
    console.error("点赞失败:", e);
  }
}

function openPost(id, opts = {}) {
  const focus = opts.focus ? "&focus=1" : "";
  uni.navigateTo({ url: `/pages-sub/post/index?id=${id}${focus}` });
}

function openPostForComment(id) {
  openPost(id, { focus: true });
}

function openCompanionProfile(id) {
  uni.navigateTo({ url: `/pages-sub/companion/index?id=${id}` });
}

function openCreateModal() {
  showCreate.value = true;
}

// ——— Tab 切换与滚动 ———

function switchToPostsTab() {
  activeTab.value = "posts";
}

function switchToCompanionsTab() {
  activeTab.value = "companions";
}

const onPostLikeTap = bindAnalyticsTapArg(
  "discover-post-like",
  handleLike,
  "发现页帖子点赞"
);
const onPostCommentTap = bindAnalyticsTapArg(
  "discover-post-comment",
  openPostForComment,
  "发现页帖子评论"
);
const onPostDetailTap = bindAnalyticsTapArg(
  "discover-view-detail",
  openPost,
  "发现页查看详情"
);

function onDiscoverScroll(e) {
  discoverLastScrollTop = e.detail.scrollTop;
  tabScroll.setScroll(TAB_PATH, e.detail.scrollTop);
}

function scrollDiscoverToTop() {
  discoverScrollTop.value = discoverLastScrollTop;
  void nextTick(() => {
    discoverScrollTop.value = 0;
  });
}

watch(
  () => tabScroll.scrollToTopTick[TAB_PATH],
  () => {
    scrollDiscoverToTop();
  }
);

function openChat(id) {
  chat.connect(id);
  uni.navigateTo({ url: `/pages/chat/index?id=${id}` });
}

function onImageError(e) {
  const target = e.target || null;
  if (target) target.src = IMAGE_FALLBACK;
}

watch(activeTab, (tab) => {
  setItem("discover_tab", tab);
  if (tab === "posts") {
    fetchPosts(true);
  } else {
    loadCompanions();
  }
});

watch(activeCategory, () => {
  searchQuery.value = "";
  if (activeTab.value === "posts") {
    fetchPosts(true);
  }
});

watch(searchQuery, (query) => {
  if (searchTimer) clearTimeout(searchTimer);
  const trimmed = query.trim();
  if (!trimmed) {
    searchResults.value = [];
    searchLoading.value = false;
    return;
  }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true;
    try {
      const data = await apiFetch(
        `/api/posts/search?q=${encodeURIComponent(trimmed)}&limit=50`,
        { header: deviceHeaders() }
      );
      searchResults.value = data.posts || [];
    } catch (err) {
      console.error("搜索失败:", err);
    } finally {
      searchLoading.value = false;
    }
  }, 400);
});

onMounted(() => {
  if (activeTab.value === "posts") {
    fetchPosts(true);
  } else {
    loadCompanions();
  }
});
</script>

<template>
  <AppPageShell :show-header="false" show-tab-bar>
    <!-- 发现页根容器：头部固定 + 内容可滚动 -->
    <view class="discover-page">
      <!-- 顶部：标题、发帖按钮、Tab 切换、搜索、分类筛选 -->
      <view class="discover-header">
        <view class="flex-row justify-between items-center header-top">
          <text class="page-title">{{ t("discover.title") }}</text>
          <view
            v-if="activeTab === 'posts'"
            class="btn-new-post"
            @tap="bindAnalyticsTap('discover-create-post', openCreateModal, '发帖')"
          >
            <text>＋ {{ t("discover.newPost") }}</text>
          </view>
        </view>

        <!-- Tab switch: posts / companions -->
        <view class="tab-switch">
          <view
            class="tab-switch-item"
            :class="{ active: activeTab === 'posts' }"
            @tap="bindAnalyticsTap('discover-tab-posts', switchToPostsTab, '帖子 Tab')"
          >
            <text>💬 {{ t("discover.tabPosts") }}</text>
          </view>
          <view
            class="tab-switch-item"
            :class="{ active: activeTab === 'companions' }"
            @tap="bindAnalyticsTap('discover-tab-companions', switchToCompanionsTab, '伴侣 Tab')"
          >
            <text>🤖 {{ t("discover.tabCompanions") }}</text>
          </view>
        </view>

        <template v-if="activeTab === 'posts'">
          <view class="search-wrap flex-row items-center gap-sm">
            <text class="search-icon">🔍</text>
            <input
              v-model="searchQuery"
              class="search-input"
              :placeholder="t('discover.searchPlaceholder')"
            />
            <text v-if="searchQuery" class="search-clear" @tap="searchQuery = ''">✕</text>
          </view>

          <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
            <view class="category-row">
              <view
                v-for="cat in POST_CATEGORIES"
                :key="cat.key || 'all'"
                class="category-chip"
                :class="{ active: activeCategory === cat.key }"
                @tap="activeCategory = cat.key"
              >
                <text>{{ t(cat.label) }}</text>
              </view>
            </view>
          </scroll-view>
        </template>

        <template v-else>
          <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
            <view class="category-row">
              <view
                class="category-chip"
                :class="{ active: companionFilter === 'all' }"
                @tap="companionFilter = 'all'"
              >
                <text>{{ t("discover.filterAll") }}</text>
              </view>
              <view
                class="category-chip"
                :class="{ active: companionFilter === 'recommended' }"
                @tap="companionFilter = 'recommended'"
              >
                <text>✨ {{ t("discover.filterRecommended") }}</text>
              </view>
            </view>
          </scroll-view>
        </template>
      </view>

      <!-- 可滚动内容区：支持下拉刷新、触底加载 -->
      <scroll-view
        scroll-y
        class="discover-body"
        :scroll-top="discoverScrollTop"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        refresher-background="var(--bg)"
        @scroll="onDiscoverScroll"
        @refresherrefresh="onRefresh"
        @scrolltolower="onScrollToLower"
        :lower-threshold="240"
      >
        <!-- 帖子 Tab -->
        <view v-if="activeTab === 'posts'" class="content px-md py-sm">
          <AppListSkeleton v-if="(isSearchLoading || loading) && !displayPosts.length" :rows="4" />

          <view v-else-if="!displayPosts.length" class="empty">
            <text class="empty-icon">💬</text>
            <text class="text-muted">
              {{ searchQuery.trim() ? t("discover.noSearchResults") : t("discover.noPosts") }}
            </text>
          </view>

          <view v-else class="post-list">
            <view v-for="post in displayPosts" :key="post.id" class="card post-card">
              <view class="flex-row items-center gap-sm post-author">
                <AppAvatarImage
                  :src="post.avatar"
                  :seed="String(post.user_id || 'user')"
                  size="sm"
                />
                <view class="flex-1 min-w-0">
                  <text class="author-name">{{ post.user_name }}</text>
                  <text class="text-muted author-time">{{ formatRelativeTime(post.created_at) }}</text>
                </view>
              </view>

              <view class="post-body" @tap="openPost(post.id)">
                <text v-if="post.category" class="post-cat">{{ categoryLabel(post.category) }}</text>
                <text class="post-title">{{ post.title }}</text>
                <text class="post-content text-muted">{{ post.content }}</text>
              </view>

              <view v-if="post.images?.length" class="post-images">
                <scroll-view scroll-x show-scrollbar="false">
                  <view class="image-row">
                    <image
                      v-for="(img, idx) in post.images.slice(0, 3)"
                      :key="idx"
                      class="post-thumb"
                      :src="normalizeMediaUrl(img) || IMAGE_FALLBACK"
                      mode="aspectFill"
                      @error="onImageError"
                    />
                  </view>
                </scroll-view>
              </view>

              <view class="post-actions flex-row justify-between items-center">
                <view class="flex-row gap-sm action-group">
                  <view class="action-btn" @tap.stop="onPostLikeTap(post.id)">
                    <text :class="post.liked ? 'liked' : 'text-muted'">
                      {{ post.liked ? "♥" : "♡" }} {{ post.likes_count || 0 }}
                    </text>
                  </view>
                  <view class="action-btn" @tap.stop="onPostCommentTap(post.id)">
                    <text class="text-muted">💬 {{ post.comments_count || 0 }}</text>
                  </view>
                </view>
                <view class="detail-link" @tap="onPostDetailTap(post.id)">
                  <text class="text-primary">{{ t("discover.viewDetail") }} ›</text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="!searchQuery.trim() && loadingMore" class="footer-hint text-muted">
            {{ t("common.loading") }}
          </view>
          <view
            v-if="!searchQuery.trim() && !loading && !hasMorePosts && displayPosts.length"
            class="footer-hint text-muted dim"
          >
            {{ t("discover.noMorePosts") }}
          </view>
        </view>

        <!-- 伴侣 Tab -->
        <view v-else class="content px-md py-sm">
          <AppListSkeleton v-if="companionsLoading && !displayCompanions.length" :rows="4" />

          <view v-else-if="!displayCompanions.length" class="empty">
            <text class="empty-icon">🤖</text>
            <text class="text-muted">{{ t("discover.noCompanions") }}</text>
          </view>

          <view v-else class="companion-list">
            <view
              v-for="c in displayCompanions"
              :key="c.profile.id"
              class="card companion-card flex-row items-center gap-sm"
              @tap="openCompanionProfile(c.profile.id)"
            >
              <AppAvatarImage
                :src="c.avatar"
                :seed="c.profile.id"
                :generating="c.avatar_generating"
              />
              <view class="flex-1 min-w-0">
                <view class="companion-name-block min-w-0">
                  <text class="companion-name">{{
                    formatCompanionName(c.profile.name, t("home.defaultCompanionName"))
                  }}</text>
                  <text class="text-muted companion-meta">{{
                    formatCompanionMeta(
                      { age: c.profile.age, gender: c.profile.gender },
                      t,
                      { includeCity: false }
                    )
                  }}</text>
                </view>
                <text class="text-muted companion-city">{{ c.profile.city }}</text>
                <view class="tag-row">
                  <text
                    v-for="p in splitPersonalities(c.profile.personality)"
                    :key="p"
                    class="tag"
                  >
                    {{ translatePersonalityTag(p, uiLang) }}
                  </text>
                  <text v-if="c.profile.mbti" class="tag mbti">{{ c.profile.mbti }}</text>
                </view>
              </view>
              <view class="companion-side flex-col items-center gap-sm">
                <view class="affection-badge">
                  <text>{{ formatAffectionDisplay(c.state.affection) }}</text>
                </view>
                <view class="chat-btn" @tap.stop="openChat(c.profile.id)">
                  <text>💬</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 发帖弹窗：分类 / 标题 / 正文 / 图片 -->
    <view v-if="showCreate" class="modal-mask" @tap="closeCreateModal">
      <view class="modal-sheet" @tap.stop>
        <view class="modal-header flex-row justify-between items-center">
          <text class="modal-title">{{ t("discover.createPost") }}</text>
          <text class="modal-close text-muted" @tap="bindAnalyticsTap('discover-close-create', closeCreateModal, '关闭发帖弹窗')">✕</text>
        </view>

        <scroll-view scroll-y class="modal-body">
          <view class="form-group">
            <text class="form-label">{{ t("discover.postCategory") }}</text>
            <view class="chip-wrap">
              <view
                v-for="cat in POST_CATEGORIES.filter((c) => c.key)"
                :key="cat.key"
                class="category-chip"
                :class="{ active: newCategory === cat.key }"
                @tap="newCategory = cat.key"
              >
                <text>{{ t(cat.label) }}</text>
              </view>
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">{{ t("discover.postTitle") }}</text>
            <input
              :value="newTitle"
              class="input-field"
              :placeholder="t('discover.titlePlaceholder')"
              maxlength="200"
              @input="newTitle = $event.detail.value"
            />
          </view>

          <view class="form-group">
            <text class="form-label">{{ t("discover.postContent") }}</text>
            <textarea
              :value="newContent"
              class="input-field textarea"
              :placeholder="t('discover.contentPlaceholder')"
              maxlength="5000"
              @input="newContent = $event.detail.value"
            />
            <text class="char-count text-muted">{{ newContent.length }}/5000</text>
          </view>

          <view class="form-group">
            <text class="form-label">
              {{ t("discover.postImages") }}
              <text class="text-muted">({{ newImages.length }}/9)</text>
            </text>
            <view class="upload-grid">
              <view v-for="(img, idx) in newImages" :key="idx" class="upload-thumb">
                <image
                  class="upload-img"
                  :src="normalizeMediaUrl(img) || IMAGE_FALLBACK"
                  mode="aspectFill"
                  @error="onImageError"
                />
                <view class="remove-btn" @tap="handleRemoveImage(idx)">✕</view>
              </view>
              <view
                v-if="newImages.length < 9"
                class="upload-add"
                @tap="!uploadingImages && handleAddImages()"
              >
                <text v-if="uploadingImages" class="text-muted">…</text>
                <template v-else>
                  <text class="add-icon">🖼</text>
                  <text class="text-muted add-label">{{ t("discover.addImage") }}</text>
                </template>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="modal-footer">
          <button
            class="btn-primary w-full publish-btn"
            :disabled="creating || !newTitle.trim() || !newContent.trim()"
            @tap="bindAnalyticsTap('discover-publish-post', handleCreatePost, '发布帖子')"
          >
            {{ creating ? t("discover.publishing") : `📤 ${t("discover.publish")}` }}
          </button>
        </view>
      </view>
    </view>
  </AppPageShell>
</template>

<style scoped lang="scss">
/* ===== 页面骨架 ===== */
.discover-page { flex: 1; min-height: 0; height: 100%; background: var(--bg); }
.discover-header { padding: calc(env(safe-area-inset-top) + 16rpx) 32rpx 16rpx; background: var(--bg); }
.discover-body { flex: 1; height: 0; min-height: 0; }

/* ===== 顶部操作区 ===== */
.btn-new-post { padding: 12rpx 28rpx; background: linear-gradient(90deg, var(--brand), var(--brand-end)); color: #fff; }
.tab-switch { display: flex; gap: 8rpx; padding: 8rpx; background: var(--bg-input); }
.tab-switch-item { flex: 1; padding: 16rpx 0; color: var(--fg-muted); &.active { background: var(--bg-card); color: var(--fg); } }
.search-wrap { display: flex; align-items: center; gap: 12rpx; padding: 16rpx 24rpx; background: var(--bg-input); }
.search-input { flex: 1; color: var(--fg); height: auto !important; min-height: 56rpx; line-height: 1.4; overflow: visible; }

/* ===== 分类标签 ===== */
.category-chip { display: inline-block; padding: 12rpx 28rpx; margin-right: 12rpx; background: var(--bg-input); border: 1px solid var(--border); color: var(--fg-muted); &.active { background: linear-gradient(90deg, var(--brand), var(--brand-end)); color: #fff; } }

/* ===== 卡片列表 ===== */
.post-card, .companion-card { padding: 32rpx; border-bottom: 1px solid var(--border); }
.chat-btn { padding: 12rpx 28rpx; border-radius: 999px; background: linear-gradient(90deg, var(--brand), var(--brand-end)); color: #fff; }

/* ===== 发帖弹窗 ===== */
.modal-sheet { width: 100%; max-width: 672px; background: var(--bg-card); }

.discover-page {
  display: flex;
  flex-direction: column;
}

.discover-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.header-top {
  margin-bottom: 24rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 600;
}

.btn-new-post {
  border-radius: 999px;
  font-size: 26rpx;
}

.tab-switch {
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

.tab-switch-item {
  text-align: center;
  border-radius: 16rpx;
  font-size: 26rpx;
  &.active {
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  }
}

.search-wrap {
  border-radius: 999px;
  margin-bottom: 16rpx;
}

.search-input {
  font-size: 28rpx;
}

.search-clear {
}

.category-scroll {
  white-space: nowrap;
}

.category-row {
  padding-bottom: 8rpx;
}

.category-chip {
  border-radius: 999px;
  font-size: 24rpx;
  white-space: nowrap;

  &.active {
    border-color: transparent;
  }
}

.discover-body {
}

.content {
  padding-bottom: 32rpx;
}

.empty {
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.post-list,
.companion-list {
  display: flex;
  flex-direction: column;
}

.post-card {
}

.post-author {
}

.author-name {
  font-size: 28rpx;
  font-weight: 500;
}

.author-time {
  font-size: 22rpx;
}

.post-body {
}

.post-cat {
  font-size: 22rpx;
  border-radius: 999px;
  margin-bottom: 12rpx;
}

.post-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-content {
  font-size: 26rpx;
  line-height: 1.5;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.post-images {
}

.image-row {
}

.post-thumb {
  border-radius: 20rpx;
  flex-shrink: 0;
}

.post-actions {
  border-top: 1px solid rgba(63, 63, 70, 0.5);
}

.action-group {
}

.action-btn {
  font-size: 26rpx;
}

.liked {
}

.detail-link {
  font-size: 26rpx;
  font-weight: 500;
}

.footer-hint {
  text-align: center;
  font-size: 26rpx;

  &.dim {
    font-size: 22rpx;
  }
}

.companion-card {
}

.companion-name-block {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.companion-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.companion-meta {
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.companion-city {
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.tag-row {
  flex-wrap: wrap;
}

.tag {
  font-size: 22rpx;
  border-radius: 999px;
  &.mbti {
  }
}

.companion-side {
  flex-shrink: 0;
}

.affection-badge {
  border-radius: 999px;
  font-size: 22rpx;
  font-weight: 500;
}

.chat-btn {
  display: flex;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.flex-1 {
  min-width: 0;
}

.min-w-0 {
  min-width: 0;
}

/* ===== 发帖弹窗 ===== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  z-index: 100;
  align-items: flex-end;
  justify-content: center;
}

.modal-sheet {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  padding-bottom: calc(var(--safe-tab) + 16rpx);
  border-radius: 32rpx 32rpx 0 0;
}

.modal-header {
  flex-shrink: 0;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
}

.modal-close {
  font-size: 36rpx;
  padding: 8rpx;
}

/* 可滚动表单区 */
.modal-body {
  flex: 1;
  min-height: 0;
  padding: 24rpx 32rpx;
}

.form-group {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 16rpx;
}

/* 分类芯片：flex 换行，避免叠在一起 */
.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.chip-wrap .category-chip {
  margin-right: 0;
}

/* 输入框 */
.input-field {
  width: 100%;
  padding: 20rpx 24rpx;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--fg);
  box-sizing: border-box;
}

.textarea {
  min-height: 240rpx;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  margin-top: 8rpx;
}

/* 图片上传网格 */
.upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-thumb {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.upload-img {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  font-size: 22rpx;
}

.upload-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed var(--border);
  border-radius: 16rpx;
  background: var(--bg-input);
  flex-shrink: 0;
}

.add-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.add-label {
  font-size: 22rpx;
}

/* 底部操作 */
.modal-footer {
  flex-shrink: 0;
  padding: 24rpx 32rpx 32rpx;
  border-top: 1px solid var(--border);
}

.publish-btn {
  border-radius: 999px;
  padding: 24rpx;
  font-size: 30rpx;
}
</style>
