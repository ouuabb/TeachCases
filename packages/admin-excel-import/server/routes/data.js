/**
 * ========================================
 *   数据查询路由
 * ========================================
 *
 * 提供 CRUD 接口供前端表格展示使用
 */

import { Router } from 'express'
import { store } from '../storage.js'

export const dataRoutes = Router()

/**
 * GET /api/data
 * 查询数据列表（支持分页、搜索）
 */
dataRoutes.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword = '' } = req.query

  const result = store.query({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    keyword
  })

  res.json({ success: true, data: result })
})

/**
 * GET /api/data/:id
 * 查询单条记录
 */
dataRoutes.get('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const record = store.getById(id)

  if (!record) {
    return res.status(404).json({ success: false, error: '记录不存在' })
  }

  res.json({ success: true, data: record })
})

/**
 * DELETE /api/data/:id
 * 删除单条记录
 */
dataRoutes.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const success = store.deleteById(id)

  if (!success) {
    return res.status(404).json({ success: false, error: '记录不存在' })
  }

  res.json({ success: true })
})

/**
 * DELETE /api/data
 * 清空所有数据
 */
dataRoutes.delete('/', (req, res) => {
  store.clearAll()
  res.json({ success: true })
})
