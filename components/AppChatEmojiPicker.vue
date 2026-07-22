<script setup>
/**
 * @file AppChatEmojiPicker.vue
 * @description 聊天表情面板：分类来自 chatEmojis，emit pick(emoji)。
 */
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { CHAT_EMOJI_CATEGORIES } from "@/utils/chatEmojis";

const emit = defineEmits(["pick"]);
const { t } = useI18n();
const activeCategory = ref(CHAT_EMOJI_CATEGORIES[0]?.key ?? "smile");

const category = () =>
  CHAT_EMOJI_CATEGORIES.find((c) => c.key === activeCategory.value) ??
  CHAT_EMOJI_CATEGORIES[0];
</script>

<template>
  <view class="emoji-picker">
    <scroll-view scroll-x class="cat-row">
      <text
        v-for="cat in CHAT_EMOJI_CATEGORIES"
        :key="cat.key"
        class="cat-chip"
        :class="{ active: cat.key === activeCategory }"
        @tap="activeCategory = cat.key"
      >{{ t(cat.labelKey) }}</text>
    </scroll-view>
    <view class="emoji-grid">
      <text
        v-for="emoji in category().emojis"
        :key="emoji"
        class="emoji-item"
        @tap="emit('pick', emoji)"
      >{{ emoji }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.emoji-picker { width: 520rpx; }
.cat-row { white-space: nowrap; margin-bottom: 16rpx; padding-bottom: 8rpx; border-bottom: 1px solid var(--border); }
.cat-chip {
  display: inline-block; padding: 8rpx 16rpx; margin-right: 8rpx; font-size: 22rpx;
  border-radius: 999px; color: var(--fg-muted);
  &.active { background: rgba(236, 72, 153, 0.15); color: var(--brand); }
}
.emoji-grid { display: flex; flex-wrap: wrap; max-height: 320rpx; overflow-y: auto; }
.emoji-item { width: 12.5%; text-align: center; font-size: 40rpx; padding: 8rpx 0; }
</style>
