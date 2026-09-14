/**
 * ================================================================
 *   前端埋点 SDK (Tracker)
 * ================================================================
 *
 * 这是整个教学项目的核心模块。它封装了：
 *
 *   1. 事件采集 — 自动/手动采集用户行为
 *   2. 数据加工 — 补充公共属性（设备信息、会话ID等）
 *   3. 数据上报 — 支持 Beacon API、XHR、Fetch 三种方式
 *   4. 离线缓存 — 网络断开时暂存本地，恢复后重发
 *   5. 采样控制 — 按比例采样，降低服务端压力
 *
 * 使用方式:
 *   import { tracker } from './sdk/tracker.js'
 *   tracker.init({ appId: 'my-app', reportUrl: '/api/track' })
 *   tracker.track('button_click', { buttonName: '购买' })
 */

// ============================================================
//  工具函数
// ============================================================

/**
 * 生成 UUID v4 (简化版，用于 sessionId / 消息ID)
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 获取当前时间戳 (ISO 格式)
 */
function now() {
  return new Date().toISOString()
}

/**
 * 检测是否在浏览器环境
 */
function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

// ============================================================
//  设备信息采集模块
// ============================================================

/**
 * 采集浏览器和设备信息
 * 这些信息通常作为"公共属性"附加到每条事件上
 */
function collectDeviceInfo() {
  if (!isBrowser()) return {}

  const nav = navigator
  const screen = window.screen

  return {
    // 浏览器信息
    userAgent: nav.userAgent,
    language: nav.language,
    platform: nav.platform,

    // 屏幕信息
    screenWidth: screen.width,
    screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,

    // 页面位置
    referrer: document.referrer || '',
    title: document.title
  }
}

/**
 * 解析 URL 参数
 */
