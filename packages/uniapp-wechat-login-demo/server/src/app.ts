import express from 'express'
import cors from 'cors'
import { config } from './config/env'
import authRoutes from './routes/auth'

const app = express()

// 中间件配置
app.use(cors())
app.use(express.json())

// 路由配置
app.use('/api/auth', authRoutes)
app.use('/api/user', authRoutes)

// 健康检查接口
app.get('/api/health', (_req, res) => {
  res.json({
    code: 200,
    message: 'Server is running',
    data: {
      appId: config.wechat.appId ? '已配置' : '未配置',
      timestamp: new Date().toISOString()
    }
  })
})

// 启动服务
app.listen(config.port, () => {
  console.log('========================================')
  console.log('  微信登录后端服务已启动')
  console.log(`  地址: http://localhost:${config.port}`)
  console.log(`  AppID: ${config.wechat.appId ? '已配置' : '⚠️  未配置'}`)
  console.log('========================================')
  console.log('')
  console.log('可用接口:')
  console.log(`  POST http://localhost:${config.port}/api/auth/login`)
  console.log(`  GET  http://localhost:${config.port}/api/user/me`)
  console.log(`  GET  http://localhost:${config.port}/api/health`)
  console.log('')
  console.log('提示: 请先复制 .env.example 为 .env 并填入微信 AppID 和 AppSecret')
})

export default app
