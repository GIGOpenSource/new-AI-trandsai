<script setup>
/**
 * @file pages-sub/privacy — 隐私政策（静态文案）
 * @description 展示 i18n 隐私条款，无网络请求。
 */
import AppPageShell from "@/components/AppPageShell.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const url = "https://www.trandsai.com/agreement/Trands%20-%20Ai%20Privacy%20Policy.html";
</script>

<template>
  <AppPageShell :title="t('privacy.title')" :show-back="true">
    <!-- #ifdef H5 -->
    <web-view :src="url" class="webview" />
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view class="px-md py-sm">
      <text class="text-muted">{{ t("privacy.openInBrowser") || "请在浏览器中查看隐私政策：" }}</text>
      <text class="link" @tap="uni.setClipboardData({ data: url })">{{ url }}</text>
    </view>
    <!-- #endif -->
  </AppPageShell>
</template>

<style scoped lang="scss">
.webview { width: 100%; height: calc(100vh - 120rpx); }
.link { display: block; color: var(--brand); word-break: break-all; margin-top: 16rpx; }
</style>
