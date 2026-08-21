# ScanJumpApp — 扫码跳 App 路由教学案例

> 覆盖 6 种 DeepLink 技术方案的 uni-app 完整教学 Demo

## 功能简介

本项目是一个教学案例，演示了在 uni-app 中实现「App 内生成二维码 → 手机扫码 → 打开 App → 跳转指定路由」的完整链路。

覆盖的 6 种方案：

| # | 方案 | 适合场景 |
|---|------|---------|
| 1 | URL Scheme | 内部工具、测试阶段 |
| 2 | Universal Link / App Link | 生产级首选 |
| 3 | H5 中转页 + Scheme | 国内 Android 主流 |
| 4 | UniLink | uniCloud 生态 |
| 5 | 第三方 DeepLink 服务 | 商业 App |
| 6 | Token 二维码 | 企业级安全 |

## 技术栈

- **前端**：uni-app (Vue 3) + JavaScript
- **后端**：Express.js（模拟服务）
- **二维码**：qrcode (npm)
- **样式**：SCSS

## 项目结构

```
ScanJumpApp/
├── README.md                          # 项目总览（本文件）
├── docs/                              # 教学文档
│   ├── 01-url-scheme.md              # 方案一教程
│   ├── 02-universal-link.md          # 方案二教程
│   ├── 03-h5-redirect.md             # 方案三教程
│   ├── 04-unilink.md                 # 方案四教程
│   ├── 05-third-party-deeplink.md    # 方案五教程
│   ├── 06-token-qrcode.md            # 方案六教程
│   └── comparison.md                 # 方案对比总结
├── server/                            # Express 模拟后端
│   ├── index.js                       # 服务入口
│   ├── routes/
│   │   ├── shortlink.js              # 短链解析 API
│   │   ├── token.js                  # Token 解析 API
│   │   └── deeplink.js               # DeepLink 策略 API
│   ├── data/
│   │   └── mock.json                 # 模拟数据
│   └── public/
│       ├── .well-known/              # Universal Link 验证文件
│       │   ├── apple-app-site-association
│       │   └── assetlinks.json
│       └── open/
│           └── index.html            # H5 中转页
├── core/
│   └── deeplink-manager.js           # DeepLink 统一管理器
├── utils/
│   ├── config.js                     # 全局配置
│   ├── scheme.js                     # Scheme 解析工具
│   └── deeplink.js                   # DeepLink 工具函数
├── components/
│   └── qrcode-generator/
│       └── qrcode-generator.vue      # 二维码生成组件
├── pages/
│   ├── index/index.vue               # 首页（方案选择入口）
│   ├── demo-scheme/demo-scheme.vue   # 方案一 demo
│   ├── demo-universal/demo-universal.vue  # 方案二 demo
│   ├── demo-h5/demo-h5.vue          # 方案三 demo
│   ├── demo-unilink/demo-unilink.vue # 方案四 demo
│   ├── demo-thirdparty/demo-thirdparty.vue # 方案五 demo
│   ├── demo-token/demo-token.vue     # 方案六 demo
│   ├── result/result.vue             # 统一结果展示页
│   ├── detail/detail.vue             # 详情页
│   └── h5-redirect/h5-redirect.vue  # H5 中转页（App 内模拟）
├── manifest.json                      # uni-app 配置
├── pages.json                         # 路由配置
├── App.vue                            # 全局入口 + Deep Link 监听
└── package.json
```

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
npm run server
```

服务将在 `http://localhost:3000` 启动。

API 接口：
- `GET /api/shortlink/:code` — 短链解析
- `GET /api/token/:token` — Token 解析
- `POST /api/deeplink/resolve` — DeepLink 策略
- `GET /api/health` — 健康检查

### 3. 启动 uni-app

使用 HBuilderX 打开项目，运行到对应平台。

或使用 CLI：

```bash
# H5
npx uni -p h5

# App
npx uni -p app
```

### 4. 真机调试

1. 手机安装 DCloud 真机运行基座
2. HBuilderX 运行到真机
3. 扫描对应方案的二维码测试

## 教学文档

每个方案都有独立的详细教程，位于 `docs/` 目录：

- [方案一：URL Scheme](docs/01-url-scheme.md)
- [方案二：Universal Link / App Link](docs/02-universal-link.md)
- [方案三：H5 中转页 + Scheme](docs/03-h5-redirect.md)
- [方案四：UniLink](docs/04-unilink.md)
- [方案五：第三方 DeepLink 服务](docs/05-third-party-deeplink.md)
- [方案六：Token 二维码](docs/06-token-qrcode.md)
- [方案对比总结](docs/comparison.md)

## 核心架构

```
二维码生成
    ↓
不同入口链接
    ↓
系统/服务端处理
    ↓
App 接收参数
    ↓
DeepLinkManager 统一解析
    ↓
uni-app 路由跳转
```

### DeepLinkManager

`core/deeplink-manager.js` 是所有方案的公共处理层：

- 获取 `plus.runtime.arguments` 启动参数
- 判断来源方案类型（Scheme / Universal Link / Token 等）
- 解析参数生成统一的 `RoutePayload`
- 执行 `uni.navigateTo` 跳转
- 同时处理冷启动（`onLaunch`）和后台唤醒（`onShow`）

## 配置说明

### Scheme 配置

修改 `utils/config.js` 中的 `SCHEME_NAME`：

```js
export const SCHEME_NAME = 'scanjump'  // 与 manifest.json 一致
```

### 域名配置

修改 `utils/config.js` 中的 `DOMAIN`：

```js
export const DOMAIN = 'app.example.com'  // 替换为实际域名
```

### 后端地址

开发环境默认 `http://localhost:3000`，生产环境替换为实际服务地址。

## 常见问题

### Q: 微信扫码无法打开 App？

A: URL Scheme 在微信内被限制。推荐使用 Universal Link（方案二）或 H5 中转页（方案三）。

### Q: 未安装 App 时扫码会怎样？

A: 取决于方案：
- URL Scheme：无响应
- Universal Link：打开网页
- H5 中转页：显示下载引导

### Q: 如何在真机测试 Scheme？

A: 使用 ADB 命令：
```bash
adb shell am start -a android.intent.action.VIEW -d "scanjump://page/detail?id=123"
```

### Q: Universal Link 验证文件怎么放？

A: 放在服务器根目录的 `/.well-known/` 下，确保通过 HTTPS 可访问。

## 参考资料

- [uni-app 官方文档](https://uniapp.dcloud.io/)
- [URL Scheme 维基百科](https://en.wikipedia.org/wiki/URI_scheme)
- [Apple Universal Links](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks/)
- [Android App Links](https://developer.android.com/training/app-links)

## License

MIT
