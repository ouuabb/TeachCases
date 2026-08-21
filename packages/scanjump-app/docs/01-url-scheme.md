# 方案一：URL Scheme

## 原理

URL Scheme 是最简单的 DeepLink 方案。给 App 注册一个自定义协议（如 `scanjump://`），二维码内容直接放 Scheme URL，扫码后系统找到对应 App 并唤起。

```
App 生成二维码(scanjump://page/detail?id=123)
  ↓
手机扫码
  ↓
系统识别 scanjump:// 协议
  ↓
找到已安装的 App
  ↓
启动 App 并传递参数
  ↓
App 解析参数，跳转页面
```

## 系统机制

### Android
- 在 `AndroidManifest.xml` 中注册 Intent Filter
- 声明 `<data android:scheme="scanjump" />`
- 系统通过 Intent 匹配找到 App

### iOS
- 在 Xcode 中配置 URL Types
- 添加自定义 Scheme
- 系统通过 URL Scheme 匹配找到 App

## 配置步骤

### 1. manifest.json 配置

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "schemes": ["scanjump"]
      },
      "ios": {
        "urltypes": [
          { "urlschemes": ["scanjump"] }
        ]
      }
    }
  }
}
```

### 2. App 接收参数

```js
// App.vue
onShow() {
  const args = plus.runtime.arguments
  if (args) {
    // args 格式：scanjump://page/detail?id=123
    // 解析参数并跳转
    uni.navigateTo({ url: '/pages/detail/detail?id=123' })
  }
}
```

### 3. 生成二维码

```js
// 二维码内容
const qrValue = 'scanjump://page/detail?id=123'
```

## 核心代码

```js
// utils/scheme.js
export function parseScheme(schemeUrl) {
  // scanjump://page/detail?id=123
  // → { path: 'page/detail', query: { id: '123' } }
  const match = schemeUrl.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/(.*)/)
  const remainder = match[1]
  // ... 解析 path 和 query
}
```

## 测试方式

1. **H5 端**：点击「测试 Scheme 跳转」按钮，尝试通过 `location.href` 唤起
2. **App 端**：真机运行，扫描包含 Scheme 的二维码
3. **命令行**：`adb shell am start -a android.intent.action.VIEW -d "scanjump://page/detail?id=123"`

## 优缺点

| 优点 | 缺点 |
|------|------|
| 实现最快 | 未安装 App 时无响应 |
| 不需要服务器 | 微信内扫码被限制 |
| 本地测试方便 | 安全性较低 |
| 适合内部系统 | URL 格式不够标准 |

## 适用场景

- 企业内部工具
- 已确认安装的用户群
- 开发测试阶段
- 不涉及外部用户的场景
