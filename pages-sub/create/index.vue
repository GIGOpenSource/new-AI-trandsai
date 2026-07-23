<script setup>
/**
 * @file pages-sub/create — 创建伴侣向导
 * @description 多步表单（人设/城市/MBTI/性格标签等），提交 POST /companions。
 * @depends loadPresets、api、personalityTags、companionLang
 */
import { ref, computed, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import AppPageShell from "@/components/AppPageShell.vue";
import { requireAuth } from "@/composables/useAuth";
import { api, apiFetch } from "@/utils/api";
import { loadCitiesByLang, loadPresetPersonas } from "@/data/createCompanion/loadPresets";
import { inferCompanionLanguage } from "@/utils/companionLang";
import { translatePersonalityTag } from "@/utils/personalityTags";
import {
  formatCompanionAge,
  formatCompanionName,
  uiLangCode,
} from "@/utils/formatCompanion";
import { showToast } from "@/stores/toast";
import { getItem, removeItem } from "@/utils/storage";
import { invalidateCompanionsCache } from "@/utils/companionsCache";
import { bindAnalyticsTap } from "@/utils/analytics";

requireAuth();

const { t, locale } = useI18n();
const currentLang = computed(() => uiLangCode(locale.value));

// ——— 表单状态 ———

const PERSONALITIES = [
  "温柔",
  "傲娇",
  "病娇",
  "阳光",
  "御姐",
  "腹黑",
  "可爱",
  "成熟",
  "活泼",
  "冷淡",
];

const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

const ORIENTATIONS = [
  "heterosexual",
  "homosexual",
  "bisexual",
  "pansexual",
  "asexual",
  "secret",
];

const name = ref("");
const age = ref(22);
const gender = ref("female");
const city = ref("");
const selectedPersonalities = ref([]);
const background = ref("");
const speakingStyle = ref("");
const hobbies = ref("");
const values = ref("");
const fears = ref("");
const loveView = ref("");
const dailyRoutine = ref("");
const favoriteThings = ref("");
const mbti = ref("");
const sexualOrientation = ref("heterosexual");
const lifeStory = ref("");
const culturalValues = ref("");
const genderPerspective = ref("");
const chatHistoryRaw = ref("");
const chatHistoryCount = ref(0);
const dynamicCities = ref({});
const errors = ref({});
const creating = ref(false);
const autoFilling = ref(false);

const cityList = computed(
  () => dynamicCities.value[currentLang.value] || dynamicCities.value.zh || []
);

const cityPickerIndex = computed(() => {
  const idx = cityList.value.indexOf(city.value);
  return idx >= 0 ? idx : 0;
});

const mbtiOptions = computed(() => [
  { value: "", label: t("createCompanion.mbtiPlaceholder") },
  ...MBTI_TYPES.map((type) => ({
    value: type,
    label: `${type} - ${t(`createCompanion.mbtiTypes.${type}`)}`,
  })),
]);

const mbtiPickerIndex = computed(() => {
  const idx = mbtiOptions.value.findIndex((o) => o.value === mbti.value);
  return idx >= 0 ? idx : 0;
});

const orientationOptions = computed(() =>
  ORIENTATIONS.map((o) => ({
    value: o,
    label: t(`register.${o}`),
  }))
);

const orientationPickerIndex = computed(() => {
  const idx = ORIENTATIONS.indexOf(sexualOrientation.value);
  return idx >= 0 ? idx : 0;
});

const mbtiDisplayLabel = computed(() => {
  const opt = mbtiOptions.value.find((o) => o.value === mbti.value);
  return opt?.label || t("createCompanion.mbtiPlaceholder");
});

function personalityLabel(tag) {
  return translatePersonalityTag(tag, currentLang.value);
}

// ——— 预设加载 ———

async function loadCitiesForLang(lang) {
  const cities = await loadCitiesByLang(lang);
  dynamicCities.value = { ...dynamicCities.value, [lang]: cities };
  try {
    const data = await apiFetch(`/api/culture/cities?lang=${lang}`);
    if (data?.cities?.length) {
      dynamicCities.value = { ...dynamicCities.value, [lang]: data.cities };
    }
  } catch {
    /* fallback to static cities */
  }
}

watch(
  () => locale.value,
  (lang) => {
    void loadCitiesForLang((lang || "zh").split("-")[0]);
  },
  { immediate: true }
);

function prefillFromClone(raw) {
  try {
    const data = JSON.parse(raw);
    if (data.name) name.value = data.name.length > 20 ? data.name.slice(0, 20) : data.name;
    if (data.age) age.value = data.age;
    if (data.gender) gender.value = data.gender;
    if (data.city) city.value = data.city;
    if (data.personality) {
      const parts = String(data.personality)
        .split(/[、,，]/)
        .map((p) => p.trim())
        .filter(Boolean);
      selectedPersonalities.value = parts;
    }
    if (data.background) background.value = data.background;
    if (data.speech_style) speakingStyle.value = data.speech_style;
    if (data.hobbies) hobbies.value = data.hobbies;
    if (data.values) values.value = data.values;
    if (data.fears) fears.value = data.fears;
    if (data.love_view) loveView.value = data.love_view;
    if (data.daily_routine) dailyRoutine.value = data.daily_routine;
    if (data.favorite_things) favoriteThings.value = data.favorite_things;
    if (data.mbti) mbti.value = data.mbti;
    if (data.sexual_orientation) sexualOrientation.value = data.sexual_orientation;
    if (data.life_story) lifeStory.value = data.life_story;
    if (data.cultural_values) culturalValues.value = data.cultural_values;
    if (data.gender_perspective) genderPerspective.value = data.gender_perspective;
  } catch {
    /* ignore parse errors */
  }
}

onLoad((query) => {
  if (query?.clone !== "1") return;
  const raw = getItem("clone_companion_data");
  if (!raw) return;
  prefillFromClone(raw);
  removeItem("clone_companion_data");
});

function togglePersonality(personality) {
  if (selectedPersonalities.value.includes(personality)) {
    selectedPersonalities.value = selectedPersonalities.value.filter((p) => p !== personality);
  } else {
    selectedPersonalities.value = [...selectedPersonalities.value, personality];
  }
}

async function handleAutoFill() {
  autoFilling.value = true;
  try {
    const lang = currentLang.value;
    const list = await loadPresetPersonas(lang);
    const persona = list[Math.floor(Math.random() * list.length)];
    const apiGender = persona.gender === "男" ? "male" : "female";

    // Step 1: 调用接口获取随机名字
    let pickedName = persona.name;
    try {
      const data = await apiFetch(
        `/api/culture/names?lang=${lang}&gender=${apiGender}&count=8`
      );
      if (data.names?.length) {
        pickedName = data.names[Math.floor(Math.random() * data.names.length)];
      }
    } catch {
      /* fallback to preset name */
    }
    const finalName = formatCompanionName(pickedName, persona.name);
    const finalAge = persona.age;
    const finalGender = apiGender;
    const finalOrientation = persona.sexual_orientation || "heterosexual";
    const finalCity = persona.city;
    const finalPersonalities = String(persona.personality || "")
      .split(/[、,，]/)
      .map((p) => p.trim())
      .filter(Boolean);
    const finalMbti = persona.mbti || "";

    // Step 2: 调用 /companions/generate 生成详细内容
    const generatePayload = {
      name: finalName,
      age: finalAge,
      gender: persona.gender,
      city: finalCity,
      personality: finalPersonalities.join("、"),
      background: persona.background || "",
      speech_style: persona.speech_style || "",
    };

    let generated = null;
    try {
      generated = await apiFetch("/companions/generate", {
        method: "POST",
        data: generatePayload,
        timeout: 60000,
      });
    } catch (e) {
      console.warn("[AutoFill] generate 接口失败，回退本地预设:", e);
    }

    // Step 3: 两个接口都完成后，一次性填充所有字段
    name.value = finalName.length > 20 ? finalName.slice(0, 20) : finalName;
    age.value = finalAge;
    gender.value = finalGender;
    sexualOrientation.value = finalOrientation;
    city.value = finalCity;
    selectedPersonalities.value = finalPersonalities;
    mbti.value = finalMbti;
    errors.value = {};

    const g = generated || {};
    background.value = g.background || persona.background || "";
    speakingStyle.value = g.speech_style || persona.speech_style || "";
    hobbies.value = g.hobbies || persona.hobbies || "";
    values.value = g.values || persona.values || "";
    fears.value = g.fears || persona.fears || "";
    loveView.value = g.love_view || persona.love_view || "";
    dailyRoutine.value = g.daily_routine || persona.daily_routine || "";
    favoriteThings.value = g.favorite_things || persona.favorite_things || "";
    lifeStory.value = g.life_story || persona.life_story || "";
    culturalValues.value = g.cultural_values || persona.cultural_values || "";
    genderPerspective.value = g.gender_perspective || persona.gender_perspective || "";
  } catch (err) {
    console.error("[AutoFill] 生成失败:", err);
    showToast(t("common.networkError") || "网络错误，请重试");
  } finally {
    autoFilling.value = false;
  }
}

function parseChatHistory(raw) {
  if (!raw.trim()) return [];
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw.trim());
      if (Array.isArray(parsed)) {
        return parsed
          .filter((m) => m.role && m.content)
          .map((m) => ({ role: m.role, content: String(m.content) }));
      }
    } catch {
      /* continue text parsing */
    }
  }
  const lines = raw.split("\n").filter((l) => l.trim());
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(用户|我|user)[\s:：]/i.test(trimmed)) {
      result.push({
        role: "user",
        content: trimmed.replace(/^(用户|我|user)[\s:：]/i, "").trim(),
      });
    } else if (/^(AI|智能体|assistant|对方|ta|TA)[\s:：]/i.test(trimmed)) {
      result.push({
        role: "assistant",
        content: trimmed.replace(/^(AI|智能体|assistant|对方|ta|TA)[\s:：]/i, "").trim(),
      });
    } else if (result.length > 0) {
      result[result.length - 1].content += "\n" + trimmed;
    }
  }
  return result;
}

