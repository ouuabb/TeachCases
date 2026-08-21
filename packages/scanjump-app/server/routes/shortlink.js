/**
 * 短链解析路由
 *
 * 教学要点：
 * - 短链服务的本质：code → 完整路由+参数 的映射
 * - 生产环境通常存数据库，这里用 JSON 模拟
 * - 支持过期时间、访问次数等扩展
 */
const express = require('express')
const router = express.Router()
const mockData = require('../data/mock.json')

/**
 * GET /api/shortlink/:code
 *
 * 根据短链 code 解析出目标路由和参数
 *
 * 请求：GET /api/shortlink/a8sd92
 * 响应：{
 *   success: true,
 *   data: {
 *     route: "/pages/detail/detail",
 *     query: { id: 1001, type: "article" },
 *     desc: "文章详情短链"
 *   }
 * }
 */
router.get('/shortlink/:code', (req, res) => {
  const { code } = req.params
  const linkData = mockData.shortlinks[code]

  if (!linkData) {
    return res.status(404).json({
      success: false,
      message: `短链 ${code} 不存在`
    })
  }

  // 生产环境中这里可以：记录访问次数、检查过期时间、权限校验
  console.log(`[短链解析] code=${code} → route=${linkData.route}`)

  res.json({
    success: true,
    data: {
      route: linkData.route,
      query: linkData.query,
      desc: linkData.desc
    }
  })
})

module.exports = router
