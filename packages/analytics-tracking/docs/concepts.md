# 数据埋点教学文档

## 一、什么是数据埋点？

### 1.1 定义

**数据埋点**（Tracking / Event Tracking）是指在软件产品（网页、App、小程序等）的特定位置植入一段代码，当用户触发某个行为时，采集相关数据并上报给服务端进行存储和分析。

简单来说：**埋点 = 在产品上安装"隐形摄像头"**。

### 1.2 为什么需要埋点？

| 场景 | 埋点的作用 |
|------|-----------|
| 产品改版 | 对比改版前后的点击率、转化率变化 |
| 运营决策 | 分析用户来源，优化推广渠道投入 |
| 用户画像 | 了解用户行为偏好，实现个性化推荐 |
| 问题排查 | 定位用户流失环节，发现体验瓶颈 |
| A/B 测试 | 为实验组和对照组提供数据对比依据 |

### 1.3 核心概念

```
用户行为 → 事件采集 → 数据加工 → 网络上报 → 后端存储 → 分析展示
```

一个典型的埋点事件包含以下字段：

```json
{
  "eventType": "click",
  "eventName": "buy_button_click",
  "page": "/product/123",
  "props": { "productId": 123, "price": 99 },
  "timestamp": "2026-01-01T12:00:00.000Z",
  "sessionId": "abc-def-123",
  "userId": "user_001",
  "commonProps": {
    "userAgent": "...",
    "screenWidth": 1920,
    "referrer": "https://google.com"
  }
}
```

---

## 二、埋点类型

### 2.1 按采集方式分

| 类型 | 说明 | 实现方式 |
|------|------|---------|
| **代码埋点** | 开发手动在代码中插入采集逻辑 | 本项目采用的方式 |
| **可视化埋点** | 通过配置平台圈选元素自动埋点 | 神策、GrowingIO 等平台支持 |
| **全埋点（无埋点）** | SDK 自动采集所有交互行为 | 前端自动绑定 click、change 等事件 |

### 2.2 按事件类型分

| 事件类型 | 说明 | 触发时机 |
|---------|------|---------|
| **PV (Page View)** | 页面浏览 | 路由跳转 / 页面加载 |
| **Click** | 点击事件 | 用户点击按钮、链接等 |
| **Exposure** | 曝光事件 | 元素进入可视区域 |
| **Custom** | 自定义事件 | 业务自定义，如加购、下单 |
| **Duration** | 时长事件 | 页面停留、视频播放时长 |

---

## 三、本项目架构

```
┌─────────────────────────────────────────────────┐
│                    前端 (Vue 3)                   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ 手动埋点  │  │ 自动埋点  │  │ 曝光追踪器    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │           │
│       └──────────────┼───────────────┘           │
│                      ▼                           │
│              ┌──────────────┐                    │
│              │   Tracker SDK │                    │
│              │  ┌──────────┐ │                    │
│              │  │ 数据加工  │ │  ← 补充公共属性    │
│              │  ├──────────┤ │                    │
│              │  │ 离线缓存  │ │  ← localStorage   │
│              │  ├──────────┤ │                    │
│              │  │ 采样控制  │ │  ← 按比例采样      │
│              │  ├──────────┤ │                    │
│              │  │ 批量上报  │ │  ← Beacon API     │
│              │  └──────────┘ │                    │
│              └──────┬────────┘                    │
│                     │                           │
└─────────────────────┼───────────────────────────┘
                      │ HTTP POST
                      ▼
┌─────────────────────────────────────────────────┐
│              后端 (Express)                       │
│                                                  │
│  POST /api/track         → 单条事件接收          │
│  POST /api/track/batch   → 批量事件接收          │
│  GET  /api/analytics/stats → 统计数据查询        │
│  GET  /api/analytics/events → 事件列表查询        │
│                                                  │
│  ┌──────────────────────┐                        │
│  │   EventStore (内存)   │  ← 生产替换为数据库    │
│  └──────────────────────┘                        │
└─────────────────────────────────────────────────┘
```

---

## 四、SDK 核心模块详解

### 4.1 事件采集