function onChatHistoryInput(e) {
  chatHistoryRaw.value = e.detail.value;
  chatHistoryCount.value = parseChatHistory(e.detail.value).length;
}

// ——— 校验提交 ———

/** 校验必填项与字数，失败时 toast 提示 */
function validateForm() {
  const newErrors = {};
  const personalityStr = selectedPersonalities.value.join("、");

  if (!name.value.trim()) newErrors.name = t("createCompanion.errors.nameRequired");
  if (name.value.length > 20) newErrors.name = "名字最多20个字符";
  if (!age.value && age.value !== 0) newErrors.age = t("createCompanion.errors.ageRequired");
  if (!gender.value) newErrors.gender = t("createCompanion.errors.genderRequired");
  if (!city.value.trim()) newErrors.city = t("createCompanion.errors.cityRequired");
  if (!personalityStr.trim()) newErrors.personality = t("createCompanion.errors.personalityRequired");
  if (selectedPersonalities.value.length < 2) {
    newErrors.personality = t("createCompanion.errors.personalityMin");
  }
  if (!mbti.value.trim()) newErrors.mbti = t("createCompanion.errors.mbtiRequired");
  if (!sexualOrientation.value.trim()) {
    newErrors.sexualOrientation = t("createCompanion.errors.orientationRequired");
  }
  if (!background.value.trim()) {
    newErrors.background = t("createCompanion.errors.backgroundRequired");
  } else if (background.value.trim().length < 5) {
    newErrors.background = t("createCompanion.errors.backgroundMin");
  }
  if (!speakingStyle.value.trim()) {
    newErrors.speakingStyle = t("createCompanion.errors.speechRequired");
  } else if (speakingStyle.value.trim().length < 5) {
    newErrors.speakingStyle = t("createCompanion.errors.speechMin");
  }

  errors.value = newErrors;
  const errorList = Object.values(newErrors);
  if (errorList.length > 0) {
    showToast(errorList.join("\n"));
  }
  return errorList.length === 0;
}

