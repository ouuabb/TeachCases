/**
 * ========================================
 *   数据查询路由 (供看板使用)
 * ========================================
 *
 * 实际生产中，这里会对接 ClickHouse 等 OLAP 引擎。
 * 教学简化版直接查询内存存储。
 */

import { Router } from 'express'
import { store } from '../storage.js'

export const analyticsRoutes = Router()

/**
 * GET /api/analytics/events
 * 查询事件列表，支持筛选
 */
analyticsRoutes.get('/events', (req, res) => {
  const { eventType, eventName, startTime, endTime, limit } = req.query

  const events = store.query({
    eventType,
    eventName,
    startTime,
    endTime,
    limit: limit ? parseInt(limit) : 100
  })

  res.json({ success: true, data: events })
})

/**
 * GET /api/analytics/stats
 * 获取统计数据概览
 */
analyticsRoutes.get('/stats', (req, res) => {
  const stats = store.getStats()
  res.json({ success: true, data: stats })
})

/**
 * GET /api/analytics/events/:id
 * 查询单条事件详情
 */
analyticsRoutes.get('/events/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const events = store.query({ limit: id + 10 })
  const event = events.find(e => e.id === id)

  if (!event) {
    return res.status(404).json({ success: false, error: '事件不存在' })
  }

  res.json({ success: true, data: event })
})