```javascript
// tracker.js — 核心 track 方法
track(eventName, props = {}, options = {}) {
  const event = {
    messageId: generateId(),       // 唯一标识
    eventType: options.eventType || 'custom',
    eventName,                     // 事件名称
    props,                         // 自定义属性
    page: window.location.pathname, // 当前页面
    sessionId: this.sessionId,     // 会话ID
    userId: this.userId,           // 用户ID
    timestamp: new Date().toISOString(),
    commonProps: { ...this公共属性 } // 公共属性
  }
  this.queue.push(event)
}
```

### 4.2 数据上报方式

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **sendBeacon** | 页面关闭也能发、可靠 | 数据量限制(64KB) | 页面卸载时 |
| **fetch API** | 灵活、支持大数据 | 页面关闭可能丢失 | 正常流程 |
| **XMLHttpRequest** | 兼容性好 | 阻塞、不推荐 | 低版本浏览器 |

本项目优先使用 `sendBeacon`，降级到 `fetch`，最后用 `XHR`。

### 4.3 离线缓存

当网络不可用时，事件暂存到 `localStorage`：

```javascript
class OfflineQueue {
  push(event) {
    const events = this.load()
    events.push(event)
    this.save(events)
  }

  drain() {
    const events = this.load()
    this.save([])  // 清空
    return events
  }
}
```

网络恢复时自动上报缓存事件。

### 4.4 采样控制

高流量场景下，100% 上报会对服务端造成巨大压力。通过采样率控制：

```javascript
// 基于 sessionId hash 保证同一会话内采样一致性
shouldSample(sessionId) {
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0
  }
  const ratio = (Math.abs(hash) % 10000) / 10000
  return ratio < this.sampleRate
}
```

---

## 五、自动埋点 vs 手动埋点

### 5.1 自动埋点（本项目已实现）

| 自动化场景 | 实现方式 |
|-----------|---------|
| PV (页面浏览) | 监听 Vue Router 的 `afterEach` 钩子 |
| 首屏 PV | SDK 初始化时自动上报 |
| 离线恢复 | 监听 `online` 事件，自动发送缓存 |
| 页面关闭 | 监听 `beforeunload`，用 sendBeacon 上报 |

### 5.2 手动埋点

```javascript
// 点击事件
tracker.trackClick('buy_button', { productId: 123 })

// 自定义事件
tracker.trackEvent('add_to_cart', { productId: 123, quantity: 1 })

// 曝光事件
tracker.trackExposure('banner_section', { position: 'top' })
```

### 5.3 曝光追踪（IntersectionObserver）

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      tracker.trackExposure('my_element')
      observer.unobserve(entry.target)  // 只上报一次
    }
  })
}, { threshold: 0.5 })  // 50% 可见时触发
```

---

## 六、生产环境注意事项

| 项目 | 教学版 | 生产版 |
|------|--------|--------|
| 数据存储 | 内存数组 | ClickHouse / Kafka → Hive |
| 数据上报 | fetch | sendBeacon + 失败重试 |
| 接口安全 | 无 | HMAC 签名 + IP 限流 |
| 性能影响 | - | requestIdleCallback + Web Worker |
| 隐私合规 | - | GDPR / 个人信息保护法 |
| 数据验证 | 基础校验 | JSON Schema + 字段清洗 |
| 采样策略 | 固定 100% | 动态采样 + 分层采样 |

---

## 七、动手练习

1. **修改 SDK 配置**：将采样率改为 50%，观察控制台输出
2. **添加新事件**：在商品页实现"收藏"按钮，添加埋点
3. **新增统计维度**：在后端 stats 接口中添加按小时统计
4. **离线测试**：断开网络操作页面，恢复后查看离线事件上报
5. **曝光实验**：在首页添加多个元素，设置不同 threshold 观察触发条件

---

## 八、参考资源

- [Google Analytics 事件模型](https://developers.google.com/analytics/devguides/collection/gtagjs/events)
- [神策数据埋点规范](https://www.sensorsdata.cn/)
- [sendBeacon API MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/sendBeacon)
- [IntersectionObserver MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)
