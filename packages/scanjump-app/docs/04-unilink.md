# 方案四：UniLink

## 原理

DCloud 官方提供的深度链接方案，本质也是 Universal Link，但封装了 uniCloud 生态。适合 uni-app + uniCloud 项目。

```
二维码(https://xxx.dcloud.net.cn/ul/abc123)
  ↓
手机扫码
  ↓
系统识别域名绑定
  ↓
已安装 App → 自动唤起
未安装 → 打开 uniCloud 网页
```

## 系统机制

- 依赖 DCloud 的 UniLink 服务
- 域名验证由 DCloud 平台管理
- 与 Universal Link 原理相同

## 配置步骤

### 1. DCloud 开放平台配置

1. 登录 DCloud 开放平台
2. 进入 App 详情 → UniLink 配置
3. 填写 UniLink 域名
4. 下载验证文件放到服务器

### 2. manifest.json 配置

```json
{
  "app-plus": {
    "distribute": {
      "ios": {
        "universalLinks": true
      },
      "android": {
        "schemes": ["scanjump"]
      }
    }
  }
}
```

### 3. UniLink URL 格式

```
https://xxx.dcloud.net.cn/ul/{linkId}
```

`linkId` 由 DCloud 平台生成，扫码后打开对应链接，系统自动唤起 App。

## 核心代码

```js
// UniLink URL 示例
const uniLinkUrl = 'https://xxx.dcloud.net.cn/ul/abc123'

// App 接收参数（与 Universal Link 相同）
onShow() {
  const args = plus.runtime.arguments
  if (args && args.startsWith('https://')) {
    // 解析 UniLink URL
    uni.navigateTo({ url: '/pages/detail/detail?id=123' })
  }
}
```

## 测试方式

1. 在 DCloud 平台配置好 UniLink 域名
2. 生成包含 UniLink URL 的二维码
3. 使用 iPhone 扫描测试

## 优缺点

| 优点 | 缺点 |
|------|------|
| 配置简单 | 依赖 uniCloud 服务 |
| 官方支持 | 灵活性较低 |
| uniCloud 生态集成 | 非 uniCloud 项目不适用 |

## 适用场景

- uni-app + uniCloud 项目
- 想要官方支持的方案
- 不想自己配置 Universal Link 的项目
