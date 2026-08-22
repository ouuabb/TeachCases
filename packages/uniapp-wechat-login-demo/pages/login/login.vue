<template>
  <view class="login-container">
    <view class="login-card">
      <view class="logo-section">
        <view class="logo">🔐</view>
        <text class="title">微信小程序登录</text>
        <text class="subtitle">多人协作开发演示</text>
      </view>

      <view class="info-section">
        <view class="info-item">
          <text class="label">项目说明：</text>
          <text class="value">演示 UniApp + Express 微信登录完整流程</text>
        </view>
        <view class="info-item">
          <text class="label">教学重点：</text>
          <text class="value">AppID 共享、code 换取、token 管理</text>
        </view>
      </view>

      <button
        class="login-btn"
        :loading="loading"
        :disabled="loading"
        @click="handleLogin"
      >
        {{ loading ? '正在登录...' : '微信登录' }}
      </button>

      <view v-if="errorMsg" class="error-msg">
        <text>{{ errorMsg }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { wxLogin } from '../../api/auth'

const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    // 第一步：调用 uni.login() 获取微信登录凭证 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject
      })
    })

    console.log('uni.login 成功，code:', loginRes.code)

    // 第二步：将 code 发送到后端换取 token
    const res = await wxLogin(loginRes.code)

    if (res.code === 200 && res.data) {
      // 第三步：保存 token 和用户信息到本地
      uni.setStorageSync('token', res.data.token)
      uni.setStorageSync('userInfo', res.data.user)

      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 跳转到个人中心页
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/profile/profile' })
      }, 1000)
    } else {
      errorMsg.value = res.message || '登录失败'
    }
  } catch (err) {
    console.error('登录失败:', err)
    errorMsg.value = err instanceof Error ? err.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
}

.login-card {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.logo-section {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
}

.info-section {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.info-item {
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.value {
  font-size: 24rpx;
  color: #333;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #07c160;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
}

.login-btn::after {
  border: none;
}

.error-msg {
  margin-top: 20rpx;
  text-align: center;
  color: #e74c3c;
  font-size: 26rpx;
}
</style>
