/**
 * ScanJumpApp 模拟后端服务
 *
 * 教学要点：
 * - 为前端提供短链解析、Token 解析、DeepLink 策略等 API
 * - 提供 .well-known 文件服务（Universal Link / App Link 验证）
 * - 提供 H5 中转页静态文件
 *
 * 启动方式：npm run server
 * 默认端口：3000
 */
const express = require('express')
const cors = require('cors')
const path = require('path')

const shortlinkRouter = require('./routes/shortlink')
const tokenRouter = require('./routes/token')
const deeplinkRouter = require('./routes/deeplink')

const app = express()
const PORT = process.env.PORT || 3000

// ============================================
// 中间件配置
// ============================================

// 跨域 — 允许 uni-app H5 端访问
app.use(cors())

// JSON 解析
app.use(express.json())

// 静态文件服务
// - .well-known 目录：Universal Link / App Link 域名验证必须
// - /open 目录：H5 中转页
app.use('/.well-known', express.static(path.join(__dirname, 'public', '.well-known')))
app.use('/open', express.static(path.join(__dirname, 'public', 'open')))

// ============================================
// API 路由
// ============================================

app.use('/api', shortlinkRouter)
app.use('/api', tokenRouter)
app.use('/api', deeplinkRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================================
// 启动服务
// ============================================

app.listen(PORT, () => {
  console.log('============================================')
  console.log('  ScanJumpApp 模拟后端服务')
  console.log(`  地址: http://localhost:${PORT}`)
  console.log('============================================')
  console.log('API 接口:')
  console.log(`  GET  /api/shortlink/:code  短链解析`)
  console.log(`  GET  /api/token/:token    Token解析`)
  console.log(`  POST /api/deeplink/resolve DeepLink策略`)
  console.log(`  GET  /api/health          健康检查`)
  console.log('============================================')
  console.log('静态文件:')
  console.log(`  /.well-known/             Apple/Android验证文件`)
  console.log(`  /open/                    H5中转页`)
  console.log('============================================')
})
