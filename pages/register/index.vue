<script setup>
/**
 * @file pages/register — 注册页（公开路由）
 * @description 账号注册（用户名/昵称/邮箱/密码/性别/性取向）；成功后写入 token 并进首页。
 * @depends rawFetch、storage、useAuth.redirectIfLoggedIn
 */
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { rawFetch } from "@/utils/api";
import { setItem } from "@/utils/storage";
import { bindAnalyticsTap } from "@/utils/analytics";
import AppPageShell from "@/components/AppPageShell.vue";

const { t } = useI18n();

// ——— 表单状态 ———
const gender = ref("secret");
const sexualOrientation = ref("heterosexual");
const email = ref("");
const nickname = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 校验并提交注册 */
async function handleRegister() {
  error.value = "";
  const trimmedEmail = email.value.trim();
  const trimmedNickname = nickname.value.trim();
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    error.value = t("register.errorEmail");
    return;
  }
  if (!trimmedNickname) {
    error.value = t("register.errorNickname");
    return;
  }
  if (!password.value || password.value.length < 6) {
    error.value = t("register.errorPassword");
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = t("register.errorConfirm");
    return;
  }
  loading.value = true;
  try {
    const res = await rawFetch("/api/auth/register", {
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: {
        username: trimmedEmail,
        nickname: trimmedNickname,
        email: trimmedEmail,
        password: password.value,
        gender: gender.value === "male" ? "男" : gender.value === "female" ? "女" : "保密",
        sexual_orientation: sexualOrientation.value,
      },
    });
    if (!res.ok) {
      const serverError = String(res.data.error || res.data.message || res.data.detail || "").toLowerCase();
      const isEmailRegistered =
        res.status === 409 ||
        serverError.includes("already") ||
        serverError.includes("duplicate") ||
        serverError.includes("用户名") ||
        serverError.includes("邮箱");
      error.value = isEmailRegistered
        ? "该邮箱已被注册"
        : res.data.error || res.data.message || res.data.detail || (t("register.errorFailed"));
      return;
    }
    setItem("user_token", res.data.token);
    setItem("user_info", JSON.stringify(res.data.user));
    uni.reLaunch({ url: "/pages/home/index" });
  } catch {
    error.value = t("common.networkError");
  } finally {
    loading.value = false;
  }
}

const genderOptions = [
  { value: "male", label: () => t("register.male") },
  { value: "female", label: () => t("register.female") },
  { value: "secret", label: () => t("register.secret") },
];

const orientationKeys = [
  "heterosexual", "homosexual", "bisexual", "pansexual", "asexual", "secret",
];
const orientationLabels = orientationKeys.map(key => t(`register.${key}`));

function onOrientationChange(e) {
  const idx = Number(e?.detail?.value ?? 0);
  sexualOrientation.value = orientationKeys[idx] || orientationKeys[0];
}

function goPrivacy() {
  uni.navigateTo({ url: "/pages-sub/privacy/index" });
}

function goLogin() {
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: "/pages/login/index" }),
  });
}
</script>

<template>
  <AppPageShell
    :title="t('register.title')"
    :show-back="true"
    back-fallback-url="/pages/login/index"
    back-analytics-id="register-back"
    back-analytics-name="注册页返回"
  >
    <scroll-view scroll-y class="register-page">
      <view class="register-inner">
        <view class="logo-wrap">
          <view class="logo-circle">♥</view>
          <text class="text-muted">{{ t("register.subtitle") }}</text>
        </view>

        <view v-if="error" class="error-text">{{ error }}</view>

        <input v-model="email" class="input-field" :placeholder="t('register.email')" />
        <input v-model="nickname" class="input-field mt-md" :placeholder="t('register.nickname')" />

        <view class="password-wrap mt-md">
          <input v-model="password" class="input-field" :password="!showPassword" :placeholder="t('register.password')" />
          <view class="eye-btn" @tap="showPassword = !showPassword">
            <image v-if="showPassword" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E" style="width: 40rpx; height: 40rpx;" />
            <image v-else src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'/%3E%3Cline x1='1' y1='1' x2='23' y2='23'/%3E%3C/svg%3E" style="width: 40rpx; height: 40rpx;" />
          </view>
        </view>
        <view class="password-wrap mt-md">
          <input v-model="confirmPassword" class="input-field" :password="!showConfirmPassword" :placeholder="t('register.confirmPassword')" />
          <view class="eye-btn" @tap="showConfirmPassword = !showConfirmPassword">
            <image v-if="showConfirmPassword" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E" style="width: 40rpx; height: 40rpx;" />
            <image v-else src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'/%3E%3Cline x1='1' y1='1' x2='23' y2='23'/%3E%3C/svg%3E" style="width: 40rpx; height: 40rpx;" />
          </view>
        </view>

        <text class="label mt-md">{{ t("register.gender") }}</text>
        <view class="flex-row gap-sm mt-md">
          <button
            v-for="opt in genderOptions"
            :key="opt.value"
            class="pill-btn"
            :class="{ active: gender === opt.value }"
            @tap="gender = opt.value"
          >{{ opt.label() }}</button>
        </view>

        <text class="label mt-md">{{ t("register.sexualOrientation") }}</text>
        <picker
          :range="orientationLabels"
          :value="orientationKeys.indexOf(sexualOrientation)"
          @change="onOrientationChange"
        >
          <view class="input-field mt-md">{{ t(`register.${sexualOrientation}`) }}</view>
        </picker>

        <button class="register-btn w-full mt-md" :disabled="loading" @tap="bindAnalyticsTap('register-submit', handleRegister, '注册')">
          {{ loading ? t("register.registering") : t("register.registerBtn") }}
        </button>

        <view class="agree mt-md">
          <text class="text-muted">{{ t("register.agree") }}</text>
          <text class="text-primary" @tap="goPrivacy">{{ t("register.privacy") }}</text>
        </view>

        <view class="login-link mt-md" @tap="bindAnalyticsTap('register-to-login', goLogin, '去登录')">
          <text class="text-muted">{{ t("register.hasAccount") }}</text>
          <text class="text-primary">{{ t("register.goLogin") }}</text>
        </view>
      </view>
    </scroll-view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.register-page {
  height: 100%;
  padding: 32rpx 48rpx 64rpx;
  box-sizing: border-box;
  background: var(--bg);
}
.register-inner { max-width: 640rpx; margin: 0 auto; padding-bottom: 48rpx; }
.logo-wrap { text-align: center; margin-bottom: 48rpx; }
.logo-circle {
  width: 128rpx; height: 128rpx; margin: 0 auto 24rpx;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 56rpx; color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-end));
}
.error-text { color: var(--destructive); text-align: center; font-size: 26rpx; margin-bottom: 16rpx; }
.password-wrap { position: relative; }
.eye-btn {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  padding: 8rpx;
}
.label { display: block; color: var(--fg-muted); font-size: 26rpx; }
.pill-btn {
  flex: 1;
  height: 90rpx;
  border-radius: 40rpx;
  background: var(--bg-input);
  color: var(--fg);
  border: 1px solid var(--border);
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: linear-gradient(90deg, var(--brand), var(--brand-end));
    color: #fff;
    border: none;
  }
}
.register-btn {
  width: 100%;
  height: 90rpx;
  border-radius: 40rpx;
  background: linear-gradient(90deg, var(--brand), var(--brand-end));
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.agree, .login-link { text-align: center; font-size: 24rpx; }
</style>
