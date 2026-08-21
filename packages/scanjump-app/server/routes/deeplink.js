/**
 * 模拟 DeepLink 服务路由
 *
 * 教学要点：
 * - 第三方 DeepLink 服务（极光、个推等）的核心逻辑
 * - 服务端决定使用什么方式唤醒 App（Scheme / Universal Link）
 * - 提供未安装时的兜底策略
 */
const express = require('express')
const router = express.Router()
const mockData = require('../data/mock.json')

/**
 * POST /api/deeplink/resolve
 *
 * 接收一个链接，返回唤醒策略
 *
 * 请求体：{
 *   url: "https://app.example.com/q/abc123",
 *   platform: "android" | "ios"
 * }
 *
 * 响应：{
 *   success: true,
 *   data: {
 *     method: "scheme" | "universallink",
 *     scheme: "scanjump://page/detail?id=123",
 *     universalLink: "https://app.example.com/detail?id=123",
 *     fallback: "https://app.example.com/download"
 *   }
 * }
 */
router.post('/deeplink/resolve', (req, res) => {
  const { url, platform = 'android' } = req.body

  if (!url) {
    return res.status(400).json({
      success: false,
      message: '缺少 url 参数'
    })
  }

  // 模拟：从 URL 中提取参数，生成唤醒策略
  // 生产环境中这里会查数据库、做权限校验、统计渠道等
  const strategy = mockData.deeplinkStrategies.default

  const result = {
    method: strategy.method,
    scheme: `${strategy.scheme}page/detail?id=123`,
    universalLink: `${strategy.fallback}?id=123`,
    fallback: `${strategy.fallback}/download?url=${encodeURIComponent(url)}`,
    // 附加信息
    platform,
    sourceUrl: url,
    resolvedAt: new Date().toISOString()
  }

  console.log(`[DeepLink解析] url=${url} platform=${platform} → method=${result.method}`)

  res.json({
    success: true,
    data: result
  })
})

module.exports = router
