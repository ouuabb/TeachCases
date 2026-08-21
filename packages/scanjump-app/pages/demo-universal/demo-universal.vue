<!--
  方案二：Universal Link / App Link Demo

  教学要点：
  1. HTTPS 链接直接唤起 App（iOS Universal Link / Android App Link）
  2. 需要域名验证文件（apple-app-site-association / assetlinks.json）
  3. manifest.json 配置 Universal Link 域名
  4. 未安装 App 时打开网页，安装后自动跳转 App
  5. 生产级推荐方案，支持微信扫码

  完整链路：
  App 生成二维码(https://app.example.com/detail?id=123)
  → 手机扫码
  → 浏览器打开 HTTPS 链接
  → 系统检测域名绑定 App
  → 已安装：打开 App
  → 未安装：打开网页
-->
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">方案二：Universal Link / App Link</text>
      <text class="section-desc">
        移动互联网标准方案。HTTPS 链接在已安装 App 时自动唤起，
        未安装时打开网页。生产级推荐。
      </text>
    </view>

    <!-- 二维码展示 -->
    <view class="qr-section">
      <qrcode-generator :value="qrValue" :size="250" />
    </view>

    <!-- 配置说明 -->
    <view class="config-section">
      <text class="config-title">iOS 配置（apple-app-site-association）</text>
      <view class="code-block">
        <text class="code-text">{{ iosConfig }}</text>
      </view>
    </view>

    <view class="config-section">
      <text class="config-title">Android 配置（assetlinks.json）</text>
      <view class="code-block">
        <text class="code-text">{{ androidConfig }}</text>
      </view>
    </view>

    <view class="config-section">
      <text class="config-title">manifest.json 配置</text>
      <view class="code-block">
        <text class="code-text">{{ manifestConfig }}</text>
      </view>
    </view>

    <!-- 优缺点 -->
    <view class="pros-cons">
      <view class="pros">
        <text class="pc-title">优点</text>
        <text class="pc-item">• 微信扫码 ✅</text>
        <text class="pc-item">• 浏览器扫码 ✅</text>
        <text class="pc-item">• 未安装打开网页 ✅</text>
        <text class="pc-item">• 最完整方案</text>
      </view>
      <view class="cons">
        <text class="pc-title">缺点</text>
        <text class="pc-item">• 需要域名 + HTTPS</text>
        <text class="pc-item">• 需要服务端配置验证文件</text>
        <text class="pc-item">• 配置较复杂</text>
      </view>
    </view>
  </view>
</template>

<script>
import { buildHttpsLink } from '@/utils/config'

export default {
  data() {
    return {
      /** 二维码内容：HTTPS Universal Link */
      qrValue: buildHttpsLink('/detail', { id: 123 }),

      /** iOS 配置示例 */
      iosConfig: `{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.scanjump.app",
        "paths": ["/detail/*", "/open/*"]
      }
    ]
  }
}`,

      /** Android 配置示例 */
      androidConfig: `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.scanjump.app",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  }
]`,

      /** manifest.json 配置示例 */
      manifestConfig: `"ios": {
  "universalLinks": ["https://app.example.com/ul/"]
},
"android": {
  "schemes": ["scanjump"],
  "intentFilters": [{
    "action": "android.intent.action.VIEW",
    "data": { "scheme": "https", "host": "app.example.com" }
  }]
}`
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
