<script setup>
/**
 * @file pages-sub/companion — 伴侣资料页
 * @description 查看伴侣档案与动态；创建者可清空消息/删除伴侣。
 * @depends apiFetch、AppConfirmDialog、stores/chat
 */
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppConfirmDialog from "@/components/AppConfirmDialog.vue";
import AppMomentImage from "@/components/AppMomentImage.vue";
import AppListSkeleton from "@/components/AppListSkeleton.vue";
import { requireAuth } from "@/composables/useAuth";
import { getItem, setItem } from "@/utils/storage";
import { useChatStore } from "@/stores/chat";
import { showToast } from "@/stores/toast";
import apiFetch from "@/utils/api";
import { getCachedCompanions } from "@/utils/companionsCache";
import { formatAffectionDisplay } from "@/utils/formatAffection";
import { translatePersonalityTag } from "@/utils/personalityTags";
import {
  formatCompanionMeta,
  formatCompanionName,
  uiLangCode,
} from "@/utils/formatCompanion";
import { useRelativeTime } from "@/composables/useRelativeTime";
import { bindAnalyticsTap } from "@/utils/analytics";

let companionId = "";
const { t, locale } = useI18n();
const chat = useChatStore();
const { format: formatTime } = useRelativeTime("home");
requireAuth();

const uiLang = computed(() => uiLangCode(locale.value));

// ——— 加载资料 ———

function findCachedCompanion(id) {
  const list = getCachedCompanions() ?? [];
  return (
    list.find((c) => String(c.profile?.id || "") === String(id)) ?? null
  );
}

const companion = ref(null);
const moments = ref([]);
const momentsCount = ref(0);
const loading = ref(true);
const error = ref("");
const activeTab = ref("about");
const showMenu = ref(false);
const confirmOpen = ref(false);
const confirmTitle = ref("");
const confirmDesc = ref("");
const confirmDestructive = ref(false);
let confirmAction = null;

onLoad((q) => {
  companionId = String(q?.id || "");
  const cached = findCachedCompanion(companionId);
  if (cached) {
    companion.value = cached;
    loading.value = false;
  }
});

function openConfirm(title, desc, action, destructive = false) {
  confirmTitle.value = title;
  confirmDesc.value = desc;
  confirmAction = action;
  confirmDestructive.value = destructive;
  confirmOpen.value = true;
}

// ——— 创建者操作 ———

function getCreatorKeys() {
  const keys = [];
  try {
    const raw = getItem("user_info");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.id != null) keys.push(String(u.id));
      if (u.nickname) keys.push(String(u.nickname).trim());
      if (u.username) keys.push(String(u.username).trim());
    }
  } catch { /* ignore */ }
  const did = getItem("device_id");
  if (did) keys.push(did);
  return [...new Set(keys.filter(Boolean))];
}

const isCreator = () => {
  const createdBy = String(companion.value?.profile?.created_by || "").trim();
  return Boolean(createdBy && getCreatorKeys().includes(createdBy));
};

onMounted(async () => {
  try {
    const data = await apiFetch(`/companions/${companionId}`);
    companion.value = data;
    const mData = await apiFetch(
      `/api/companions/${companionId}/moments`
    );
    momentsCount.value = mData.total || 0;
    moments.value = mData.moments || [];
  } catch (e) {
    const err = e;
    if (!companion.value) {
      error.value = t("companionProfile.loadingError");
    }
  } finally {
    loading.value = false;
  }
});

function openChat() {
  uni.navigateTo({ url: `/pages/chat/index?id=${companionId}` });
}

function cloneCompanion() {
  if (!companion.value) return;
  const p = companion.value.profile;
  setItem("clone_companion_data", JSON.stringify({
    name: p.name,
    age: p.age,
    gender: p.gender === "男" ? "male" : "female",
    city: p.city,
    personality: p.personality,
    background: p.background,
    speech_style: p.speech_style,
    hobbies: p.hobbies,
    values: p.values,
    fears: p.fears,
    love_view: p.love_view,
    daily_routine: p.daily_routine,
    favorite_things: p.favorite_things,
    mbti: p.mbti,
    sexual_orientation: p.sexual_orientation,
    life_story: p.life_story || "",
    cultural_values: p.cultural_values || "",
    gender_perspective: p.gender_perspective || "",
  }));
  uni.navigateTo({ url: "/pages-sub/create/index?clone=1" });
}

