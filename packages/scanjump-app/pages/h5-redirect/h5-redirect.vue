<!--
  H5 中转页（App 内模拟版）

  教学要点：
  - 在 App 内模拟 H5 中转页的行为
  - 演示 Scheme 唤起逻辑
  - 未安装时的下载引导
-->
<template>
  <view class="page">
    <view class="card">
      <text class="icon">📱</text>
      <text class="title">ScanJump</text>
      <text class="desc">正在尝试打开 App...</text>

      <view class="btn primary" @click="openApp">
        <text class="btn-text">打开 App</text>
      </view>

      <view class="btn secondary" @click="downloadApp">
        <text class="btn-text">下载 App</text>
      </view>

      <text class="status" :class="{ error: hasError }">{{ statusText }}</text>
    </view>

    <view class="info">
      <text class="info-title">调试信息</text>
      <text class="info-item">目标页面: {{ targetPage }}</text>
      <text class="info-item">参数ID: {{ targetId }}</text>
      <text class="info-item">Scheme: {{ schemeUrl }}</text>
    </view>
  </view>
</template>

<script>
import { SCHEME_NAME } from '@/utils/config'

export default {
  data() {
    return {
      targetId: '123',
      targetPage: 'detail',
      schemeUrl: '',
      statusText: '等待操作...',
      hasError: false
    }
  },

  onLoad(options) {
    this.targetId = options.id || '123'
    this.targetPage = options.page || 'detail'
    this.schemeUrl = `${SCHEME_NAME}://${this.targetPage}?id=${this.targetId}`
  },

  methods: {
    openApp() {
      this.statusText = '正在尝试打开 App...'
      this.hasError = false

      // #ifdef H5
      window.location.href = this.schemeUrl
      setTimeout(() => {
        this.statusText = '无法打开 App，请确认已安装'
        this.hasError = true
      }, 3000)
      // #endif

      // #ifdef APP-PLUS
      plus.runtime.openURL(this.schemeUrl)
      // #endif
    },

    downloadApp() {
      uni.showToast({ title: '请前往应用市场下载', icon: 'none' })
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;

  .card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 30px;
    width: 90%;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .icon {
      display: block;
      font-size: 48px;
      margin-bottom: 16px;
    }

    .title {
      display: block;
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
    }

    .desc {
      display: block;
      font-size: 14px;
      color: #999;
      margin-bottom: 30px;
    }

    .btn {
      height: 48px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;

      &.primary {
        background: #2DC5A0;
      }

      &.secondary {
        background: #f0f0f0;
      }

      .btn-text {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }

      &.secondary .btn-text {
        color: #666;
      }
    }

    .status {
      display: block;
      font-size: 13px;
      color: #2DC5A0;
      margin-top: 16px;

      &.error {
        color: #FF6B6B;
      }
    }
  }

  .info {
    margin-top: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    width: 90%;

    .info-title {
      display: block;
      font-size: 13px;
      color: #999;
      margin-bottom: 8px;
    }

    .info-item {
      display: block;
      font-size: 12px;
      color: #666;
      line-height: 1.8;
    }
  }
}
</style>
