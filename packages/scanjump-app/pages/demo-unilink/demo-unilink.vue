<!--
  方案四：UniLink Demo

  教学要点：
  1. DCloud 官方提供的深度链接方案
  2. 本质也是 Universal Link，但封装了 uniCloud 生态
  3. 配置简单，但需要使用 uniCloud 服务
  4. 适合 uni-app + uniCloud 项目
-->
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">方案四：UniLink</text>
      <text class="section-desc">
        DCloud 官方提供的深度链接方案。本质也是 Universal Link，
        封装了 uniCloud 生态。配置简单，适合 uni-app 项目。
      </text>
    </view>

    <!-- 二维码展示 -->
    <view class="qr-section">
      <qrcode-generator :value="qrValue" :size="250" />
    </view>

    <!-- 配置说明 -->
    <view class="config-section">
      <text class="config-title">manifest.json 配置</text>
      <view class="code-block">
        <text class="code-text">{{ manifestConfig }}</text>
      </view>
    </view>

    <view class="config-section">
      <text class="config-title">UniLink 域名配置</text>
      <view class="code-block">
        <text class="code-text">{{ uniLinkConfig }}</text>
      </view>
    </view>

    <!-- 流程说明 -->
    <view class="flow-section">
      <text class="flow-title">工作流程</text>
      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">1. App 启动时注册 UniLink 域名</text>
      </view>
      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">2. 生成包含 UniLink 域名的二维码</text>
      </view>
      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">3. 手机扫码，系统识别域名绑定</text>
      </view>
      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">4. 已安装 App → 自动唤起</text>
      </view>
      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">5. 未安装 → 打开 uniCloud 网页</text>
      </view>
    </view>

    <!-- 优缺点 -->
    <view class="pros-cons">
      <view class="pros">
        <text class="pc-title">优点</text>
        <text class="pc-item">• 配置简单</text>
        <text class="pc-item">• 官方支持</text>
        <text class="pc-item">• uniCloud 生态集成</text>
      </view>
      <view class="cons">
        <text class="pc-title">缺点</text>
        <text class="pc-item">• 依赖 uniCloud 服务</text>
        <text class="pc-item">• 灵活性较低</text>
        <text class="pc-item">• 非 uniCloud 项目不适用</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      /** 二维码内容：UniLink 域名 */
      qrValue: 'https://xxx.dcloud.net.cn/ul/abc123',

      /** manifest.json 配置示例 */
      manifestConfig: `"app-plus": {
  "distribute": {
    "ios": {
      "universalLinks": true
    },
    "android": {
      "schemes": ["scanjump"]
    }
  }
}`,

      /** UniLink 配置说明 */
      uniLinkConfig: `// 在 DCloud 开放平台配置 UniLink 域名
// 步骤：
// 1. 登录 DCloud 开放平台
// 2. 进入 App 详情 → UniLink 配置
// 3. 填写 UniLink 域名（如 xxx.dcloud.net.cn）
// 4. 下载验证文件放到服务器

// UniLink URL 格式：
https://xxx.dcloud.net.cn/ul/{linkId}

// linkId 由 DCloud 平台生成
// 扫码后打开对应链接，系统自动唤起 App`
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;

  .section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .section-title {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .section-desc {
      display: block;
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }
  }

  .qr-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }

  .config-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .config-title {
      display: block;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
    }

    .code-block {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;

      .code-text {
        font-size: 11px;
        color: #a8e6cf;
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-all;
        line-height: 1.5;
      }
    }
  }

  .flow-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .flow-title {
      display: block;
      font-size: 15px;
      font-weight: bold;
      color: #333;
      margin-bottom: 16px;
    }

    .flow-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .flow-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #2DC5A0;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .flow-text {
        font-size: 13px;
        color: #333;
      }
    }
  }

  .pros-cons {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    .pros, .cons {
      flex: 1;
      background: #fff;
      border-radius: 12px;
      padding: 16px;

      .pc-title {
        display: block;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .pc-item {
        display: block;
        font-size: 12px;
        color: #666;
        line-height: 1.8;
      }
    }

    .pros .pc-title { color: #2DC5A0; }
    .cons .pc-title { color: #FF6B6B; }
  }
}
</style>
