import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'

export interface AuthRequest extends Request {
  userId?: number
  openid?: string
}

interface TokenPayload {
  userId: number
  openid: string
}

/**
 * 认证中间件
 * 验证请求头中的 JWT token
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未登录或 token 无效'
    })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload
    req.userId = decoded.userId
    req.openid = decoded.openid
    next()
  } catch {
    res.status(401).json({
      code: 401,
      message: 'token 已过期或无效'
    })
  }
}
