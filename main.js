import App from './App'
import i18n from './i18n'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  i18n,
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { useChatStore } from './stores/chat'
import { useThemeStore } from './stores/theme'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(i18n)

  const chat = useChatStore()
  chat.setupLifecycle()
  chat.watchPersistEffects()

  useThemeStore()

  return { app }
}
// #endif
