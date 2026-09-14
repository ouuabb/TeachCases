/**
 * Excel 导入导出教学项目 — 服务端入口
 *
 * 功能：
 *   1. POST /api/import/excel   — 上传 Excel 文件并导入数据
 *   2. GET  /api/export/excel   — 导出数据为 Excel 文件
 *   3. GET  /api/export/template — 下载导入模板
 *   4. GET  /api/data           — 查询当前数据
 *   5. DELETE /api/data/:id     — 删除单条数据
 */

import express from 'express'
import cors from 'cors'
import { importRoutes } from './routes/import.js'
import { exportRoutes } from './routes/export.js'
import { dataRoutes } from './routes/data.js'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// 路由
app.use('/api/import', importRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/data', dataRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`[Server] Excel 教学服务已启动: http://localhost:${PORT}`)
  console.log(`[Server] 导入: POST http://localhost:${PORT}/api/import/excel`)
  console.log(`[Server] 导出: GET  http://localhost:${PORT}/api/export/excel`)
})