function clearMessages() {
  showMenu.value = false;
  openConfirm(
    t("chat.clearMessages"),
    t("chat.confirmClearMessages"),
    async () => {
      try {
        await apiFetch(`/companions/${companionId}/clear-messages`, { method: "POST" });
        chat.clearMessages(companionId);
        if (companion.value?.state) companion.value.state.affection = 0;
        showToast(t("chat.clearSuccess"));
      } catch {
        showToast(t("chat.clearFailed"));
      }
    },
    true
  );
}

function deleteCompanion() {
  showMenu.value = false;
  openConfirm(
    t("companionProfile.deleteCompanion"),
    t("companionProfile.deleteConfirm"),
    async () => {
      try {
        await apiFetch(`/companions/${companionId}`, { method: "DELETE" });
        uni.reLaunch({ url: "/pages/messages/index" });
      } catch {
        showToast(t("companionProfile.deleteFailed"));
      }
    },
    true
  );
}

function openMoment(id) {
  uni.navigateTo({ url: `/pages-sub/moment/index?id=${id}` });
}

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function setAboutTab() {
  activeTab.value = "about";
}

function setMomentsTab() {
  activeTab.value = "moments";
}

const profile = () => companion.value?.profile || {};
const state = () => companion.value?.state || {};
const personalities = () => String(profile().personality || "").split(/[、,，]/).filter(Boolean);

const displayName = computed(() =>
  formatCompanionName(profile().name, t("home.defaultCompanionName"))
);
const displayMeta = computed(() => formatCompanionMeta(profile(), t));

const daysTogether = computed(() => {
  const raw = profile().created_at;
  const createdAt = raw ? new Date(raw) : new Date();
  const ms = Date.now() - createdAt.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
});

