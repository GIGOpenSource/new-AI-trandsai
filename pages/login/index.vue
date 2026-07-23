<script setup>
/**
 * @file pages/login — 登录页（公开路由）
 * @description 邮箱/用户名 + 密码登录；使用 rawFetch 避免 401 跳转死循环。
 * @depends rawFetch、storage、useAuth.redirectIfLoggedIn
 */
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { rawFetch } from "@/utils/api";
import { setItem } from "@/utils/storage";
import { redirectIfLoggedIn } from "@/composables/useAuth";
import { bindAnalyticsTap } from "@/utils/analytics";

const { t } = useI18n();
redirectIfLoggedIn();

// ——— 表单状态 ———
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 提交登录：成功写 token/user_info 并进首页 */
async function handleLogin() {
  error.value = "";
  const trimEmail = email.value.trim();
    if (!trimEmail && !password.value) {
      error.value = t("login.errorEmpty");
      return;
    }
    if (!trimEmail) {
      error.value = t("login.errorEmailEmpty");
      return;
    }
    if (!EMAIL_REGEX.test(trimEmail)) {
      error.value = t("login.errorEmailFormat");
      return;
    }
    if (!password.value) {
      error.value = t("login.errorPwdEmpty");
      return;
    }
  loading.value = true;
  try {
    const res = await rawFetch("/api/auth/login", {
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: { username: trimEmail, password: password.value },
    });
    if (!res.ok) {
      error.value = (res.data).detail || (t("login.errorFailed"));
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

function goRegister() {
  uni.navigateTo({ url: "/pages/register/index" });
}
</script>

<template>
  <view class="login-page">
    <view class="login-inner">
      <view class="logo-wrap">
        <view class="logo-circle">♥</view>
        <text class="login-title">{{ t("home.title") }}</text>
        <text class="text-muted">{{ t("login.subtitle") }}</text>
      </view>

      <view v-if="error" class="error-text">{{ error }}</view>

      <input
        v-model="email"
        class="input-field mt-md"
        :placeholder="t('login.username')"
      />
      <view class="password-wrap mt-md">
        <input
          v-model="password"
          class="input-field"
          :password="!showPassword"
          :placeholder="t('login.password')"
        />
       <view class="eye-btn" @tap="showPassword = !showPassword">
         <image v-if="showPassword" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E" style="width: 40rpx; height: 40rpx;" />
         <image v-else src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'/%3E%3Cline x1='1' y1='1' x2='23' y2='23'/%3E%3C/svg%3E" style="width: 40rpx; height: 40rpx;" />
       </view>
      </view>

      <button
        class="login-btn w-full mt-md"
        :disabled="loading"
        @tap="bindAnalyticsTap('login-submit', handleLogin, '登录')"
      >
        {{ loading ? t("login.loggingIn") : t("login.loginBtn") }}
      </button>

      <view
        class="register-link mt-md"
        @tap="bindAnalyticsTap('login-to-register', goRegister, '去注册')"
      >
        <text class="text-muted">{{ t("login.noAccount") }}</text>
        <text class="text-primary">{{ t("login.registerBtn") }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(env(safe-area-inset-top) + 48rpx) 48rpx 64rpx;
  box-sizing: border-box;
  background: var(--bg);
}
.login-inner { width: 100%; max-width: 640rpx; }
.logo-wrap { text-align: center; margin-bottom: 64rpx; }
.logo-circle {
  width: 160rpx; height: 160rpx; margin: 0 auto 24rpx;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 64rpx; color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-end));
}
.login-title { display: block; font-size: 48rpx; font-weight: 600; margin-bottom: 8rpx; color: var(--fg); }
.error-text { color: var(--destructive); text-align: center; font-size: 26rpx; margin-bottom: 16rpx; }
.password-wrap { position: relative; }
.eye-btn {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  padding: 8rpx;
  color: var(--fg-muted);
}
.register-link { text-align: center; font-size: 26rpx; margin-top: 48rpx; }
.login-btn {
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
</style>
