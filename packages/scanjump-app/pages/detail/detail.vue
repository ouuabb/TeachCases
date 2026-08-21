<!--
  详情页 — 模拟业务目标页面

  教学要点：
  - 接收从二维码解析出的 query 参数
  - 展示参数内容，验证跳转是否正确
-->
<template>
  <view class="page">
    <view class="header">
      <text class="title">详情页</text>
      <text class="subtitle">这里是业务目标页面</text>
    </view>

    <view class="info-card">
      <text class="card-title">接收的参数</text>

      <view class="info-row">
        <text class="info-label">页面ID</text>
        <text class="info-value">{{ id }}</text>
      </view>

      <view class="info-row" v-if="type">
        <text class="info-label">类型</text>
        <text class="info-value">{{ type }}</text>
      </view>

      <view class="info-row" v-if="from">
        <text class="info-label">来源</text>
        <text class="info-value">{{ from }}</text>
      </view>

      <view class="info-row" v-if="source">
        <text class="info-label">方案来源</text>
        <text class="info-value">{{ source }}</text>
      </view>
    </view>

    <view class="actions">
      <view class="action-btn" @click="goHome">
        <text class="action-text">返回首页</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      id: '',
      type: '',
      from: '',
      source: ''
    }
  },

  onLoad(options) {
    console.log('[详情页] 页面参数:', options)
    this.id = options.id || '未知'
    this.type = options.type || ''
    this.from = options.from || ''
    this.source = options._source || ''
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
      padding: 12px 0;
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
      }
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
