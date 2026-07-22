<script setup>
/**
 * @file pages/profile — 我的 Tab：个人中心
 * @description 资料展示/编辑、头像上传、主题切换、统计与功能菜单入口。
 * @depends apiFetch、uploadImage、theme store、chat store
 */
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import AppAvatarImage from "@/components/AppAvatarImage.vue";
import AppConfirmDialog from "@/components/AppConfirmDialog.vue";
import { requireAuth } from "@/composables/useAuth";
import { getItem, setItem, removeItem } from "@/utils/storage";
import { useChatStore } from "@/stores/chat";
import { useThemeStore } from "@/stores/theme";
import { showToast } from "@/stores/toast";
import { invalidateCompanionsCache } from "@/utils/companionsCache";
import apiFetch, { api } from "@/utils/api";
import { uploadImage } from "@/utils/device";
import { setAppLanguage } from "@/i18n";
import { normalizeMediaUrl } from "@/utils/media";
import { bindAnalyticsTap, trackButtonClick } from "@/utils/analytics";
import { useTabScrollStore } from "@/stores/tabScroll";

const TAB_PATH = "/pages/profile/index";
const tabScroll = useTabScrollStore();

function loadCachedUser() {
  try {
    const raw = getItem("user_info");
    return raw ? (JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function persistUserInfo(next) {
  try {
    setItem("user_info", JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function patchUserInfo(partial) {
  try {
    const raw = getItem("user_info");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(parsed, partial);
    setItem("user_info", JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

// ——— 用户状态与编辑表单 ———

const { t, locale } = useI18n();
const chat = useChatStore();
const themeStore = useThemeStore();

const user = ref(loadCachedUser());
const stats = ref({
  companion_count: 0,
  total_turns: 0,
  days_together: 0,
});
const loading = ref(
  Boolean(getItem("user_token")) && !getItem("user_info")
);

const showEditProfile = ref(false);
const editNickname = ref("");
const editSexualOrientation = ref("");
const editGender = ref("保密");
const editAge = ref("");
const editRegion = ref("");
const editOccupation = ref("");
const editLoading = ref(false);

const showLangPicker = ref(false);
const showAbout = ref(false);
const showLogoutConfirm = ref(false);
const avatarUploading = ref(false);

const genderValues = ["男", "女", "保密"];
const orientationValues = [
  "heterosexual",
  "homosexual",
  "bisexual",
  "pansexual",
  "asexual",
  "secret",
];

const languages = [
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

// ——— 菜单与展示计算 ———

const menuItems = computed(() => [
  {
    icon: "✨",
    label: t("home.createCompanion"),
    path: "/pages-sub/create/index",
    requireAuth: true,
  },
  {
    icon: "👥",
    label: t("profile.myCompanions"),
    hint: t("profile.myCompanionsHint"),
    path: "/pages-sub/my-companions/index",
    requireAuth: true,
  },
  {
    icon: "📝",
    label: t("profile.myMoments"),
    path: "/pages-sub/my-posts/index",
    requireAuth: true,
  },
  {
    icon: "💕",
    label: t("profile.intimacyRecord"),
    path: "/pages-sub/intimacy/index",
    requireAuth: true,
  },
  {
    icon: "🔔",
    label: t("profile.notificationSettings"),
    path: "/pages-sub/settings/index",
    requireAuth: true,
  },
  {
    icon: "📬",
    label: t("notifications.title"),
    path: "/pages-sub/notifications/index",
    requireAuth: true,
  },
  {
    icon: "🌐",
    label: t("profile.languagePreference"),
    action: () => {
      showLangPicker.value = true;
    },
  },
  {
    icon: "🛡",
    label: t("profile.privacyPolicy"),
    path: "/pages-sub/privacy/index",
    requireAuth: true,
  },
  {
    icon: "💬",
    label: t("messages.feedback"),
    path: "/pages-sub/feedback/index",
    requireAuth: true,
  },
  {
    icon: "ℹ️",
    label: t("profile.aboutUs"),
    action: () => {
      showAbout.value = true;
    },
  },
]);

const visibleMenuItems = computed(() =>
  menuItems.value.filter((item) => !item.requireAuth || user.value)
);

const genderPickerIndex = computed(() => {
  const idx = genderValues.indexOf(editGender.value);
  return idx >= 0 ? idx : 2;
});

const orientationPickerIndex = computed(() => {
  const idx = orientationValues.indexOf(editSexualOrientation.value);
  return idx >= 0 ? idx : 0;
});

const avatarSrc = computed(() => {
  if (!user.value?.avatar_url) return "";
  return normalizeMediaUrl(user.value.avatar_url) || user.value.avatar_url;
});

const genderEmoji = computed(() => {
  if (user.value?.gender === "男") return "👨";
  if (user.value?.gender === "女") return "👩";
  return "👤";
});

function sexualOrientationLabel(value) {
  if (value === "heterosexual") return t("register.heterosexual");
  if (value === "homosexual") return t("register.homosexual");
  if (value === "bisexual") return t("register.bisexual");
  if (value === "pansexual") return t("register.pansexual");
  if (value === "asexual") return t("register.asexual");
  if (value === "secret") return t("register.secret");
  return value;
}

function onMenuItem(item) {
  if (item.action) {
    item.action();
    return;
  }
  if (item.requireAuth && !requireAuth()) return;
  if (item.path) uni.navigateTo({ url: item.path });
}

function onMenuItemTap(item, index) {
  trackButtonClick(`profile-menu-${index}`, `个人中心菜单-${item.label}`);
  onMenuItem(item);
}

function openEditProfile() {
  if (!user.value) return;
  editNickname.value = user.value.nickname || user.value.username || "";
  editSexualOrientation.value = user.value.sexual_orientation || "";
  editGender.value = user.value.gender || "保密";
  editAge.value =
    user.value.age != null && user.value.age !== undefined
      ? String(user.value.age)
      : "";
  editRegion.value = user.value.region || "";
  editOccupation.value = user.value.occupation || "";
  showEditProfile.value = true;
}

function onGenderChange(e) {
  editGender.value = genderValues[Number(e.detail.value)] || "保密";
}

function onOrientationChange(e) {
  editSexualOrientation.value =
    orientationValues[Number(e.detail.value)] || "heterosexual";
}

function onAgeInput(e) {
  editAge.value = e.detail.value.replace(/\D/g, "").slice(0, 2);
}

// ——— 资料保存与头像 ———

/** 提交 PATCH 保存个人资料字段 */
async function saveProfile() {
  const token = getItem("user_token");
  if (!token || !editNickname.value.trim() || !editAge.value.trim()) {
    if (!editNickname.value.trim()) {
      showToast(t("profile.enterNickname"));
    } else if (!editAge.value.trim()) {
      showToast(t("profile.agePlaceholder"));
    }
    return;
  }

  const trimmedAge = editAge.value.trim();
  const n = parseInt(trimmedAge, 10);
  if (Number.isNaN(n) || n < 18 || n > 70) {
    showToast(t("profile.invalidAge"));
    return;
  }

  editLoading.value = true;
  try {
    const data = await apiFetch("/api/auth/me", {
      method: "PATCH",
      data: {
        nickname: editNickname.value.trim(),
        sexual_orientation: editSexualOrientation.value,
        gender: editGender.value,
        age: n,
        region: editRegion.value.trim(),
        occupation: editOccupation.value.trim(),
      },
    });

    if (user.value) {
      user.value = {
        ...user.value,
        nickname: data.nickname ?? user.value.nickname,
        sexual_orientation: data.sexual_orientation ?? user.value.sexual_orientation,
        gender: data.gender ?? user.value.gender,
        age: data.age ?? user.value.age,
        region: data.region ?? user.value.region,
        occupation: data.occupation ?? user.value.occupation,
      };
      persistUserInfo(user.value);
    } else {
      patchUserInfo({
        nickname: data.nickname,
        sexual_orientation: data.sexual_orientation,
        gender: data.gender,
        age: data.age,
        region: data.region,
        occupation: data.occupation,
      });
    }
    showEditProfile.value = false;
  } catch {
    showToast(t("common.networkError"));
  } finally {
    editLoading.value = false;
  }
}

function onAvatarTap() {
  const token = getItem("user_token");
  if (!token || !user.value || avatarUploading.value) return;

  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0];
      if (!filePath) return;

      avatarUploading.value = true;
      try {
        const up = await uploadImage(filePath);
        const url = up.url;
        if (!url) {
          showToast(t("profile.avatarUploadFailed"));
          return;
        }

        const j = await apiFetch("/api/auth/me", {
          method: "PATCH",
          data: { avatar_url: url },
        });

        const savedUrl = j.avatar_url || url;
        if (user.value) {
          user.value = { ...user.value, avatar_url: savedUrl };
          persistUserInfo(user.value);
        } else {
          patchUserInfo({ avatar_url: savedUrl });
        }
      } catch {
        showToast(t("profile.avatarUploadFailed"));
      } finally {
        avatarUploading.value = false;
      }
    },
  });
}

// ——— 语言 / 登出 / 主题 ———

function selectLanguage(code) {
  setAppLanguage(code);
  showLangPicker.value = false;
}

function handleLogout() {
  chat.disconnectAll();
  invalidateCompanionsCache();
  removeItem("user_token");
  removeItem("user_info");
  uni.reLaunch({ url: "/pages/login/index" });
}

function goLogin() {
  uni.reLaunch({ url: "/pages/login/index" });
}

function promptLogout() {
  showLogoutConfirm.value = true;
}

function toggleTheme() {
  themeStore.toggleTheme();
}

// ——— 后台刷新 ———

/** 静默刷新用户信息与统计数据 */
async function loadBackgroundData() {
  const token = getItem("user_token");
  if (!token) {
    loading.value = false;
    return;
  }

  try {
    const [userData, statsData] = await Promise.all([
      api.get("/api/auth/me").catch(() => null),
      api.get("/api/users/stats").catch(() => null),
    ]);

    if (userData) {
      const nextUser = {
        ...userData,
        avatar_url: userData.avatar_url || "",
        region: userData.region || "",
        occupation: userData.occupation || "",
      };
      user.value = nextUser;
      persistUserInfo(nextUser);
    }

    if (statsData) {
      stats.value = {
        companion_count:
          statsData.intimate_companion_count ?? statsData.companion_count ?? 0,
        total_turns: statsData.total_turns ?? 0,
        days_together:
          statsData.max_days_together ?? statsData.days_together ?? 0,
      };
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadBackgroundData();
});

const pageScrollTop = ref(0);

function onPageBodyScroll(e) {
  const top = e?.detail?.scrollTop || 0;
  tabScroll.setScroll(TAB_PATH, top);
}

watch(
  () => tabScroll.scrollToTopTick[TAB_PATH],
  () => {
    pageScrollTop.value = pageScrollTop.value === 0 ? 0.01 : 0;
    void nextTick(() => {
      pageScrollTop.value = 0;
    });
  }
);
</script>

<template>
  <AppPageShell :title="t('profile.title')" show-tab-bar>
    <scroll-view
      scroll-y
      class="page-scroll"
      :scroll-top="pageScrollTop"
      @scroll="onPageBodyScroll"
    >
      <view class="page-body">
      <!-- 用户信息 -->
      <view class="user-row">
        <template v-if="loading && !user">
          <view class="avatar-block">
            <view class="avatar-placeholder skeleton" />
          </view>
          <view class="user-meta user-meta-skeleton">
            <view class="skeleton skel-name" />
            <view class="skeleton skel-id" />
          </view>
        </template>
        <template v-else>
        <view class="avatar-block">
          <view v-if="avatarSrc" class="profile-avatar-wrap">
            <AppAvatarImage
              :src="avatarSrc"
              :seed="`user-${user?.id}`"
              :generating="avatarUploading"
            />
          </view>
          <view v-else class="avatar-placeholder">
            <text class="avatar-emoji">{{ genderEmoji }}</text>
          </view>
          <view
            class="avatar-edit-btn"
            :class="{ disabled: !user || avatarUploading }"
            @tap="bindAnalyticsTap('profile-avatar-upload', onAvatarTap, '上传头像')"
          >
            <text v-if="avatarUploading" class="spinner-sm" />
            <text v-else class="edit-icon">✎</text>
          </view>
        </view>

        <view class="user-meta">
          <view class="name-row">
            <text class="user-name">
              {{ user?.nickname || user?.username || t("profile.notLoggedIn") }}
            </text>
            <text v-if="user" class="edit-name-btn" @tap="openEditProfile">✎</text>
          </view>
          <text class="text-muted user-id">
            {{
              user
                ? `${t("profile.authorId")}: ${user.id}`
                : t("profile.pleaseLogin")
            }}
          </text>
          <text
            v-if="user?.sexual_orientation"
            class="text-muted orientation-text"
          >
            {{ t("register.sexualOrientation") }}:
            {{ sexualOrientationLabel(user.sexual_orientation) }}
          </text>
        </view>
        </template>
      </view>

      <!-- 统计 -->
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value">{{ stats.companion_count }}</text>
          <text class="text-muted stat-label">{{ t("profile.myCompanions") }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.total_turns }}</text>
          <text class="text-muted stat-label">{{ t("profile.chatTurns") }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.days_together }}天</text>
          <text class="text-muted stat-label">{{ t("profile.daysTogether") }}</text>
        </view>
      </view>

      <!-- 菜单 -->
      <view class="menu-list">
        <view class="menu-item" @tap="bindAnalyticsTap('profile-toggle-theme', toggleTheme, '切换主题')">
          <view class="menu-left">
            <view class="menu-icon-wrap">
              <text>{{ themeStore.isDark ? "🌙" : "☀️" }}</text>
            </view>
            <text class="menu-label">
              {{ themeStore.isDark ? t("profile.darkMode") : t("profile.lightMode") }}
            </text>
          </view>
          <view class="theme-switch" :class="{ on: themeStore.isDark }">
            <view class="theme-knob" />
          </view>
        </view>

        <view
          v-for="(item, index) in visibleMenuItems"
          :key="index"
          class="menu-item"
          @tap="onMenuItemTap(item, index)"
        >
          <view class="menu-left">
            <view class="menu-icon-wrap">
              <text>{{ item.icon }}</text>
            </view>
            <view class="menu-text-col">
              <text class="menu-label">{{ item.label }}</text>
              <text v-if="item.hint" class="text-muted menu-hint">{{ item.hint }}</text>
            </view>
          </view>
          <view class="menu-right">
            <text v-if="item.badge" class="menu-badge">{{ item.badge }}</text>
            <text class="chevron">›</text>
          </view>
        </view>

        <view v-if="user" class="menu-item logout-item" @tap="bindAnalyticsTap('profile-logout', promptLogout, '退出登录')">
          <view class="menu-left">
            <view class="menu-icon-wrap destructive">
              <text>🚪</text>
            </view>
            <text class="menu-label destructive-text">{{ t("profile.logout") }}</text>
          </view>
          <text class="chevron destructive-chevron">›</text>
        </view>

        <button v-else class="btn-login" @tap="bindAnalyticsTap('profile-login', goLogin, '登录')">
          <text>🚪 {{ t("login.loginBtn") }}</text>
        </button>
      </view>
      </view>
    </scroll-view>

    <!-- 编辑资料 -->
    <view v-if="showEditProfile" class="modal-mask center" @tap="showEditProfile = false">
      <view class="modal-card edit-modal" @tap.stop>
        <view class="modal-header-row">
          <text class="modal-title">{{ t("profile.editProfile") }}</text>
          <text class="modal-close" @tap="showEditProfile = false">✕</text>
        </view>

        <scroll-view scroll-y class="edit-form-scroll">
          <view class="form-group">
            <text class="field-label">{{ t("register.nickname") }}</text>
            <input
              :value="editNickname"
              class="input-field"
              :placeholder="t('profile.enterNickname')"
              maxlength="20"
              @input="editNickname = $event.detail.value"
            />
          </view>

          <view class="form-group">
            <text class="field-label">{{ t("register.gender") }}</text>
            <picker
              mode="selector"
              :range="genderValues"
              :value="genderPickerIndex"
              @change="onGenderChange"
            >
              <view class="input-field picker-field">{{ editGender }}</view>
            </picker>
          </view>

          <view class="form-group">
            <text class="field-label">{{ t("profile.age") }}</text>
            <input
              :value="editAge"
              class="input-field"
              type="number"
              :placeholder="t('profile.agePlaceholder')"
              @input="onAgeInput"
            />
          </view>

          <view class="form-group">
            <text class="field-label">{{ t("profile.region") }}</text>
            <input
              :value="editRegion"
              class="input-field"
              :placeholder="t('profile.placeholderRegion')"
              maxlength="120"
              @input="editRegion = $event.detail.value"
            />
          </view>

          <view class="form-group">
            <text class="field-label">{{ t("profile.occupation") }}</text>
            <input
              :value="editOccupation"
              class="input-field"
              :placeholder="t('profile.placeholderOccupation')"
              maxlength="100"
              @input="editOccupation = $event.detail.value"
            />
          </view>

          <view class="form-group">
            <text class="field-label">{{ t("register.sexualOrientation") }}</text>
            <picker
              mode="selector"
              :range="orientationValues.map((v) => sexualOrientationLabel(v))"
              :value="orientationPickerIndex"
              @change="onOrientationChange"
            >
              <view class="input-field picker-field">
                {{ sexualOrientationLabel(editSexualOrientation) }}
              </view>
            </picker>
          </view>
        </scroll-view>

        <button
          class="btn-primary save-btn"
          :disabled="editLoading || !editNickname.trim() || !editAge.trim()"
          @tap="saveProfile"
        >
          <text v-if="editLoading">{{ t("common.loading") }}</text>
          <text v-else>✓ {{ t("common.save") }}</text>
        </button>
      </view>
    </view>

    <!-- 语言选择 -->
    <view v-if="showLangPicker" class="modal-mask bottom" @tap="showLangPicker = false">
      <view class="modal-sheet lang-sheet" @tap.stop>
        <view class="modal-header-row sheet-header">
          <text class="modal-title">{{ t("profile.selectLanguage") }}</text>
          <text class="modal-close" @tap="showLangPicker = false">✕</text>
        </view>
        <scroll-view scroll-y class="lang-list">
          <view
            v-for="lang in languages"
            :key="lang.code"
            class="lang-item"
            :class="{ active: locale === lang.code }"
            @tap="selectLanguage(lang.code)"
          >
            <text class="lang-flag">{{ lang.flag }}</text>
            <text class="lang-label">{{ lang.label }}</text>
            <text v-if="locale === lang.code" class="lang-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 关于我们 -->
    <view v-if="showAbout" class="modal-mask center" @tap="showAbout = false">
      <view class="modal-card about-card" @tap.stop>
        <view class="modal-header-row">
          <text class="modal-title">{{ t("profile.aboutUs") }}</text>
          <text class="modal-close" @tap="showAbout = false">✕</text>
        </view>
        <view class="about-body">
          <view class="about-logo">
            <text class="about-heart">♥</text>
          </view>
          <text class="about-app-name">{{ t("home.title") }}</text>
          <text class="text-muted about-line">trandsai</text>
          <text class="text-muted about-line">支持多语言 · 多智能体 · 沉浸式聊天</text>
          <view class="about-footer">
            <text class="text-muted about-copy">© 2025 trandsai. All rights reserved.</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录确认 -->
    <AppConfirmDialog
      :open="showLogoutConfirm"
      :title="t('profile.logout')"
      :description="t('profile.logoutConfirm')"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      destructive
      @update:open="showLogoutConfirm = $event"
      @confirm="handleLogout"
    />
  </AppPageShell>
</template>

<style scoped lang="scss">

.user-row { display: flex; gap: 24rpx; }
.avatar-placeholder { display: flex; width: 128rpx; height: 128rpx; background: var(--bg-input); }
.avatar-edit-btn { position: absolute; right: 0; bottom: 0; width: 48rpx; height: 48rpx; display: flex; background: var(--bg-card); border: 1px solid var(--border); }
.name-row { display: flex; gap: 12rpx; }
.stats-grid { display: grid; gap: 16rpx; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); padding: 24rpx 8rpx; }
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.menu-item { display: flex; padding: 28rpx 24rpx; background: var(--bg-card); border: 1px solid var(--border); }
.menu-left { display: flex; gap: 16rpx; }
.menu-right { display: flex; align-items: center; gap: 8rpx; color: var(--fg-muted); }
.btn-login { width: 100%; margin-top: 24rpx; }

.page-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.page-body {
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.user-meta-skeleton {
  flex: 1;
  gap: 12rpx;
}

.skel-name {
  width: 40%;
  height: 40rpx;
  border-radius: 8rpx;
}

.skel-id {
  width: 60%;
  height: 26rpx;
  border-radius: 8rpx;
}

.user-row {
  display: flex;
  align-items: center;
  margin-bottom: 48rpx;
}

.avatar-block {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar-wrap {
  :deep(.avatar-wrap) {
    border-radius: 50%;
  }
}

.avatar-placeholder {
  display: flex;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.avatar-emoji {
  font-size: 72rpx;
}

.avatar-edit-btn {
  border-radius: 50%;
  align-items: center;
  justify-content: center;

  &.disabled { opacity: 0.45; pointer-events: none; }
}

.edit-icon {
  font-size: 28rpx;
}

.user-meta {
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
}

.edit-name-btn {
  font-size: 28rpx;
}

.user-id {
  font-size: 26rpx;
}

.orientation-text {
  font-size: 22rpx;
  margin-top: 8rpx;
}

.stats-grid {
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 48rpx;
}

.stat-card {
  border-radius: 32rpx;
  text-align: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  border-radius: 24rpx;
  align-items: center;
  justify-content: space-between;
}

.menu-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.menu-icon-wrap {
  border-radius: 24rpx;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;

  &.destructive { color: var(--destructive); }
}

.menu-text-col {
  min-width: 0;
}

.menu-label {
  font-size: 30rpx;
}

.menu-hint {
  font-size: 22rpx;
  margin-top: 4rpx;
}

.menu-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.menu-badge {
  font-size: 22rpx;
  border-radius: 999px;
}

.chevron {
  font-size: 40rpx;
  line-height: 1;
}

.theme-switch {
  border-radius: 999px;
  flex-shrink: 0;

  &.on { color: var(--brand); }
}

.theme-knob {
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  .on & {
  }
}

.logout-item {
  border-color: rgba(239, 68, 68, 0.2);
}

.destructive-text {
}

.destructive-chevron {
}

.btn-login {
  display: flex;
  border-radius: 24rpx;
  font-size: 30rpx;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.55);
  padding: 32rpx;
  box-sizing: border-box;

  &.center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.bottom {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
  }
}

.modal-card {
  width: 100%;
  max-width: 640rpx;
  max-height: 85vh;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 32rpx;
  padding: 40rpx;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.edit-modal {
  max-width: 680rpx;
  max-height: 90vh;
}

.edit-form-scroll {
  flex: 1;
  min-height: 0;
  height: 0;
  margin-bottom: 8rpx;
}

.modal-sheet {
  width: 100%;
  max-width: 672px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  max-height: 85vh;
  box-sizing: border-box;
}

.sheet-header {
  margin-bottom: 16rpx;
}

.modal-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
  flex-shrink: 0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--fg);
}

.modal-close {
  font-size: 36rpx;
  color: var(--fg-muted);
  padding: 8rpx 12rpx;
  line-height: 1;
}

.form-group {
  margin-bottom: 28rpx;
}

.field-label {
  display: block;
  font-size: 22rpx;
  color: var(--fg-muted);
  margin-bottom: 12rpx;
}

.picker-field {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  box-sizing: border-box;
}

.save-btn {
  display: flex;
  width: 100%;
  margin: 16rpx 0 0;
  padding: 24rpx 32rpx;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.save-btn[disabled] {
  opacity: 0.55;
}

.lang-list {
  max-height: 60vh;
  box-sizing: border-box;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  border-radius: 24rpx;
  margin-bottom: 8rpx;
  padding: 24rpx 20rpx;
  background: var(--bg-input);
  border: 1px solid var(--border);

  &.active {
    border-color: rgba(236, 72, 153, 0.35);
    background: rgba(236, 72, 153, 0.08);
  }
}

.lang-flag {
  font-size: 40rpx;
}

.lang-label {
  flex: 1;
  font-size: 30rpx;
  color: var(--fg);
}

.lang-check {
  font-size: 32rpx;
  color: #ec4899;
}

.about-card {
  max-width: 560rpx;
}

.about-body {
  text-align: center;
}

.about-logo {
  width: 128rpx;
  height: 128rpx;
  margin: 0 auto 32rpx;
  display: flex;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ec4899, #9333ea);
}

.about-heart {
  font-size: 64rpx;
  color: #fff;
  line-height: 1;
}

.about-app-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 16rpx;
}

.about-line {
  display: block;
  font-size: 26rpx;
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.about-footer {
  border-top: 1px solid var(--border);
  margin-top: 32rpx;
  padding-top: 24rpx;
}

.about-copy {
  display: block;
  font-size: 22rpx;
}

.spinner-sm {
  border-top-color: #fff;
  border-radius: 50%;
  &.light {
    border-color: rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
  }
}

.avatar-edit-btn .spinner-sm {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
