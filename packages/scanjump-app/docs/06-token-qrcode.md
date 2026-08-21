# 方案六：Token 二维码

## 原理

企业级安全方案。二维码只含 Token，不含业务信息。App 扫码后请求服务端解析真实路由。

```
生成二维码(https://app.example.com/q/token_abc123)
  ↓
手机扫码
  ↓
App 获取 token 参数
  ↓
请求服务端 /api/token/token_abc123
  ↓
服务端验证 Token（过期/权限）
  ↓
返回 { route, query }
  ↓
App 跳转对应页面
```

## 系统机制

1. **Token 存储**：服务端存储 Token → 路由的映射
2. **安全验证**：支持过期时间、访问次数、权限控制
3. **动态修改**：修改 Token 关联的路由，二维码无需重新生成
4. **数据统计**：记录 Token 的使用情况

## 配置步骤

### 1. 服务端存储 Token 映射

```json
{
  "token_abc123": {
    "route": "/pages/detail/detail",
    "query": { "id": 2001 },
    "expiresAt": null
  }
}
```

### 2. 创建 Token 解析 API

```js
app.get('/api/token/:token', (req, res) => {
  const tokenData = db.getToken(req.params.token)

  if (!tokenData) {
    return res.status(404).json({ success: false, message: 'Token 无效' })
  }

  // 检查过期
  if (tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date()) {
    return res.status(410).json({ success: false, message: 'Token 已过期' })
  }

  res.json({ success: true, data: tokenData })
})
```

### 3. App 请求解析

```js
async function handleToken(token) {
  const res = await uni.request({
    url: `https://app.example.com/api/token/${token}`
  })

  if (res.data.success) {
    const { route, query } = res.data.data
    uni.navigateTo({ url: `${route}?${new URLSearchParams(query)}` })
  }
}
```

## 核心代码

```js
// core/deeplink-manager.js
async handleToken(token) {
  const url = `${BASE_URL}/api/token/${token}`
  const routeInfo = await fetchRouteInfo(url)

  this.executeRoute({
    route: routeInfo.route,
    query: routeInfo.query,
    source: 'token',
    raw: token
  })
}
```

## 测试方式

1. 启动 Express 后端：`npm run server`
2. 扫描 Token 二维码
3. App 请求 `/api/token/token_abc123` 获取路由
4. 验证跳转是否正确

## 优缺点

| 优点 | 缺点 |
|------|------|
| 安全性最高 | 开发成本高 |
| 支持过期控制 | 需要服务端支持 |
| 可动态修改目标 | 需要网络请求 |
| 适合企业级场景 | 二维码泄露无意义但 Token 需保护 |

## 适用场景

- 企业审批流程
- 登录二维码
- 支付二维码
- 需要权限控制的场景
- 安全要求高的系统
