/**
 * 全局配置文件
 *
 * 教学要点：
 * - 所有方案共用的配置项集中管理
 * - 修改 Scheme 名、域名等只需改这一个文件
 * - 生产环境应区分 development / production
 */

// ============================================
// Scheme 配置（方案一）
// ============================================

/** 自定义 URL Scheme 协议名，需与 manifest.json 中一致 */
export const SCHEME_NAME = 'scanjump'

// ============================================
// 域名配置（方案二/三/五/六）
// ============================================

/** App 关联的域名（Universal Link / App Link 验证域名） */
export const DOMAIN = 'app.example.com'

/** 后端 API 地址 */
export const BASE_URL = 'http://localhost:3000'

// ============================================
// 二维码配置
// ============================================

/** 二维码生成尺寸（像素） */
export const QR_SIZE = 300

// ============================================
// 工具函数
// ============================================

/**
 * 构建 URL Scheme
 * @param {string} path - 路径，如 'page/detail'
 * @param {object} query - 查询参数，如 { id: 123 }
 * @returns {string} 完整的 Scheme URL
 *
 * 示例：
 * buildScheme('page/detail', { id: 123 })
 * → 'scanjump://page/detail?id=123'
 */
export function buildScheme(path, query = {}) {
  const queryStr = Object.entries(query)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return `${SCHEME_NAME}://${path}${queryStr ? '?' + queryStr : ''}`
}

/**
 * 构建 HTTPS 链接
 * @param {string} path - 路径，如 '/detail'
 * @param {object} query - 查询参数
 * @returns {string} 完整的 HTTPS URL
 *
 * 示例：
 * buildHttpsLink('/detail', { id: 123 })
 * → 'https://app.example.com/detail?id=123'
 */
export function buildHttpsLink(path, query = {}) {
  const queryStr = Object.entries(query)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return `https://${DOMAIN}${path}${queryStr ? '?' + queryStr : ''}`
}

/**
 * 构建短链 URL
 * @param {string} code - 短链 code
 * @returns {string} 完整的短链 URL
 */
export function buildShortLink(code) {
  return `${BASE_URL}/api/shortlink/${code}`
}

/**
 * 构建 Token 二维码 URL
 * @param {string} token - Token 值
 * @returns {string} 完整的 Token URL
 */
export function buildTokenUrl(token) {
  return `${BASE_URL}/q/${token}`
}
