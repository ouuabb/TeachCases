# 方案五：第三方 DeepLink 服务

## 原理

使用第三方服务（极光、个推等）管理 DeepLink。核心是中间层路由决策：客户端发送链接到服务端，服务端返回唤醒策略。

```
二维码(https://短链.com/a8sd)
  ↓
客户端请求 DeepLink 服务
  ↓
服务端查询数据库，获取路由配置
  ↓
服务端判断设备平台（iOS/Android）
  ↓
返回唤醒策略（scheme/universallink/fallback）
  ↓
客户端执行策略，唤起 App
```

## 系统机制

1. **短链服务**：将长链接转为短链接
2. **路由决策**：根据设备、平台、渠道决定唤醒方式
3. **数据统计**：记录扫码次数、渠道来源、转化率
4. **动态修改**：可以随时修改链接目标

## 配置步骤

### 1. 选择服务商

- 极光 DeepLink
- 个推 Link
- 自建服务（Express 模拟）

### 2. 创建短链

在服务商后台创建短链，关联到目标路由。

### 3. App 接收参数

```js
onShow() {
  const args = plus.runtime.arguments
  if (args) {
    // 根据服务返回的策略执行
    // scheme: scanjump://page/detail?id=123
    // universallink: https://app.example.com/detail?id=123
    uni.navigateTo({ url: '/pages/detail/detail?id=123' })
  }
}
```

## 核心代码

```js
// Express 模拟 DeepLink 服务
app.post('/api/deeplink/resolve', (req, res) => {
  const { url, platform } = req.body

  // 查询数据库获取路由配置
  const route = db.getRoute(url)

  // 返回唤醒策略
  res.json({
    method: platform === 'ios' ? 'universallink' : 'scheme',
    scheme: `scanjump://${route.path}?${route.query}`,
    universalLink: `https://app.example.com/${route.path}?${route.query}`,
    fallback: 'https://app.example.com/download'
  })
})
```

## 测试方式

1. 启动 Express 后端：`npm run server`
2. 在 App 中调用 API 获取唤醒策略
3. 根据返回策略执行跳转

## 优缺点

| 优点 | 缺点 |
|------|------|
| 数据统计能力强 | 依赖第三方服务 |
| 支持渠道分析 | 有服务费用 |
| 可动态修改目标 | 需要网络请求 |
| 开发成本低 | 数据安全风险 |

## 适用场景

- 商业 App
- 需要数据分析的场景
- 多渠道推广
- 不想自建服务的团队
