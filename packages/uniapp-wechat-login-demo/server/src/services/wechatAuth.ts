import axios from 'axios'
import { config } from '../config/env'
import { WechatLoginResult } from '../types/auth'

/**
 * 微信登录服务
 * 负责与微信官方接口交互，完成 code -> openid/session_key 的换取
 */
export class WechatAuthService {
  /**
   * 使用 code 换取 openid 和 session_key
   * 这个操作必须在服务端完成，因为需要 AppSecret
   */
  async code2Session(code: string): Promise<WechatLoginResult> {
    const { appId, appSecret, loginUrl } = config.wechat

    if (!appId || !appSecret) {
      throw new Error('微信 AppID 或 AppSecret 未配置，请检查 .env 文件')
    }

    const response = await axios.get<WechatLoginResult>(loginUrl, {
      params: {
        appid: appId,
        secret: appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const result = response.data

    if (result.errcode) {
      throw new Error(`微信登录失败: ${result.errmsg} (${result.errcode})`)
    }

    return result
  }
}

export const wechatAuthService = new WechatAuthService()