/** 提交创建伴侣请求并跳转消息页 */
async function handleCreate() {
  if (creating.value) return;
  if (!validateForm()) return;

  const companionLang = inferCompanionLanguage(city.value);
  const payload = {
    name: name.value.trim(),
    age: age.value,
    gender: gender.value === "male" ? "男" : "女",
    city: city.value.trim(),
    personality: selectedPersonalities.value
      .map((p) => translatePersonalityTag(p, companionLang || currentLang.value))
      .join("、"),
    mbti: mbti.value,
    sexual_orientation: sexualOrientation.value,
    avatar_url: "__GENERATING__",
    background: background.value.trim(),
    speech_style: speakingStyle.value.trim(),
    hobbies: hobbies.value || "",
    values: values.value || "",
    fears: fears.value || "",
    love_view: loveView.value || "",
    daily_routine: dailyRoutine.value || "",
    favorite_things: favoriteThings.value || "",
    life_story: lifeStory.value || "",
    cultural_values: culturalValues.value || "",
    gender_perspective: genderPerspective.value || "",
    language: companionLang,
  };

  const parsedHistory = parseChatHistory(chatHistoryRaw.value);
  if (parsedHistory.length > 0) {
    payload.chat_history = parsedHistory;
  }

  creating.value = true;
  try {
    await api.post("/companions", payload);
    invalidateCompanionsCache();
    uni.reLaunch({ url: "/pages/messages/index" });
  } catch (err) {
    console.error("[CreateCompanion] 创建智能体失败:", err);
  } finally {
    creating.value = false;
  }
}