function sexualOrientationLabel(value) {
  if (!value) return "";
  const key = `companionProfile.sexualOrientation.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

function formatMeetDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const aboutCards = computed(() => {
  const p = profile();
  const cards = [
    { key: "background", title: t("companionProfile.background"), content: p.background },
    { key: "speech", title: t("companionProfile.speechStyle"), content: p.speech_style },
    { key: "mbti", title: t("companionProfile.mbti"), content: p.mbti },
    {
      key: "orientation",
      title: t("companionProfile.sexualOrientationLabel"),
      content: sexualOrientationLabel(p.sexual_orientation),
    },
    { key: "creator", title: t("companionProfile.creator"), content: p.created_by },
    { key: "hobbies", title: t("companionProfile.hobbies"), content: p.hobbies },
    { key: "values", title: t("companionProfile.values"), content: p.values },
    { key: "fears", title: t("companionProfile.fears"), content: p.fears },
    { key: "love", title: t("companionProfile.loveView"), content: p.love_view },
    { key: "routine", title: t("companionProfile.dailyRoutine"), content: p.daily_routine },
    { key: "favorites", title: t("companionProfile.favoriteThings"), content: p.favorite_things },
  ];
  return cards.filter((c) => Boolean(c.content));
});
</script>

<template>
  <AppPageShell
    :title="displayName || t('companionProfile.title')"
    :show-back="true"
    back-analytics-id="companion-profile-back"
    back-analytics-name="伴侣详情页返回"
  >
    <view v-if="!loading && (error || !companion)" class="center text-muted">
      {{ error || t("companionProfile.notFound") }}
    </view>

    <view v-else class="page-content px-md py-sm">
      <view class="header-actions">
        <text @tap="bindAnalyticsTap('companion-profile-menu', toggleMenu, '伴侣菜单')">⚙</text>
        <view v-if="showMenu && companion" class="menu-popup">
          <view class="menu-item" @tap="bindAnalyticsTap('companion-profile-clear-messages', clearMessages, '清空消息')">{{ t("chat.clearMessages") }}</view>
          <view v-if="isCreator()" class="menu-item danger" @tap="bindAnalyticsTap('companion-profile-delete', deleteCompanion, '删除伴侣')">{{ t("companionProfile.deleteCompanion") }}</view>
        </view>
      </view>

      <view v-if="loading && !companion" class="hero flex-col items-center">
        <view class="hero-avatar-skeleton skeleton" />
        <view class="skeleton hero-name-skeleton" />
        <view class="skeleton hero-meta-skeleton" />
      </view>
      <view v-else class="hero flex-col items-center">
        <AppAvatarImage size="lg" :src="companion.avatar" :seed="companionId" :generating="companion.avatar_generating" />
        <view class="affection-badge">{{ formatAffectionDisplay(profile().affection) }}</view>
        <text class="hero-name">{{ displayName }}</text>
        <text class="text-muted hero-meta">{{ displayMeta }}</text>
        <text v-if="profile().mbti" class="mbti-chip">{{ profile().mbti }}</text>
        <text v-if="profile().sexual_orientation" class="orientation-chip">
          {{ sexualOrientationLabel(profile().sexual_orientation) }}
        </text>
        <view v-if="personalities().length" class="flex-row flex-wrap gap-sm tags-row">
          <text v-for="p in personalities()" :key="p" class="tag">{{ translatePersonalityTag(p, uiLang) }}</text>
        </view>
      </view>

      <view class="stats-row flex-row mt-md">
        <view class="stat card">
          <text v-if="loading && !companion" class="num skeleton stat-skeleton" />
          <text v-else class="num">{{ state().turns ?? 0 }}</text>
          <text class="text-muted">{{ t("companionProfile.chatTurns") }}</text>
        </view>
        <view class="stat card">
          <text v-if="loading && !companion" class="num skeleton stat-skeleton" />
          <text v-else class="num">{{ momentsCount }}</text>
          <text class="text-muted">{{ t("companionProfile.moments") }}</text>
        </view>
        <view class="stat card">
          <text v-if="loading && !companion" class="num skeleton stat-skeleton" />
          <text v-else class="num">{{ daysTogether }}</text>
          <text class="text-muted">{{ t("companionProfile.daysTogether") }}</text>
        </view>
      </view>

      <view class="flex-row gap-sm mt-md">
        <button class="btn-primary flex-1 btn-short"  style="height: 90rpx;line-height: 90rpx;border-radius: 60rpx;" :disabled="!companion" @tap="bindAnalyticsTap('companion-profile-chat', openChat, '聊天')">{{ t("companionProfile.sendMessage") }}</button>
        <button
          v-if="companion && !isCreator()"
          class="btn-outline flex-1 btn-short"
          @tap="bindAnalyticsTap('companion-profile-clone', cloneCompanion, '克隆')"
        >{{ t("companionProfile.clone") }}</button>
      </view>

      <view class="tabs flex-row mt-md">
        <text :class="{ active: activeTab === 'about' }" @tap="bindAnalyticsTap('companion-profile-tab-about', setAboutTab, '关于 Tab')">{{ t("companionProfile.about") }}</text>
        <text :class="{ active: activeTab === 'moments' }" @tap="bindAnalyticsTap('companion-profile-tab-moments', setMomentsTab, '动态 Tab')">{{ t("companionProfile.momentsTab") }}</text>
      </view>

      <AppListSkeleton v-if="loading && !companion" :rows="3" class="mt-md" />

      <view v-else-if="activeTab === 'about'" class="mt-md">
        <view v-for="card in aboutCards" :key="card.key" class="card info-card mt-md">
          <text class="info-title">{{ card.title }}</text>
          <text class="text-muted">{{ card.content }}</text>
        </view>
        <view v-if="profile().created_at" class="card info-card mt-md">
          <text class="info-title">{{ t("companionProfile.meetTime") }}</text>
          <text class="text-muted">{{ formatMeetDate(profile().created_at) }}</text>
        </view>
      </view>

      <view v-else class="mt-md">
        <view v-if="!moments.length" class="center text-muted py-lg">{{ t("companionProfile.noMoments") }}</view>
        <view v-for="m in moments" :key="m.id" class="card moment-card mt-md" @tap="openMoment(m.id)">
          <text class="moment-caption">{{ m.caption }}</text>
          <AppMomentImage v-if="m.image_url" :src="m.image_url" img-class="moment-img" />
          <view class="flex-row gap-sm text-muted" style="font-size: 24rpx; margin-top: 12rpx">
            <text>♥ {{ m.likes_count }}</text>
            <text>💬 {{ m.comments_count }}</text>
            <text>{{ formatTime(m.created_at) }}</text>
          </view>
        </view>
      </view>

      <button
        v-if="companion && isCreator()"
        class="delete-footer mt-md"
        @tap="bindAnalyticsTap('companion-profile-delete-footer', deleteCompanion, '底部删除伴侣')"
      >
        <view><up-icon name="trash" size="22"></up-icon> </view>
        <view>{{ t("companionProfile.deleteCompanion") }}</view>
      </button>
    </view>

    <AppConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmTitle"
      :description="confirmDesc"
      :destructive="confirmDestructive"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      @confirm="confirmAction?.()"
    />
  </AppPageShell>
</template>

<style scoped lang="scss">
.center { text-align: center; padding: 80rpx 0; }
.page-content { 
  // // min-height: 100vh; 
  // height: 100%;
  background: var(--bg); 
}
.header-actions { display: flex; justify-content: flex-end; position: relative; padding: 16rpx 0; }
.header-actions text { font-size: 60rpx; padding: 8rpx; }
.menu-popup {
  position: absolute; right: 0; top: 48rpx; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 16rpx; z-index: 50; min-width: 240rpx;
}
.menu-item { padding: 24rpx 32rpx; font-size: 28rpx; &.danger { color: var(--destructive); } }
.hero { position: relative; }
.hero-avatar-skeleton {
  width: 160rpx; height: 160rpx; border-radius: 50%;
}
.hero-name-skeleton {
  width: 200rpx; height: 40rpx; margin-top: 24rpx; border-radius: 8rpx;
}
.hero-meta-skeleton {
  width: 320rpx; height: 28rpx; margin-top: 16rpx; border-radius: 8rpx;
}
.stat-skeleton {
  display: inline-block; width: 64rpx; height: 36rpx; border-radius: 8rpx; margin-bottom: 8rpx;
}
.affection-badge {
  margin-top: -20rpx; background: var(--brand); color: #fff;
  padding: 8rpx 24rpx; border-radius: 999px; font-size: 24rpx;
  position: relative;
  z-index: 10;
}
.hero-name { font-size: 40rpx; font-weight: 600; margin-top: 24rpx; }
.hero-meta {
  font-size: 24rpx;
  margin-top: 8rpx;
  text-align: center;
  padding: 0 24rpx;
  line-height: 1.4;
  word-break: break-word;
}
.mbti-chip { margin-top: 12rpx; padding: 8rpx 20rpx; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-radius: 999px; font-size: 24rpx; }
.orientation-chip { margin-top: 12rpx; padding: 8rpx 20rpx; background: rgba(168, 85, 247, 0.15); color: #c084fc; border-radius: 999px; font-size: 24rpx; }
.tags-row { justify-content: center; margin-top: 16rpx; }
.stats-row { gap: 16rpx; }
.stat { flex: 1; padding: 24rpx; text-align: center; }
.num { display: block; font-size: 36rpx; font-weight: 600; }
.btn-outline {
  background: transparent; border: 1px solid var(--border); color: var(--fg);
  border-radius: 24rpx; padding: 24rpx; font-size: 28rpx;
}
.btn-short {
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 32rpx;
}
.tabs text {
  flex: 1; text-align: center; padding: 20rpx; color: var(--fg-muted);
  &.active { color: var(--brand); border-bottom: 2px solid var(--brand); }
}
.tag { padding: 8rpx 16rpx; background: var(--bg-input); border-radius: 999px; font-size: 24rpx; }
.info-card { padding: 24rpx; }
.info-title { display: block; font-weight: 600; margin-bottom: 12rpx; }
.moment-card { padding: 24rpx; }
.moment-caption { display: block; margin-bottom: 12rpx; }
.moment-img { width: 100%; border-radius: 16rpx; }
.delete-footer {
  border-radius: 999px;
  font-size: 28rpx;
  display: flex;
  height: 90rpx;
  line-height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  view{
    margin-left: 10rpx;
  }
}
.py-lg { padding: 80rpx 0; }
.flex-1 { flex: 1; }
</style>
