<template>
  <view class="profile-container">
    <view class="header">
      <view class="avatar">👤</view>
      <text class="greeting">登录成功</text>
    </view>

    <view class="info-card">
      <view class="card-title">用户信息</view>

      <view class="info-row">
        <text class="info-label">用户 ID</text>
        <text class="info-value">{{ userInfo?.id || '-' }}</text>
      </view>

      <view class="info-row">
        <text class="info-label">OpenID</text>
        <text class="info-value">{{ userInfo?.openid || '-' }}</text>
      </view>

      <view class="info-row">
        <text class="info-label">Token 状态</text>
        <text class="info-value token-active">有效</text>
      </view>
    </view>

    <view class="action-section">
      <button
        class="action-btn primary"
        :loading="fetching"
        @click="fetchUserProfile"
      >
        获取我的信息
      </button>

      <button class="action-btn danger" @click="handleLogout">
        退出登录
      </button>
    </view>

    <view v-if="serverData" class="server-data">
      <view class="card-title">服务端返回数据</view>
      <text class="data-content">{{ JSON.stringify(serverData, null, 2) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserInfo } from '../../api/auth'

interface UserInfo {
  id: number
  openid: string
}

const userInfo = ref<UserInfo | null>(null)
const serverData = ref<unknown>(null)
const fetching = ref(false)

onMounted(() => {
  // 从本地存储读取用户信息
  const stored = uni.getStorageSync('userInfo')
  if (stored) {
    userInfo.value = stored
  } else {
    // 未登录，跳转到登录页
    uni.reLaunch({ url: '/pages/login/login' })
  }
})

async function fetchUserProfile() {
  fetching.value = true

  try {
    const res = await getUserInfo()

    if (res.code === 200) {
      serverData.value = res.data
      uni.showToast({
        title: '获取成功',
        icon: 'success'
      })
    } else {
      uni.showToast({
        title: res.message || '获取失败',
        icon: 'none'
      })
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    uni.showToast({
      title: '获取失败',
      icon: 'none'
    })
  } finally {
    fetching.value = false
  }
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')

        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 40rpx;
}

.header {
  text-align: center;
  padding: 60rpx 0;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  margin: 0 auto 20rpx;
}

.greeting {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #eee;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.token-active {
  color: #07c160;
}

.action-section {
  margin-bottom: 30rpx;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  border-radius: 44rpx;
  margin-bottom: 20rpx;
  border: none;
}

.action-btn::after {
  border: none;
}

.primary {
  background: #07c160;
  color: #fff;
}

.danger {
  background: #fff;
  color: #e74c3c;
  border: 2rpx solid #e74c3c;
}

.server-data {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.data-content {
  font-size: 24rpx;
  color: #666;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
