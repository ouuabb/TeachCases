# 数据埋点教学项目

一个完整的数据埋点教学案例，涵盖前端 SDK 开发、后端数据接收、离线缓存、采样控制、曝光追踪等核心概念。

## 项目结构

```
analytics-tracking/
├── package.json              # 根配置
├── docs/
│   └── concepts.md           # 教学文档：数据埋点完整概念
├── server/                   # Express 后端
│   ├── index.js              # 服务入口
│   ├── storage.js            # 内存存储（教学简化版）
│   └── routes/
│       ├── track.js          # 埋点数据接收 API
│       └── analytics.js      # 数据查询 API
└── client/                   # Vue 3 前端
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.js           # 入口：初始化 SDK
        ├── App.vue           # 根组件
        ├── sdk/
        │   └── tracker.js    # 埋点 SDK 核心
        ├── router/
        │   └── index.js      # 路由（自动 PV 埋点）
        └── views/
            ├── Home.vue      # 首页：概念讲解
            ├── Product.vue   # 商品页：手动 + 曝光埋点
            ├── TrackerDemo.vue # 交互式 SDK 演示
            └── Dashboard.vue # 数据看板：实时查看上报数据
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动项目（同时启动前后端）
pnpm dev

# 或分别启动
pnpm dev:server   # 后端 http://localhost:3000
pnpm dev:client   # 前端 http://localhost:3001
```

## 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 数据埋点概念介绍 |
| 商品页 | `/product/:id` | 模拟电商页，演示点击、曝光、自定义事件 |
| 埋点演示 | `/tracker-demo` | 交互式操作 SDK，实时查看事件流 |
| 数据看板 | `/dashboard` | 实时查看后端收到的埋点数据 |

## 教学重点

1. **埋点类型**：PV、Click、Exposure、Custom
2. **SDK 设计**：数据加工、离线缓存、采样控制、批量上报
3. **上报方式**：sendBeacon / fetch / XHR 降级策略
4. **自动埋点**：路由监听、IntersectionObserver 曝光追踪
5. **后端接收**：RESTful API 设计、内存存储
6. **数据可视化**：统计维度、分布图表

详细文档请查看 [docs/concepts.md](./docs/concepts.md)

## 控制台调试

打开浏览器控制台，使用全局 `$tracker` 对象：

```javascript
// 发送自定义事件
window.$tracker.track('my_event', { key: 'value' })

// 发送点击事件
window.$tracker.trackClick('my_button')

// 发送曝光事件
window.$tracker.trackExposure('my_section')

// 设置用户 ID
window.$tracker.setUserId('user_123')

// 添加公共属性
window.$tracker.setCommonProps({ vipLevel: 'gold' })
```
