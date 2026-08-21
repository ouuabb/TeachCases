<!--
  结果展示页 — 扫码跳转后的统一落地页

  教学要点：
  - 展示从二维码解析出的所有参数
  - 显示来源方案类型
  - 用于验证各方案的参数传递是否正确
-->
<template>
  <view class="page">
    <view class="header">
      <view class="success-icon">✓</view>
      <text class="title">跳转成功</text>
      <text class="subtitle">已通过 {{ source }} 方案打开</text>
    </view>

    <view class="info-card">
      <text class="card-title">解析信息</text>

      <view class="info-row">
        <text class="info-label">来源方案</text>
        <text class="info-value">{{ source }}</text>
      </view>

      <view class="info-row">
        <text class="info-label">目标路由</text>
        <text class="info-value">{{ route }}</text>
      </view>

      <view class="info-row" v-for="(value, key) in queryParams" :key="key">
        <text class="info-label">{{ key }}</text>
        <text class="info-value">{{ value }}</text>
      </view>
    </view>

    <view class="info-card">
      <text class="card-title">完整 URL</text>
      <text class="full-url">{{ fullUrl }}</text>
    </view>

    <view class="actions">
      <view class="action-btn" @click="goHome">
        <text class="action-text">返回首页</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 结果页说明：
 *
 * 这个页面是所有方案的统一落地页。
 * 无论通过哪种方式跳转，最终都会到达这里。
 * 页面展示所有解析出的参数，用于教学验证。
 */
export default {
  data() {
    return {
      /** 来源方案名称 */
      source: '未知',
      /** 目标路由 */
      route: '/pages/result/result',
      /** 查询参数 */
      queryParams: {},
      /** 完整 URL */
      fullUrl: ''
    }
  },

  onLoad(options) {
    /**
     * onLoad 接收页面参数
     * options 中包含所有 query 参数
     * 教学要点：uni-app 页面参数通过 onLoad 的 options 传入
     */
    console.log('[结果页] 页面参数:', options)

    this.route = '/' + this.$scope?.options?.path || '/pages/result/result'
    this.queryParams = options || {}
    this.source = options._source || '直接访问'

    // 构建完整 URL 用于展示
    const queryStr = Object.entries(options)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    this.fullUrl = `scanjump://result${queryStr ? '?' + queryStr : ''}`
  },

  methods: {
    goHome() {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;

  .header {
    text-align: center;
    padding: 40px 0 30px;

    .success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #2DC5A0;
      color: #fff;
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .title {
      display: block;
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .subtitle {
      display: block;
      font-size: 14px;
      color: #999;
    }
  }

  .info-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .card-title {
      display: block;
      font-size: 15px;
      font-weight: bold;
      color: #333;
      margin-bottom: 16px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 13px;
        color: #999;
      }

      .info-value {
        font-size: 13px;
        color: #333;
        font-weight: 500;
        max-width: 60%;
        text-align: right;
        word-break: break-all;
      }
    }

    .full-url {
      display: block;
      font-size: 12px;
      color: #666;
      background: #f9f9f9;
      padding: 12px;
      border-radius: 8px;
      word-break: break-all;
      line-height: 1.5;
    }
  }

  .actions {
    margin-top: 20px;

    .action-btn {
      background: #2DC5A0;
      border-radius: 24px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;

      .action-text {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }
    }
  }
}
</style>