function onCityChange(e) {
  city.value = cityList.value[Number(e.detail.value)] || "";
}

function onMbtiChange(e) {
  mbti.value = mbtiOptions.value[Number(e.detail.value)]?.value || "";
}

function onOrientationChange(e) {
  sexualOrientation.value = ORIENTATIONS[Number(e.detail.value)] || "heterosexual";
}

function onAgeChange(e) {
  age.value = Number(e.detail.value);
}
</script>

<template>
  <AppPageShell
    :title="t('createCompanion.title')"
    :show-back="true"
    header-right
    back-analytics-id="create-companion-back"
    back-analytics-name="创建伴侣页返回"
  >
    <template #header-right>
      <view class="autofill-btn" :class="{ disabled: autoFilling }" @tap="bindAnalyticsTap('create-companion-autofill', handleAutoFill, '自动填充')">
        <text class="autofill-icon">✨</text>
        <text>{{ t("createCompanion.autoFill") }}</text>
      </view>
    </template>

    <!-- 一键填充加载遮罩 -->
    <view v-if="autoFilling" class="autofill-mask">
      <view class="autofill-loader">
        <view class="loader-spinner"></view>
        <text class="loader-text">AI 正在生成人设...</text>
      </view>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <view class="form-inner">
        <view class="field">
          <text class="label">
            {{ t("createCompanion.name") }}
            <text class="required">*</text>
            <text class="char-count" :class="{ over: name.length > 20 }">{{ name.length }}/20</text>
          </text>
          <input
            :value="name"
            class="input-field"
            :class="{ 'input-error': errors.name }"
            :placeholder="t('createCompanion.namePlaceholder')"
            :maxlength="20"
              @input="name = $event.detail.value"
          />
          <text v-if="errors.name" class="error-text">{{ errors.name }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.ageLabel", { age }) }}
            <text class="required">*</text>
          </text>
          <slider
            :min="0"
            :max="1000"
            :value="age"
            active-color="#ec4899"
            background-color="var(--border)"
            block-size="20"
            @change="onAgeChange"
          />
          <view class="range-hints">
            <text class="text-muted">0</text>
            <text class="text-muted">1000</text>
          </view>
          <text v-if="errors.age" class="error-text">{{ errors.age }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.gender") }}
            <text class="required">*</text>
          </text>
          <view class="flex-row gap-sm">
            <button
              class="gender-btn"
              :class="{ active: gender === 'male', 'male-active': gender === 'male' }"
              @tap="gender = 'male'"
            >
              {{ t("register.male") }}
            </button>
            <button
              class="gender-btn"
              :class="{ active: gender === 'female', 'female-active': gender === 'female' }"
              @tap="gender = 'female'"
            >
              {{ t("register.female") }}
            </button>
          </view>
          <text v-if="errors.gender" class="error-text">{{ errors.gender }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.sexualOrientation") }}
            <text class="required">*</text>
          </text>
          <picker
            mode="selector"
            :range="orientationOptions.map((o) => o.label)"
            :value="orientationPickerIndex"
            @change="onOrientationChange"
          >
            <view class="input-field picker-field" :class="{ 'input-error': errors.sexualOrientation }">
              {{ t(`register.${sexualOrientation}`) }}
            </view>
          </picker>
          <text v-if="errors.sexualOrientation" class="error-text">{{ errors.sexualOrientation }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.city") }}
            <text class="required">*</text>
          </text>
          <picker
            mode="selector"
            :range="cityList"
            :value="cityPickerIndex"
            @change="onCityChange"
          >
            <view class="input-field picker-field" :class="{ 'input-error': errors.city }">
              {{ city || t("createCompanion.cityPlaceholder") }}
            </view>
          </picker>
          <text v-if="errors.city" class="error-text">{{ errors.city }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.mbti") }}
            <text class="required">*</text>
          </text>
          <picker
            mode="selector"
            :range="mbtiOptions.map((o) => o.label)"
            :value="mbtiPickerIndex"
            @change="onMbtiChange"
          >
            <view class="input-field picker-field" :class="{ 'input-error': errors.mbti }">
              {{ mbtiDisplayLabel }}
            </view>
          </picker>
          <text v-if="errors.mbti" class="error-text">{{ errors.mbti }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.personalityLabel") }}
            <text class="required">*</text>
          </text>
          <view class="tag-row">
            <button
              v-for="p in PERSONALITIES"
              :key="p"
              class="tag-btn"
              :class="{ active: selectedPersonalities.includes(p) }"
              @tap="togglePersonality(p)"
            >
              {{ personalityLabel(p) }}
              <text v-if="selectedPersonalities.includes(p)" class="tag-check">✓</text>
            </button>
          </view>
          <text v-if="errors.personality" class="error-text">{{ errors.personality }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.background") }}
            <text class="required">*</text>
          </text>
          <textarea
            :value="background"
            class="input-field textarea"
            :class="{ 'input-error': errors.background }"
            :placeholder="t('createCompanion.backgroundPlaceholder')"
            :maxlength="-1"
              @input="background = $event.detail.value"
          />
          <text v-if="errors.background" class="error-text">{{ errors.background }}</text>
        </view>

        <view class="field">
          <text class="label">
            {{ t("createCompanion.speechStyle") }}
            <text class="required">*</text>
          </text>
          <textarea
            :value="speakingStyle"
            class="input-field textarea"
            :class="{ 'input-error': errors.speakingStyle }"
            :placeholder="t('createCompanion.speechStylePlaceholder')"
            :maxlength="-1"
              @input="speakingStyle = $event.detail.value"
          />
          <text v-if="errors.speakingStyle" class="error-text">{{ errors.speakingStyle }}</text>
        </view>

        <view class="section-divider">
          <text class="section-hint">{{ t("createCompanion.importChatHistory") }}</text>
          <textarea
            :value="chatHistoryRaw"
            class="input-field textarea chat-history"
            :placeholder="t('createCompanion.chatHistoryPlaceholder')"
            :maxlength="-1"
              @input="onChatHistoryInput"
          />
          <text v-if="chatHistoryCount > 0" class="text-muted hint-text">
            {{ t("createCompanion.recognizedMessages", { count: chatHistoryCount }) }}
          </text>
        </view>

        <view class="section-divider">
          <text class="section-hint">{{ t("createCompanion.personalityDetails") }}</text>

          <view class="field">
            <text class="label">{{ t("createCompanion.hobbies") }}</text>
            <textarea
              :value="hobbies"
              class="input-field textarea short"
              :placeholder="t('createCompanion.hobbiesPlaceholder')"
              :maxlength="-1"
              @input="hobbies = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.values") }}</text>
            <textarea
              :value="values"
              class="input-field textarea short"
              :placeholder="t('createCompanion.valuesPlaceholder')"
              :maxlength="-1"
              @input="values = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.fears") }}</text>
            <textarea
              :value="fears"
              class="input-field textarea short"
              :placeholder="t('createCompanion.fearsPlaceholder')"
              :maxlength="-1"
              @input="fears = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.loveView") }}</text>
            <textarea
              :value="loveView"
              class="input-field textarea short"
              :placeholder="t('createCompanion.loveViewPlaceholder')"
              :maxlength="-1"
              @input="loveView = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.dailyRoutine") }}</text>
            <textarea
              :value="dailyRoutine"
              class="input-field textarea short"
              :placeholder="t('createCompanion.dailyRoutinePlaceholder')"
              :maxlength="-1"
              @input="dailyRoutine = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.favoriteThings") }}</text>
            <textarea
              :value="favoriteThings"
              class="input-field textarea short"
              :placeholder="t('createCompanion.favoriteThingsPlaceholder')"
              :maxlength="-1"
              @input="favoriteThings = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.lifeStory") }}</text>
            <textarea
              :value="lifeStory"
              class="input-field textarea tall"
              :placeholder="t('createCompanion.lifeStoryPlaceholder')"
              :maxlength="-1"
              @input="lifeStory = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.culturalValues") }}</text>
            <textarea
              :value="culturalValues"
              class="input-field textarea tall"
              :placeholder="t('createCompanion.culturalValuesPlaceholder')"
              :maxlength="-1"
              @input="culturalValues = $event.detail.value"
            />
          </view>

          <view class="field">
            <text class="label">{{ t("createCompanion.genderPerspective") }}</text>
            <textarea
              :value="genderPerspective"
              class="input-field textarea tall"
              :placeholder="t('createCompanion.genderPerspectivePlaceholder')"
              :maxlength="-1"
              @input="genderPerspective = $event.detail.value"
            />
          </view>
        </view>

        <view class="card preview-card">
          <text class="preview-title">{{ t("createCompanion.preview") }}</text>
          <view class="flex-row items-center gap-sm">
            <view class="preview-avatar">
              <text>{{ gender === "female" ? "👩" : "👨" }}</text>
            </view>
            <view class="preview-info">
              <text class="preview-name">{{ name || t("createCompanion.unnamed") }}</text>
              <text class="text-muted preview-meta">
                {{ formatCompanionAge(age, t) }} ·
                {{ city || t("createCompanion.unknownCity") }}
              </text>
              <text v-if="mbti" class="mbti-badge">{{ mbti }}</text>
              <view v-if="selectedPersonalities.length" class="tag-row preview-tags">
                <text
                  v-for="p in selectedPersonalities.slice(0, 3)"
                  :key="p"
                  class="preview-tag"
                >
                  {{ personalityLabel(p) }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <button class="btn-primary submit-btn" :disabled="creating" @tap="bindAnalyticsTap('create-companion-submit', handleCreate, '创建伴侣')">
          {{ creating ? t("createCompanion.generating") : t("createCompanion.createBtn") }}
        </button>
      </view>
    </scroll-view>
  </AppPageShell>
</template>

<style scoped lang="scss">
.form-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.form-inner {
  padding: 32rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.field {
  margin-bottom: 40rpx;
}

.label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: var(--fg);
  margin-bottom: 16rpx;
  font-weight: 500;
}

.required {
  color: #ef4444;
  margin-left: 4rpx;
}

.char-count {
  font-size: 22rpx;
  color: var(--fg-muted);
  margin-left: auto;
  font-weight: 400;
}

.char-count.over {
  color: #ef4444;
}

.input-error {
  border-color: #ef4444 !important;
}

.error-text {
  display: block;
  color: #ef4444;
  font-size: 22rpx;
  margin-top: 8rpx;
}

.picker-field {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  line-height: 1.4;
  box-sizing: border-box;
}

.range-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  font-size: 22rpx;
}

