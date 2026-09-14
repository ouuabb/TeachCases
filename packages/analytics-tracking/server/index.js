import express from 'express'
import cors from 'cors'
import { trackRoutes } from './routes/track.js'
import { analyticsRoutes } from './routes/analytics.js'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// 埋点数据接收接口
app.use('/api/track', trackRoutes)

// 数据查询接口（供看板使用）
app.use('/api/analytics', analyticsRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`[Server] 埋点数据服务已启动: http://localhost:${PORT}`)
  console.log(`[Server] 数据接收: POST http://localhost:${PORT}/api/track`)
  console.log(`[Server] 数据查询: GET  http://localhost:${PORT}/api/analytics/events`)
})
