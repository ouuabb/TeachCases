<!--
  App.vue — 全局入口组件

  教学要点：
  - onLaunch：App 冷启动时触发（首次打开）
  - onShow：App 进入前台时触发（包括后台唤醒）
  - onHide：App 进入后台时触发

  Deep Link 处理流程：
  1. onLaunch 中获取启动参数（冷启动）
  2. onShow 中获取启动参数（后台唤醒）
  3. 解析参数 → 判断来源 → 跳转对应页面
-->
<script>
/**
 * 导入 DeepLink Manager
 *
 * DeepLinkManager 负责：
 * - 获取 plus.runtime.arguments
 * - 判断来源方案类型（Scheme/Universal Link/Token 等）
 * - 解析参数生成统一的 RoutePayload
 * - 执行 uni.navigateTo 跳转
 */
import { DeepLinkManager } from '@/core/deeplink-manager'

export default {
  /**
   * App 冷启动
   *
   * 教学要点：
   * - 只在 App 首次启动时触发一次
   * - 适合执行初始化操作
   * - 如果 App 是通过 Deep Link 唤起的，这里能获取到启动参数
   */
  onLaunch: function() {
    console.log('[App] onLaunch — 冷启动')

    // 处理 Deep Link 启动参数
    DeepLinkManager.handleLaunch()
  },

  /**
   * App 进入前台
   *
   * 教学要点：
   * - 每次 App 回到前台都会触发
   * - 如果 App 是通过 Deep Link 从后台唤醒的，这里能获取到参数
   * - 需要去重：onLaunch 和 onShow 可能会连续触发，处理同一参数
   */
  onShow: function() {
    console.log('[App] onShow — 进入前台')

    // 处理 Deep Link 启动参数（后台唤醒场景）
    DeepLinkManager.handleLaunch()
  },

  /**
   * App 进入后台
   *
   * 教学要点：
   * - App 切到后台时触发
   * - 可以用于保存状态、暂停计时器等
   */
  onHide: function() {
    console.log('[App] onHide — 进入后台')
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 重置默认样式 */
view, text {
  box-sizing: border-box;
}
</style>
