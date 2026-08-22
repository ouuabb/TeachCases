import { request } from '../utils/request'

interface LoginData {
  token: string
  user: {
    id: number
    openid: string
  }
}

interface UserData {
  id: number
  openid: string
  createdAt: string
}

/**
 * 微信登录
 * 将 code 发送到后端换取 token
 */
export function wxLogin(code: string) {
  return request<LoginData>({
    url: '/api/auth/login',
    method: 'POST',
    data: { code }
  })
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return request<UserData>({
    url: '/api/user/me',
    method: 'GET'
  })
}
