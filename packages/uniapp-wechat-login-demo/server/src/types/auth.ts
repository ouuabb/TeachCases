export interface WechatLoginResult {
  openid: string
  session_key: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

export interface User {
  id: number
  openid: string
  createdAt: Date
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    openid: string
  }
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}
