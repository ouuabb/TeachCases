# 方案三：H5 中转页 + Scheme

## 原理

国内 App 常见方案。二维码链接到 HTTPS 中转页，H5 页面检测环境后尝试 Scheme 唤起 App，未安装时显示下载引导。

```
二维码(https://app.example.com/open?id=123)
  ↓
浏览器打开 H5 中转页
  ↓
H5 检测环境（App/微信/浏览器）
  ↓
尝试 location.href = "scanjump://..." 唤起
  ↓
已安装 → App 打开
未安装 → 显示下载按钮
```

## 系统机制

1. **环境检测**：通过 UserAgent 判断运行环境
2. **Scheme 唤起**：`location.href` 或 `iframe.src` 尝试打开自定义协议
3. **超时检测**：如果 App 未安装，页面不会暂停，3秒后显示下载引导
4. **兜底策略**：提供应用市场下载链接

## 配置步骤

### 1. 创建 H5 中转页

```
server/public/open/index.html
```

### 2. 中转页核心逻辑

```js
// 检测环境
const ua = navigator.userAgent.toLowerCase()
const isWechat = /micromessenger/i.test(ua)
const isIOS = /iphone|ipad|ipod/i.test(ua)

// 构建 Scheme URL
const schemeUrl = `scanjump://page/detail?id=${targetId}`

// 尝试唤起
function openApp() {
  if (isWechat) {
    // 微信内无法唤起，提示右上角浏览器打开
    return
  }

  window.location.href = schemeUrl

  // iframe 兼容
  const iframe = document.createElement('iframe')
  iframe.src = schemeUrl
  document.body.appendChild(iframe)

  // 3秒后检测（如果 App 未安装，页面继续执行）
  setTimeout(() => {
    showDownload()
  }, 3000)
}
```

### 3. 下载引导

```js
function downloadApp() {
  if (isIOS) {
    window.location.href = 'https://apps.apple.com/app/scanjump/id...'
  } else {
    window.location.href = 'https://download.example.com'
  }
}
```

## 核心代码

```html
<!-- H5 中转页 -->
<view class="card">
  <text class="title">ScanJump</text>
  <text class="desc">正在尝试打开 App...</text>
  <button @click="openApp">打开 App</button>
  <button @click="downloadApp">下载 App</button>
</view>
```

## 测试方式

1. **直接访问**：在浏览器中打开 `http://localhost:3000/open?id=123&page=detail`
2. **扫码测试**：扫描包含中转页链接的二维码
3. **微信测试**：在微信中打开链接，验证提示信息

## 优缺点

| 优点 | 缺点 |
|------|------|
| 兼容性最好 | 需要服务器 |
| 可实现未安装下载 | 多一次跳转 |
| 国内主流方案 | 部分浏览器拦截 Scheme |
| 不依赖域名验证 | 无法 100% 确认唤起成功 |

## 适用场景

- 国内 Android 应用
- 需要覆盖未安装用户的场景
- 不想配置 Universal Link 的项目
- 对兼容性要求高的场景
