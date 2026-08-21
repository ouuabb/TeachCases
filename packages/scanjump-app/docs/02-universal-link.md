# 方案二：Universal Link / App Link

## 原理

这是移动互联网标准方案。二维码放 HTTPS 链接，系统检测该域名是否绑定了 App：
- 已安装：直接打开 App
- 未安装：打开网页

```
二维码(https://app.example.com/detail?id=123)
  ↓
手机扫码，浏览器打开 HTTPS 链接
  ↓
系统检测域名绑定关系
  ↓
已安装 App → 自动唤起 App
未安装 App → 打开网页
```

## 系统机制

### iOS Universal Links
- 需要在 Apple Developer 启用 Associated Domains
- App 配置 `applinks:app.example.com` 域名
- 服务器放置 `apple-app-site-association` 验证文件
- iOS 系统会自动检查域名绑定，匹配后直接打开 App

### Android App Links
- 需要 Android 6.0+ (API 23+)
- App 配置 Intent Filter 指向 HTTPS 域名
- 服务器放置 `assetlinks.json` 验证文件
- Android 系统自动验证并打开 App

## 配置步骤

### 1. 服务器放置验证文件

**iOS: `/.well-known/apple-app-site-association`**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.scanjump.app",
        "paths": ["/detail/*", "/open/*"]
      }
    ]
  }
}
```

**Android: `/.well-known/assetlinks.json`**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.scanjump.app",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  }
]
```

### 2. manifest.json 配置

```json
{
  "app-plus": {
    "distribute": {
      "ios": {
        "universalLinks": ["https://app.example.com/ul/"]
      },
      "android": {
        "intentFilters": [
          {
            "action": "android.intent.action.VIEW",
            "data": { "scheme": "https", "host": "app.example.com" }
          }
        ]
      }
    }
  }
}
```

### 3. App 接收参数

```js
onShow() {
  const args = plus.runtime.arguments
  if (args && args.startsWith('https://')) {
    // args 格式：https://app.example.com/detail?id=123
    const url = new URL(args)
    const id = url.searchParams.get('id')
    uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
}
```

## 核心代码

```js
// utils/deeplink.js
export function parseUniversalLink(url) {
  const urlObj = new URL(url)
  return {
    path: urlObj.pathname,
    query: Object.fromEntries(urlObj.searchParams)
  }
}
```

## 测试方式

1. **验证文件**：访问 `https://app.example.com/.well-known/apple-app-site-association` 确认文件可访问
2. **真机测试**：iPhone Safari 扫描二维码，测试是否自动打开 App
3. **Android**：使用 `adb shell am start -a android.intent.action.VIEW -d "https://app.example.com/detail?id=123"`

## 优缺点

| 优点 | 缺点 |
|------|------|
| 微信扫码 ✅ | 需要域名 + HTTPS |
| 浏览器扫码 ✅ | 需要服务端配置验证文件 |
| 未安装打开网页 ✅ | 配置较复杂 |
| 最完整方案 | 需要 Apple/Google 开发者账号 |

## 适用场景

- 正式商业 App 首选
- 需要覆盖微信扫码场景
- 用户群体包含未安装用户
- 生产级应用
