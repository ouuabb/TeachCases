/**
 * ========================================
 *   埋点数据接收路由
 * ========================================
 *
 * API 设计说明：
 *
 * 1. POST /api/track        — 单条上报
 * 2. POST /api/track/batch  — 批量上报
 *
 * 采用 Beacon API 兼容设计：
 *   - Content-Type: application/json (标准请求)
 *   - Content-Type: text/plain (Beacon fallback, 支持 sendBeacon)
 */

import { Router } from 'express'
import { store } from '../storage.js'

export const trackRoutes = Router()

/**
 * 单条事件上报
 *
 * 请求体示例:
 * {
 *   "eventType": "click",
 *   "eventName": "buy_button_click",
 *   "page": "/product/123",
 *   "props": { "productId": 123, "price": 99 },
 *   "timestamp": "2026-01-01T00:00:00.000Z",
 *   "sessionId": "abc-123",
 *   "userId": "user_001"
 * }
 */
trackRoutes.post('/', (req, res) => {
  try {
    const event = req.body

    // 基础字段校验
    if (!event.eventType || !event.eventName) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段: eventType, eventName'
      })
    }

    // 补充服务端信息
    event.clientIp = req.ip
    event.userAgent = req.headers['user-agent']

    const record = store.add(event)

    res.json({ success: true, id: record.id })
  } catch (err) {
    console.error('[Track] 存储失败:', err)
    res.status(500).json({ success: false, error: '服务端存储异常' })
  }
})

/**
 * 批量事件上报
 *
 * 用于处理离线缓存、队列积压的场景。
 * 前端 SDK 会在网络恢复时，将本地缓存的事件一次性上报。
 */
trackRoutes.post('/batch', (req, res) => {
  try {
    const { events } = req.body

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'events 必须是非空数组'
      })
    }

    if (events.length > 100) {
      return res.status(400).json({
        success: false,
        error: '单次批量上报不能超过 100 条'
      })
    }

    const records = store.addBatch(events.map(e => ({
      ...e,
      clientIp: req.ip,
      userAgent: req.headers['user-agent']
    })))

    res.json({ success: true, count: records.length })
  } catch (err) {
    console.error('[Track] 批量存储失败:', err)
    res.status(500).json({ success: false, error: '服务端批量存储异常' })
  }
})
