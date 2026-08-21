/**
 * Token 解析路由
 *
 * 教学要点：
 * - Token 二维码的安全性：二维码只含 token，不含业务信息
 * - 支持过期时间、权限控制
 * - 生产环境通常配合加密签名
 */
const express = require('express')
const router = express.Router()
const mockData = require('../data/mock.json')

/**
 * GET /api/token/:token
 *
 * 根据 Token 解析出目标路由和参数
 *
 * 请求：GET /api/token/token_abc123
 * 响应：{
 *   success: true,
 *   data: {
 *     route: "/pages/detail/detail",
 *     query: { id: 2001, from: "token" },
 *     desc: "Token二维码示例1"
 *   }
 * }
 */
router.get('/token/:token', (req, res) => {
  const { token } = req.params
  const tokenData = mockData.tokens[token]

  if (!tokenData) {
    return res.status(404).json({
      success: false,
      message: `Token ${token} 无效`
    })
  }

  // 检查是否过期
  if (tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date()) {
    return res.status(410).json({
      success: false,
      message: 'Token 已过期',
      expiredAt: tokenData.expiresAt
    })
  }

  console.log(`[Token解析] token=${token} → route=${tokenData.route}`)

  res.json({
    success: true,
    data: {
      route: tokenData.route,
      query: tokenData.query,
      desc: tokenData.desc,
      expiresAt: tokenData.expiresAt
    }
  })
})

module.exports = router
