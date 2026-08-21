/**
 * DeepLink Manager — 统一管理层
 *
 * 教学要点：
 * - 所有方案的公共处理层：获取启动参数 → 解析 → 跳转
 * - 同时处理冷启动（onLaunch）和后台唤醒（onShow）
 * - 判断来源方案类型，统一生成 RoutePayload
 *
 * 使用方式：
 *   import { DeepLinkManager } from '@/core/deeplink-manager'
 *
 *   // 在 App.vue 的 onShow 中调用
 *   DeepLinkManager.handleLaunch()
 */
import { parseScheme, parseNativeArgs } from '@/utils/scheme'
import { detectEnvironment, fetchRouteInfo, navigateToRoute } from '@/utils/deeplink'
import { SCHEME_NAME, BASE_URL } from '@/utils/config'

/**
 * @typedef {object} RoutePayload
 * @property {string} route - 目标路由路径
 * @property {object} query - 查询参数
 * @property {string} source - 来源方案类型
 * @property {string} raw - 原始参数
 */

class DeepLinkManagerClass {
  constructor() {
    /** 已处理过的参数（防止重复跳转） */
    this._lastArgs = null
  }

  /**
   * 主入口：处理 App 启动参数
   * 在 App.vue 的 onLaunch 和 onShow 中调用
   *
   * 教学要点：
   * - plus.runtime.arguments 是 uni-app 获取启动参数的标准 API
   * - 冷启动时 onLaunch 先触发，onShow 后触发
   * - 后台唤醒时只触发 onShow
   * - 需要去重，避免同一参数处理两次
   */
  handleLaunch() {
    // #ifdef APP-PLUS
    try {
      const args = plus.runtime.arguments
      if (!args) return

      console.log('[DeepLinkManager] 收到启动参数:', args)

      // 防重复处理
      if (args === this._lastArgs) return
      this._lastArgs = args

      // 解析参数并跳转
      const payload = this.parseArgs(args)
      if (payload) {
        console.log('[DeepLinkManager] 解析结果:', payload)
        this.executeRoute(payload)
      }
    } catch (e) {
      console.error('[DeepLinkManager] 处理启动参数失败:', e)
    }
    // #endif
  }

  /**
   * 解析启动参数，返回统一的 RoutePayload
   *
   * 教学要点：
   * - plus.runtime.arguments 的格式取决于来源：
   *   - URL Scheme 直接传入完整 URL 字符串
   *   - Universal Link 传入完整 HTTPS URL
   *   - Android Intent 可能是 JSON 或 URL
   * - 需要根据内容格式判断来源类型
   *
   * @param {string} args - plus.runtime.arguments 原始值
   * @returns {RoutePayload|null} 解析结果
   */
  parseArgs(args) {
    if (!args) return null

    // 格式1：自定义 Scheme URL（scanjump://...）
    if (args.startsWith(`${SCHEME_NAME}://`)) {
      const parsed = parseScheme(args)
      return {
        route: this._pathToRoute(parsed.path),
        query: parsed.query,
        source: 'scheme',
        raw: args
      }
    }

    // 格式2：Universal Link / App Link（https://...）
    if (args.startsWith('https://') || args.startsWith('http://')) {
      return this._parseHttpsUrl(args)
    }

    // 格式3：JSON 格式（某些 DeepLink 服务返回）
    try {
      const data = JSON.parse(args)
      if (data.route) {
        return {
          route: data.route,
          query: data.query || {},
          source: 'deeplink_service',
          raw: args
        }
      }
    } catch (e) {
      // 非 JSON，继续尝试其他格式
    }

    // 格式4：Native 参数格式
    const parsed = parseNativeArgs(args)
    if (parsed.path) {
      return {
        route: this._pathToRoute(parsed.path),
        query: parsed.query || {},
        source: 'native',
        raw: args
      }
    }

    console.warn('[DeepLinkManager] 无法解析参数:', args)
    return null
  }

  /**
   * 执行路由跳转
   * @param {RoutePayload} payload - 统一路由参数
   */
  executeRoute(payload) {
    if (!payload || !payload.route) return

    // 显示来源信息（教学演示用）
    const sourceLabels = {
      scheme: 'URL Scheme',
      universal_link: 'Universal Link',
      deeplink_service: 'DeepLink服务',
      token: 'Token二维码',
      native: 'Native参数'
    }
    const label = sourceLabels[payload.source] || payload.source

    // 在路由参数中附加来源信息，方便结果页展示
    const query = {
      ...payload.query,
      _source: label
    }

    navigateToRoute(payload.route, query)
  }

  /**
   * 手动处理 Token 解析（方案六）
   * App 扫码获取 token 后，请求服务端获取路由
   *
   * @param {string} token - Token 值
   */
  async handleToken(token) {
    try {
      const url = `${BASE_URL}/api/token/${token}`
      const routeInfo = await fetchRouteInfo(url)

      this.executeRoute({
        route: routeInfo.route,
        query: routeInfo.query,
        source: 'token',
        raw: token
      })
    } catch (e) {
      console.error('[DeepLinkManager] Token 解析失败:', e)
      uni.showToast({ title: 'Token 无效或已过期', icon: 'none' })
    }
  }

  /**
   * 手动处理短链解析
   * @param {string} code - 短链 code
   */
  async handleShortLink(code) {
    try {
      const url = `${BASE_URL}/api/shortlink/${code}`
      const routeInfo = await fetchRouteInfo(url)

      this.executeRoute({
        route: routeInfo.route,
        query: routeInfo.query,
        source: 'shortlink',
        raw: code
      })
    } catch (e) {
      console.error('[DeepLinkManager] 短链解析失败:', e)
      uni.showToast({ title: '短链无效', icon: 'none' })
    }
  }

  // ============================================
  // 内部方法
  // ============================================

  /**
   * 将 Scheme path 映射到 uni-app 路由
   * scanjump://page/detail?id=123 → /pages/detail/detail?id=123
   */
  _pathToRoute(path) {
    if (!path) return '/pages/result/result'

    // 移除开头的 page/ 前缀（如果有）
    const cleanPath = path.replace(/^page\//, '')

    // 映射到 uni-app 路由格式
    return `/pages/${cleanPath}/${cleanPath}`
  }

  /**
   * 解析 HTTPS URL（Universal Link / App Link）
   */
  _parseHttpsUrl(url) {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname.replace(/^\//, '')
      const query = {}
      urlObj.searchParams.forEach((value, key) => {
        query[key] = value
      })

      return {
        route: this._pathToRoute(path),
        query,
        source: 'universal_link',
        raw: url
      }
    } catch (e) {
      return null
    }
  }
}

// 导出单例
export const DeepLinkManager = new DeepLinkManagerClass()
