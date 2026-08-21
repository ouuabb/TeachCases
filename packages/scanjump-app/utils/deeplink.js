/**
 * DeepLink 核心工具函数
 *
 * 教学要点：
 * - 环境检测（App / H5 / 微信 / 小程序）
 * - Scheme 唤起尝试
 * - HTTP 请求封装
 */

/**
 * 检测当前运行环境
 * @returns {object} 环境信息
 *
 * 示例：
 * detectEnvironment()
 * → {
 *     isApp: true,
 *     isH5: false,
 *     isWechat: false,
 *     isMiniProgram: false,
 *     platform: 'ios'
 *   }
 */
export function detectEnvironment() {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform // 'ios' | 'android'
  return {
    isApp: true,
    isH5: false,
    isWechat: false,
    isMiniProgram: false,
    platform
  }
  // #endif

  // #ifdef H5
  const ua = navigator.userAgent.toLowerCase()
  return {
    isApp: false,
    isH5: true,
    isWechat: /micromessenger/i.test(ua),
    isMiniProgram: false,
    platform: /iphone|ipad|ipod/i.test(ua) ? 'ios' : 'android'
  }
  // #endif

  // #ifdef MP-WEIXIN
  return {
    isApp: false,
    isH5: false,
    isWechat: true,
    isMiniProgram: true,
    platform: 'unknown'
  }
  // #endif

  // 默认返回
  return {
    isApp: false,
    isH5: true,
    isWechat: false,
    isMiniProgram: false,
    platform: 'unknown'
  }
}

/**
 * 尝试通过 Scheme 唤起 App
 * @param {string} schemeUrl - Scheme URL（如 'scanjump://page/detail?id=123'）
 * @returns {boolean} 是否成功发起唤起
 *
 * 教学要点：
 * - H5 页面通过 location.href 触发 Scheme
 * - iframe 方式作为补充（部分浏览器需要）
 * - 无法 100% 确定是否唤起成功（页面会暂停）
 */
export function tryOpenScheme(schemeUrl) {
  // #ifdef H5
  if (!schemeUrl) return false

  console.log('[DeepLink] 尝试 Scheme 唤起:', schemeUrl)

  // 方法1：location.href（最通用）
  window.location.href = schemeUrl

  // 方法2：iframe（补充兼容）
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = schemeUrl
  document.body.appendChild(iframe)

  // 3秒后清理（如果 App 未安装，页面不会暂停）
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }, 3000)

  return true
  // #endif

  return false
}

/**
 * 请求后端 API 获取路由信息
 * @param {string} url - API 地址
 * @param {object} options - 请求选项
 * @returns {Promise<object>} 路由信息
 */
export function fetchRouteInfo(url, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          resolve(res.data.data)
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 执行页面跳转
 * @param {string} route - 目标路由（如 '/pages/detail/detail'）
 * @param {object} query - 查询参数
 * @param {object} options - 跳转选项（redirect: boolean）
 *
 * 教学要点：
 * - uni.navigateTo：保留当前页面，入栈新页面
 * - uni.redirectTo：关闭当前页面，跳转新页面
 * - uni.reLaunch：关闭所有页面，打开新页面
 */
export function navigateToRoute(route, query = {}, options = {}) {
  // 构建 URL 参数字符串
  const queryStr = Object.entries(query)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

  const url = queryStr ? `${route}?${queryStr}` : route

  console.log('[DeepLink] 页面跳转:', url)

  if (options.redirect) {
    uni.redirectTo({ url })
  } else if (options.reLaunch) {
    uni.reLaunch({ url })
  } else {
    uni.navigateTo({ url })
  }
}
