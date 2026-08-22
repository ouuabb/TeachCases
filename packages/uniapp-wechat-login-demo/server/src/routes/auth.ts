import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import { wechatAuthService } from '../services/wechatAuth'
import { userStore } from '../services/userStore'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

/**
 * POST /api/auth/login
 * 微信小程序登录接口
 *
 * 请求体: { code: string }
 * 响应: { token: string, user: { id, openid } }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { code } = req.body

    if (!code) {
      res.status(400).json({
        code: 400,
        message: '缺少登录凭证 code'
      })
      return
    }

    // 第一步：使用 code 向微信换取 openid 和 session_key
    const wechatResult = await wechatAuthService.code2Session(code)

    // 第二步：根据 openid 查找或创建用户
    const user = userStore.findOrCreate(wechatResult.openid)

    // 第三步：生成业务 token
    const token = jwt.sign(
      {
        userId: user.id,
        openid: user.openid
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    // 第四步：返回 token 和用户信息
    // 注意：绝对不能返回 session_key 给前端
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          openid: user.openid
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      code: 500,
      message: error instanceof Error ? error.message : '登录失败'
    })
  }
})

/**
 * GET /api/user/me
 * 获取当前登录用户信息
 * 需要在请求头中携带 Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = userStore.findById(req.userId!)

  if (!user) {
    res.status(404).json({
      code: 404,
      message: '用户不存在'
    })
    return
  }

  // 对 openid 进行脱敏处理，只展示部分
  const maskedOpenid = user.openid.slice(0, 6) + '****' + user.openid.slice(-4)

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      id: user.id,
      openid: maskedOpenid,
      createdAt: user.createdAt
    }
  })
})

export default router