.gender-btn {
  flex: 1;
  margin: 0;
  padding: 24rpx 16rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  line-height: 1.2;
  background: var(--bg-input);
  color: var(--fg);
  border: 1px solid var(--border);
}

.gender-btn::after {
  border: none;
}

.gender-btn.male-active {
  background: rgba(59, 130, 246, 0.18);
  color: #3b82f6;
  border-color: transparent;
}

.gender-btn.female-active {
  background: rgba(236, 72, 153, 0.18);
  color: #ec4899;
  border-color: transparent;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-btn {
  margin: 0;
  padding: 12rpx 28rpx;
  border-radius: 999px;
  font-size: 26rpx;
  line-height: 1.2;
  background: var(--bg-input);
  color: var(--fg);
  border: 1px solid var(--border);
}

.tag-btn::after {
  border: none;
}

.tag-btn.active {
  background: linear-gradient(90deg, var(--brand), var(--brand-end));
  color: #fff;
  border-color: transparent;
}

.tag-check {
  margin-left: 8rpx;
}

.textarea {
  width: 100%;
  min-height: 160rpx;
  box-sizing: border-box;
}

.textarea.short {
  min-height: 120rpx;
}

.textarea.tall {
  min-height: 240rpx;
}

.textarea.chat-history {
  min-height: 320rpx;
  font-size: 26rpx;
}

.section-divider {
  border-top: 1px solid var(--border);
  padding-top: 32rpx;
  margin-bottom: 32rpx;
}

.section-hint {
  display: block;
  font-size: 22rpx;
  color: var(--fg-muted);
  margin-bottom: 24rpx;
}

.hint-text {
  display: block;
  font-size: 22rpx;
  margin-top: 8rpx;
}

.preview-card {
  margin-bottom: 32rpx;
  padding: 28rpx;
}

.preview-title {
  display: block;
  font-size: 28rpx;
  color: var(--fg);
  margin-bottom: 24rpx;
  font-weight: 500;
}

.preview-avatar {
  width: 112rpx;
  height: 112rpx;
  display: flex;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f472b6, #9333ea);
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  display: block;
  font-size: 30rpx;
  color: var(--fg);
  margin-bottom: 8rpx;
  font-weight: 600;
}

.preview-meta {
  display: block;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.mbti-badge {
  display: inline-block;
  font-size: 22rpx;
  border-radius: 999px;
  margin-bottom: 8rpx;
  padding: 4rpx 16rpx;
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.preview-tags {
  margin-top: 8rpx;
}

.preview-tag {
  font-size: 22rpx;
  border-radius: 999px;
  padding: 4rpx 16rpx;
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  border-radius: 34rpx !important;
  margin: 0 0 16rpx;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 1;
}

.autofill-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #ec4899;
  border: 1px solid rgba(236, 72, 153, 0.35);
  border-radius: 999px;
  padding: 10rpx 20rpx;
  background: transparent;
}

.autofill-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.autofill-icon {
  font-size: 24rpx;
}

.autofill-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.autofill-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  background: var(--bg-card, #1a1a2e);
  border-radius: 32rpx;
  padding: 48rpx 72rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.4);
}

.loader-spinner {
  width: 64rpx;
  height: 64rpx;
  border: 6rpx solid rgba(236, 72, 153, 0.2);
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loader-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
