import { User } from '../types/auth'

/**
 * 用户存储服务
 *
 * 注意：这是教学实现，使用内存 Map 存储用户数据
 * 生产环境应该使用数据库（如 MySQL、MongoDB）
 */
class UserStore {
  private users: Map<string, User> = new Map()
  private nextId: number = 1

  /**
   * 根据 openid 查找用户
   */
  findByOpenid(openid: string): User | undefined {
    return this.users.get(openid)
  }

  /**
   * 根据 ID 查找用户
   */
  findById(id: number): User | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user
      }
    }
    return undefined
  }

  /**
   * 创建新用户
   */
  create(openid: string): User {
    const user: User = {
      id: this.nextId++,
      openid,
      createdAt: new Date()
    }
    this.users.set(openid, user)
    return user
  }

  /**
   * 查找或创建用户
   * 如果用户不存在则创建，存在则返回
   */
  findOrCreate(openid: string): User {
    let user = this.findByOpenid(openid)
    if (!user) {
      user = this.create(openid)
    }
    return user
  }
}

export const userStore = new UserStore()
