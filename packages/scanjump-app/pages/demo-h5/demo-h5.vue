<!--
  方案三：H5 中转页 + Scheme Demo

  教学要点：
  1. 二维码链接到 HTTPS 中转页（不是直接 Scheme）
  2. 中转页检测环境（App/微信/浏览器）
  3. 尝试 Scheme 唤起 App
  4. 未安装时显示下载引导
  5. 国内 App 常见方案

  完整链路：
  二维码(https://app.example.com/open?id=123)
  → 浏览器打开 H5 中转页
  → H5 检测环境
  → 尝试 location.href = "scanjump://..." 唤起
  → 未安装：显示下载按钮
-->
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">方案三：H5 中转页 + Scheme</text>
      <text class="section-desc">
        国内 App 常见方案。二维码链接到 H5 页面，H5 检测环境后
        尝试 Scheme 唤起 App，未安装时引导下载。
      </text>
    </view>

    <!-- 二维码展示 -->
    <view class="qr-section">
      <qrcode-generator :value="qrValue" :size="250" />
    </view>

    <!-- 流程图 -->
    <view class="flow-section">
      <text class="flow-title">完整流程</text>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">手机扫码 → 打开 H5 中转页</text>
      </view>

      <view class="flow-line"></view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">H5 检测当前环境（App/微信/浏览器）</text>
      </view>

      <view class="flow-line"></view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">尝试 Scheme 唤起（location.href）</text>
      </view>

      <view class="flow-line"></view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">已安装 → App 打开</text>
      </view>

      <view class="flow-line"></view>

      <view class="flow-item">
        <view class="flow-dot warn"></view>
        <text class="flow-text">未安装 → 显示下载引导</text>
      </view>
    </view>

    <!-- 中转页代码示例 -->
    <view class="config-section">
      <text class="config-title">H5 中转页核心代码</text>
      <view class="code-block">
        <text class="code-text">{{ redirectCode }}</text>
      </view>
    </view>

    <!-- 优缺点 -->
    <view class="pros-cons">
      <view class="pros">
        <text class="pc-title">优点</text>
        <text class="pc-item">• 兼容性最好</text>
        <text class="pc-item">• 可实现未安装下载</text>
        <text class="pc-item">• 国内主流方案</text>
      </view>
      <view class="cons">
        <text class="pc-title">缺点</text>
        <text class="pc-item">• 需要服务器</text>
        <text class="pc-item">• 多一次跳转</text>
        <text class="pc-item">• 部分浏览器拦截 Scheme</text>
      </view>
    </view>

    <!-- 测试按钮 -->
    <view class="test-section">
      <view class="test-btn" @click="openRedirectPage">
        <text class="test-text">打开 H5 中转页</text>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/utils/config'

export default {
  data() {
    return {
      /** 二维码内容：H5 中转页链接 */
      qrValue: `${BASE_URL}/open?id=123&page=detail`,

      /** 中转页核心代码示例 */
      redirectCode: `// H5 中转页核心逻辑
const SCHEME = 'scanjump'
const targetPage = urlParams.get('page') || 'detail'
const targetId = urlParams.get('id') || '123'

// 构建 Scheme URL
const schemeUrl = SCHEME + '://' + targetPage + '?id=' + targetId

// 尝试唤起 App
function openApp() {
  // 方法1：location.href
  window.location.href = schemeUrl

  // 方法2：iframe 兼容
  const iframe = document.createElement('iframe')
  iframe.src = schemeUrl
  document.body.appendChild(iframe)

  // 3秒后检测（如果 App 未安装，页面继续执行）
  setTimeout(() => {
    // App 未安装，显示下载按钮
    showDownload()
  }, 3000)
}`
    }
  },

  methods: {
    /**
     * 打开 H5 中转页
     * 在 H5 端跳转到中转页
     */
    openRedirectPage() {
      // #ifdef H5
      window.open(this.qrValue, '_blank')
      // #endif

      // #ifdef APP-PLUS
      uni.navigateTo({
        url: '/pages/h5-redirect/h5-redirect?id=123&page=detail'
      })
      // #endif
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

      .flow-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #2DC5A0;
        margin-right: 12px;
        flex-shrink: 0;

        &.warn {
          background: #FF9A6C;
        }
      }

      .flow-text {
        font-size: 13px;
        color: #333;
      }
    }

    .flow-line {
      width: 2px;
      height: 16px;
      background: #e0e0e0;
      margin-left: 4px;
      margin-bottom: 0;
      margin-top: 0;
    }
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

  .test-section {
    .test-btn {
      background: #2DC5A0;
      border-radius: 24px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;

      .test-text {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }
    }
  }
}
</style>
