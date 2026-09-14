import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { tracker } from './sdk/tracker.js'

// ============================================================
//  初始化埋点 SDK
// ============================================================
// 在 Vue 应用挂载之前初始化 tracker，
// 这样可以捕获到首次页面浏览事件。

tracker.init({
  appId: 'teach-case-analytics',  // 应用标识
  reportUrl: '/api/track',         // 单条上报接口
  batchUrl: '/api/track/batch',    // 批量上报接口
  sampleRate: 1,                   // 100% 采样（教学环境）
  enableOffline: true,             // 启用离线缓存
  enableAutoPV: true,              // 自动上报 PV
})

// 将 tracker 挂载到 window，方便控制台调试
if (typeof window !== 'undefined') {
  window.$tracker = tracker
  console.log('[App] tracker 已挂载到 window.$tracker')
  console.log('[App] 可在控制台试用: window.$tracker.track("test_event", { foo: "bar" })')
}

const app = createApp(App)
app.use(router)
app.mount('#app')
