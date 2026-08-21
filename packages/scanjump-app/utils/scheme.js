/**
 * URL Scheme 解析工具
 *
 * 教学要点：
 * - Scheme URL 格式：scheme://path?key=value&key2=value2
 * - 解析出 path 和 query 参数
 * - 用于 App 启动后从 plus.runtime.arguments 中提取信息
 */

/**
 * 解析 Scheme URL
 * @param {string} schemeUrl - 完整的 Scheme URL
 * @returns {object} { path: string, query: object, raw: string }
 *
 * 示例：
 * parseScheme('scanjump://page/detail?id=123&type=article')
 * → {
 *     path: 'page/detail',
 *     query: { id: '123', type: 'article' },
 *     raw: 'scanjump://page/detail?id=123&type=article'
 *   }
 */
export function parseScheme(schemeUrl) {
  if (!schemeUrl || typeof schemeUrl !== 'string') {
    return { path: '', query: {}, raw: '' }
  }

  // 去掉 scheme 前缀（如 scanjump://）
  // 匹配 scheme:// 后面的部分
  const schemeMatch = schemeUrl.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/(.*)/)
  if (!schemeMatch) {
    return { path: schemeUrl, query: {}, raw: schemeUrl }
  }

  const remainder = schemeMatch[1]

  // 分离 path 和 query
  const questionMarkIndex = remainder.indexOf('?')
  const path = questionMarkIndex >= 0
    ? remainder.substring(0, questionMarkIndex)
    : remainder

  const queryString = questionMarkIndex >= 0
    ? remainder.substring(questionMarkIndex + 1)
    : ''

  // 解析 query 参数
  const query = {}
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=')
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || '')
      }
    })
  }

  return { path, query, raw: schemeUrl }
}

/**
 * 构建 Scheme URL
 * @param {string} scheme - 协议名（如 'scanjump'）
 * @param {string} path - 路径
 * @param {object} query - 查询参数
 * @returns {string} 完整的 Scheme URL
 */
export function buildSchemeUrl(scheme, path, query = {}) {
  const queryStr = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return `${scheme}://${path}${queryStr ? '?' + queryStr : ''}`
}

/**
 * 从 Native Scheme 中提取参数
 * 适用于 Android Intent Scheme / iOS URL Types
 * @param {string} raw - 原始参数字符串
 * @returns {object} 解析后的参数
 */
export function parseNativeArgs(raw) {
  if (!raw) return {}

  // 如果是 URL 格式，用 parseScheme 解析
  if (raw.includes('://')) {
    return parseScheme(raw)
  }

  // 其他格式尝试 JSON 解析
  try {
    return JSON.parse(raw)
  } catch (e) {
    return { raw }
  }
}
