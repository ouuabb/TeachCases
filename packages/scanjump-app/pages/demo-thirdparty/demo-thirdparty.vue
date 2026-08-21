<!--
  方案五：第三方 DeepLink 服务 Demo

  教学要点：
  1. 不接真实商业服务，用 Express 模拟
  2. 客户端 → DeepLink 服务 → 返回唤醒策略 → Scheme/Universal Link
  3. 展示第三方服务的本质：中间层路由决策
  4. 支持数据统计、渠道分析、动态修改目标

  完整链路：
  二维码(https://app.example.com/q/abc123)
  → App 扫码
  → 请求 DeepLink 服务 API
  → 服务返回唤醒策略（scheme/universallink/fallback）
  → App 执行对应策略
-->
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">方案五：第三方 DeepLink 服务</text>
      <text class="section-desc">
        不接真实商业服务，用 Express 模拟极光/个推等 DeepLink 服务。
        核心：中间层路由决策 + 数据统计。
      </text>
    </view>

    <!-- 二维码展示 -->
    <view class="qr-section">
      <qrcode-generator :value="qrValue" :size="250" />
    </view>

    <!-- API 调用演示 -->
    <view class="api-section">
      <text class="api-title">模拟 DeepLink 服务 API</text>

      <view class="api-item">
        <text class="api-method">POST</text>
        <text class="api-url">/api/deeplink/resolve</text>
      </view>

      <view class="code-block">
        <text class="code-text">{{ apiExample }}</text>
      </view>
    </view>

    <!-- 流程图 -->
    <view class="flow-section">
      <text class="flow-title">服务端决策流程</text>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">1. 客户端发送链接到 DeepLink 服务</text>
      </view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">2. 服务查询数据库，获取路由配置</text>
      </view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">3. 服务判断设备平台（iOS/Android）</text>
      </view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">4. 返回唤醒策略（scheme/universallink）</text>
      </view>

      <view class="flow-item">
        <view class="flow-dot"></view>
        <text class="flow-text">5. 客户端执行策略，尝试唤起 App</text>
      </view>

      <view class="flow-item">
        <view class="flow-dot warn"></view>
        <text class="flow-text">6. 未安装时，使用 fallback 下载页</text>
      </view>
    </view>

    <!-- 测试按钮 -->
    <view class="test-section">
      <view class="test-btn" @click="resolveDeeplink">
        <text class="test-text">测试 DeepLink 解析</text>
      </view>
      <view class="result-box" v-if="resolveResult">
        <text class="result-title">解析结果：</text>
        <text class="result-text">{{ resolveResult }}</text>
      </view>
    </view>

    <!-- 优缺点 -->
    <view class="pros-cons">
      <view class="pros">
        <text class="pc-title">优点</text>
        <text class="pc-item">• 数据统计能力强</text>
        <text class="pc-item">• 支持渠道分析</text>
        <text class="pc-item">• 可动态修改目标</text>
      </view>
      <view class="cons">
        <text class="pc-title">缺点</text>
        <text class="pc-item">• 依赖第三方服务</text>
        <text class="pc-item">• 有服务费用</text>
        <text class="pc-item">• 需要网络请求</text>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/utils/config'

export default {
  data() {
    return {
      /** 二维码内容：DeepLink 服务短链 */
      qrValue: `${BASE_URL}/api/deeplink/resolve`,

      /** API 调用示例 */
      apiExample: `// 请求
POST /api/deeplink/resolve
Content-Type: application/json

{
  "url": "https://app.example.com/q/abc123",
  "platform": "ios"
}

// 响应
{
  "success": true,
  "data": {
    "method": "scheme",
    "scheme": "scanjump://page/detail?id=123",
    "universalLink": "https://app.example.com/detail?id=123",
    "fallback": "https://app.example.com/download",
    "platform": "ios"
  }
}`,

      /** 解析结果 */
      resolveResult: ''
    }
  },

  methods: {
    /**
     * 测试 DeepLink 解析
     * 调用 Express 模拟服务获取唤醒策略
     */
    resolveDeeplink() {
      uni.request({
        url: `${BASE_URL}/api/deeplink/resolve`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: {
          url: 'https://app.example.com/q/abc123',
          platform: 'ios'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            this.resolveResult = JSON.stringify(res.data.data, null, 2)
          } else {
            this.resolveResult = '解析失败：' + (res.data?.message || '未知错误')
          }
        },
        fail: (err) => {
          this.resolveResult = '请求失败：' + err.errMsg
        }
      })
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

  .api-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .api-title {
      display: block;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
    }

    .api-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .api-method {
        background: #2DC5A0;
        color: #fff;
        font-size: 11px;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 4px;
        margin-right: 8px;
      }

      .api-url {
        font-size: 13px;
        color: #333;
        font-family: monospace;
      }
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
  }

  .test-section {
    margin-bottom: 16px;

    .test-btn {
      background: #2DC5A0;
      border-radius: 24px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;

      .test-text {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }
    }

    .result-box {
      background: #1a1a2e;
      border-radius: 12px;
      padding: 16px;

      .result-title {
        display: block;
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
      }

      .result-text {
        display: block;
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
