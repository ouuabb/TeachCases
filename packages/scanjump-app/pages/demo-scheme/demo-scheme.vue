<!--
  方案一：URL Scheme Demo

  教学要点：
  1. manifest.json 中配置自定义 Scheme
  2. App 通过 plus.runtime.arguments 获取 Scheme 参数
  3. 解析参数后执行 uni.navigateTo 跳转
  4. 优缺点：最简单但未安装 App 体验差

  完整链路：
  App 生成二维码(scanjump://page/detail?id=123)
  → 手机扫码
  → 系统找到 App
  → 启动 App
  → App.vue onShow 中获取参数
  → 跳转 /pages/detail/detail?id=123
-->
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">方案一：URL Scheme</text>
      <text class="section-desc">
        最简单的 DeepLink 方案。注册自定义协议（如 scanjump://），
        扫码后系统直接唤起 App。
      </text>
    </view>

    <!-- 二维码展示 -->
    <view class="qr-section">
      <qrcode-generator :value="qrValue" :size="250" />
    </view>

    <!-- 配置说明 -->
    <view class="config-section">
      <text class="config-title">实现步骤</text>

      <view class="step">
        <view class="step-num">1</view>
        <view class="step-content">
          <text class="step-title">manifest.json 配置 Scheme</text>
          <text class="step-code">"schemes": ["scanjump"]</text>
        </view>
      </view>

      <view class="step">
        <view class="step-num">2</view>
        <view class="step-content">
          <text class="step-title">App 启动后获取参数</text>
          <text class="step-code">const args = plus.runtime.arguments</text>
        </view>
      </view>

      <view class="step">
        <view class="step-num">3</view>
        <view class="step-content">
          <text class="step-title">解析 Scheme 并跳转</text>
          <text class="step-code">scanjump://page/detail?id=123 → /pages/detail/detail?id=123</text>
        </view>
      </view>
    </view>

    <!-- 优缺点 -->
    <view class="pros-cons">
      <view class="pros">
        <text class="pc-title">优点</text>
        <text class="pc-item">• 实现最快，无需服务器</text>
        <text class="pc-item">• 本地测试方便</text>
        <text class="pc-item">• 适合内部系统</text>
      </view>
      <view class="cons">
        <text class="pc-title">缺点</text>
        <text class="pc-item">• 未安装 App 时无响应</text>
        <text class="pc-item">• 微信内扫码被限制</text>
      </view>
    </view>

    <!-- 测试按钮 -->
    <view class="test-section">
      <view class="test-btn" @click="testScheme">
        <text class="test-text">测试 Scheme 跳转</text>
      </view>
    </view>
  </view>
</template>

<script>
import { buildScheme } from '@/utils/config'
import { tryOpenScheme } from '@/utils/deeplink'

export default {
  data() {
    return {
      /** 二维码内容：Scheme URL */
      qrValue: buildScheme('page/detail', { id: 123 })
    }
  },

  methods: {
    /**
     * 测试 Scheme 跳转
     * 在 H5 端尝试通过 location.href 唤起 App
     */
    testScheme() {
      // #ifdef H5
      tryOpenScheme(this.qrValue)
      // #endif

      // #ifdef APP-PLUS
      uni.showToast({
        title: '请在 H5 端测试 Scheme 唤起',
        icon: 'none'
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

  .config-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .config-title {
      display: block;
      font-size: 15px;
      font-weight: bold;
      color: #333;
      margin-bottom: 16px;
    }

    .step {
      display: flex;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .step-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #2DC5A0;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .step-content {
        flex: 1;

        .step-title {
          display: block;
          font-size: 14px;
          color: #333;
          margin-bottom: 4px;
        }

        .step-code {
          display: block;
          font-size: 12px;
          color: #2DC5A0;
          background: #f5f5f5;
          padding: 8px;
          border-radius: 6px;
          font-family: monospace;
          word-break: break-all;
        }
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