function parseUrlParams() {
  if (!isBrowser()) return {}
  const params = new URLSearchParams(window.location.search)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// ============================================================
//  离线缓存模块
// ============================================================

/**
 * 离线事件队列
 * 当网络不可用时，事件暂存到 localStorage
 * 网络恢复后批量上报
 */
class OfflineQueue {
  constructor(storageKey = '_tracker_offline_queue', maxSize = 500) {
    this.storageKey = storageKey
    this.maxSize = maxSize
  }

  /**
   * 从 localStorage 读取缓存事件
   */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  /**
   * 保存事件到 localStorage
   */
  save(events) {
    try {
      // 超出上限时截断旧数据
      if (events.length > this.maxSize) {
        events = events.slice(-this.maxSize)
      }
      localStorage.setItem(this.storageKey, JSON.stringify(events))
    } catch (e) {
      console.warn('[Tracker] 离线缓存写入失败:', e)
    }
  }

  /**
   * 添加一条事件
   */
  push(event) {
    const events = this.load()
    events.push(event)
    this.save(events)
  }

  /**
   * 取出所有缓存事件并清空
   */
  drain() {
    const events = this.load()
    this.save([])
    return events
  }

  /**
   * 缓存中的事件数量
   */
  get size() {
    return this.load().length
  }
}

// ============================================================
//  采样器模块
// ============================================================

/**
 * 采样控制
 *
 * 生产环境中，高流量页面不可能上报所有事件。
 * 通过采样率控制上报比例：
 *   - sampleRate: 0~1 之间，1 表示 100% 上报
 *   - 使用 sessionId hash 保证同一会话的采样一致性
 */
class Sampler {
  constructor(sampleRate = 1) {
    this.sampleRate = Math.max(0, Math.min(1, sampleRate))
  }

  /**
   * 判断当前是否应该采样
   * 基于 sessionId 的 hash 值，保证同一会话内结果一致
   */
  shouldSample(sessionId) {
    if (this.sampleRate >= 1) return true
    if (this.sampleRate <= 0) return false

    // 简单 hash 函数
    let hash = 0
    for (let i = 0; i < sessionId.length; i++) {
      hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0
    }
    const ratio = (Math.abs(hash) % 10000) / 10000
    return ratio < this.sampleRate
  }
}

// ============================================================
//  主追踪器类
// ============================================================

class Tracker {
  constructor() {
    this.config = {
      appId: '',
      reportUrl: '/api/track',
      batchUrl: '/api/track/batch',
      sampleRate: 1,
      maxBatchSize: 10,
      flushInterval: 5000,     // 批量上报间隔(ms)
      enableOffline: true,     // 是否启用离线缓存
      enableAutoPV: true,      // 是否自动上报页面浏览(PV)
      enableAutoClick: false,  // 是否自动采集点击事件
    }

    this.sessionId = ''
    this.userId = ''
    this.queue = []            // 内存中的上报队列
    this.offlineQueue = new OfflineQueue()
    this.sampler = new Sampler(1)
    this公共属性 = {}           // 公共属性，每条事件都会携带
    this.flushTimer = null
    this.initialized = false
  }

  /**
   * 初始化追踪器
   *
   * @param {Object} config - 配置项
   * @param {string} config.appId - 应用标识
   * @param {string} config.reportUrl - 单条上报地址
   * @param {string} config.batchUrl - 批量上报地址
   * @param {number} config.sampleRate - 采样率 (0~1)
   * @param {boolean} config.enableOffline - 是否启用离线缓存
   * @param {boolean} config.enableAutoPV - 是否自动上报 PV
   * @param {boolean} config.enableAutoClick - 是否自动采集点击
   */
  init(config = {}) {
    if (this.initialized) {
      console.warn('[Tracker] 已经初始化过了')
      return
    }

    Object.assign(this.config, config)
    this.sampler = new Sampler(this.config.sampleRate)

    // 生成或恢复 sessionId
    this.sessionId = this._getOrCreateSessionId()

    // 设置公共属性
    this公共属性 = {
      appId: this.config.appId,
      ...collectDeviceInfo(),
      ...parseUrlParams()
    }

    // 监听网络变化，恢复离线事件
    if (this.config.enableOffline && isBrowser()) {
      window.addEventListener('online', () => this._flushOffline())
    }

    // 定时批量上报
    this.flushTimer = setInterval(() => this._flush(), this.config.flushInterval)

    // 自动 PV 上报
    if (this.config.enableAutoPV) {
      this._autoTrackPageView()
    }

    // 页面离开时确保数据上报
    if (isBrowser()) {
      window.addEventListener('beforeunload', () => this._flushBeforeUnload())
    }

    this.initialized = true
    console.log('[Tracker] 初始化完成', this.config)
  }

  /**
   * 核心方法：上报一条事件
   *
   * @param {string} eventName - 事件名称
   * @param {Object} props - 事件属性（自定义业务数据）
   * @param {Object} options - 额外选项
   */
  track(eventName, props = {}, options = {}) {
    if (!this.initialized) {
      console.error('[Tracker] 请先调用 init() 初始化')
      return
    }

    // 采样判断
    if (!this.sampler.shouldSample(this.sessionId)) {
      return
    }

    // 组装事件对象
    const event = {
      // 消息标识
      messageId: generateId(),

      // 事件核心字段
      eventType: options.eventType || 'custom',
      eventName,
      props,

      // 页面信息
      page: isBrowser() ? window.location.pathname : '',
      pageTitle: document?.title || '',

      // 用户 & 会话
      sessionId: this.sessionId,
      userId: this.userId || this公共属性.userId || '',

      // 时间戳
      timestamp: options.timestamp || now(),

      // 公共属性
      commonProps: { ...this公共属性 }
    }

    // 加入上报队列
    this.queue.push(event)

    // 如果队列满了，立即 flush
    if (this.queue.length >= this.config.maxBatchSize) {
      this._flush()
    }

    return event.messageId
  }

  /**
   * 便捷方法：上报页面浏览 (Page View)
   */
  trackPageView(page, props = {}) {
    return this.track('page_view', { page, ...props }, { eventType: 'page' })
  }

  /**
   * 便捷方法：上报点击事件
   */
  trackClick(elementName, props = {}) {
    return this.track('click', { elementName, ...props }, { eventType: 'click' })
  }

  /**
   * 便捷方法：上报曝光事件
   */
  trackExposure(elementName, props = {}) {
    return this.track('exposure', { elementName, ...props }, { eventType: 'exposure' })
  }

  /**
   * 便捷方法：上报自定义事件
   */
  trackEvent(eventName, props = {}) {
    return this.track(eventName, props, { eventType: 'custom' })
  }

  /**
   * 设置用户ID (用于跨设备追踪)
   */
  setUserId(userId) {
    this.userId = userId
    this公共属性.userId = userId
  }

  /**
   * 添加公共属性（每条事件都会携带）
   */
  setCommonProps(props) {
    Object.assign(this公共属性, props)
  }

  // ============================================================
  //  内部方法
  // ============================================================

  /**
   * 获取或创建 sessionId
   * 使用 sessionStorage，关闭浏览器标签页后失效
   */
  _getOrCreateSessionId() {
    if (!isBrowser()) return generateId()

    const KEY = '_tracker_session_id'
    let sessionId = sessionStorage.getItem(KEY)
    if (!sessionId) {
      sessionId = generateId()
      sessionStorage.setItem(KEY, sessionId)
    }
    return sessionId
  }

  /**
   * 批量上报队列中的事件
   */
  async _flush() {
    if (this.queue.length === 0) return

    // 取出所有待上报事件
    const events = this.queue.splice(0, this.queue.length)

    try {
      const useSendBeacon = isBrowser() && navigator.sendBeacon
      const useFetch = typeof fetch !== 'undefined'

      if (useSendBeacon) {
        // 方式 1: sendBeacon (最可靠，页面关闭时也能发送)
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' })
        const success = navigator.sendBeacon(this.config.batchUrl, blob)
        if (success) {
          console.log(`[Tracker] Beacon 上报 ${events.length} 条事件`)
          return
        }
      }

      if (useFetch) {
        // 方式 2: fetch API
        await fetch(this.config.batchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        })
        console.log(`[Tracker] Fetch 上报 ${events.length} 条事件`)
        return
      }

      // 方式 3: XMLHttpRequest fallback
      this._reportViaXHR(events)
    } catch (err) {
      console.warn('[Tracker] 上报失败，存入离线队列:', err)
      // 上报失败，存入离线缓存
      if (this.config.enableOffline) {
        events.forEach(e => this.offlineQueue.push(e))
      }
    }
  }

  /**
   * 页面关闭前的上报
   * 使用 sendBeacon 确保数据不丢失
   */
  _flushBeforeUnload() {
    if (this.queue.length === 0) return

    const events = this.queue.splice(0, this.queue.length)

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' })
      navigator.sendBeacon(this.config.batchUrl, blob)
    }
  }

  /**
   * 恢复离线缓存中的事件
   */
  async _flushOffline() {
    if (!this.config.enableOffline) return

    const offlineEvents = this.offlineQueue.drain()
    if (offlineEvents.length > 0) {
      console.log(`[Tracker] 网络恢复，上报 ${offlineEvents.length} 条离线事件`)
      try {
        await fetch(this.config.batchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: offlineEvents })
        })
      } catch (err) {
        // 写回离线队列
        offlineEvents.forEach(e => this.offlineQueue.push(e))
      }
    }
  }

  /**
   * XMLHttpRequest fallback 上报
   */
  _reportViaXHR(events) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', this.config.batchUrl, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify({ events }))
  }

  /**
   * 自动采集页面浏览 (PV)
   * 监听 popstate 和路由变化
   */
  _autoTrackPageView() {
    if (!isBrowser()) return

    // 首次加载时上报
    this.trackPageView(window.location.pathname)

    // 监听路由变化 (Vue Router 使用 popstate)
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname)
    })
  }
}

// ============================================================
//  导出单例
// ============================================================

export const tracker = new Tracker()

// 同时导出类，方便测试
export { Tracker }
