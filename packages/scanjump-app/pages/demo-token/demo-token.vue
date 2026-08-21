<!--
  方案六：Token 二维码 Demo

  教学要点：
  1. 二维码只含 Token（如 token_abc123），不含业务信息
  2. App 扫码后请求服务端 API 获取真实路由
  3. 支持过期时间、权限控制
  4. 安全性高：二维码泄露无意义

  完整链路：
  生成二维码(https://app.example.com/q/token_abc123)
  → 手机扫码
  → App 获取 token 参数
  → 请求服务端 /api/token/token_abc123
  → 服务端验证 Token（过期/权限）
  → 返回 { route, query }
  → App 跳转对应页面
-->
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">方案六：Token 二维码</text>
      <text class="section-desc">
        企业级安全方案。二维码只含 Token，App 扫码后请求服务端解析。
        支持过期、权限控制、动态修改目标。
      </text>
    </view>

    <!-- 二维码展示 -->
    <view class="qr-section">
      <view class="qr-tabs">
        <view
          class="qr-tab"
          :class="{ active: currentTab === index }"
          v-for="(item, index) in tokenList"
          :key="index"
          @click="currentTab = index"
        >
          <text class="tab-text">{{ item.label }}</text>
        </view>
      </view>

      <view class="qr-display">
        <qrcode-generator :value="currentToken.qrValue" :size="250" />
      </view>

      <view class="token-info">
        <text class="token-label">Token：</text>
        <text class="token-value">{{ currentToken.token }}</text>
      </view>
    </view>

    <!-- Token 列表 -->
    <view class="token-section">
      <text class="section-title">Token 列表（模拟数据）</text>

      <view
        class="token-item"
        v-for="(item, index) in tokenList"
        :key="index"
      >
        <view class="token-header">
          <text class="token-name">{{ item.label }}</text>
          <text class="token-status" :class="item.statusType">{{ item.status }}</text>
        </view>
        <text class="token-code">{{ item.token }}</text>
        <text class="token-desc">{{ item.desc }}</text>
      </view>
    </view>

    <!-- API 说明 -->
    <view class="api-section">
      <text class="api-title">Token 解析 API</text>
      <view class="code-block">
        <text class="code-text">{{ apiExample }}</text>
      </view>
    </view>

    <!-- 测试按钮 -->
    <view class="test-section">
      <view class="test-btn" @click="resolveToken">
        <text class="test-text">测试 Token 解析</text>
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
        <text class="pc-item">• 安全性最高</text>
        <text class="pc-item">• 支持过期控制</text>
        <text class="pc-item">• 可动态修改目标</text>
        <text class="pc-item">• 适合企业级场景</text>
      </view>
      <view class="cons">
        <text class="pc-title">缺点</text>
        <text class="pc-item">• 开发成本高</text>
        <text class="pc-item">• 需要服务端支持</text>
        <text class="pc-item">• 需要网络请求</text>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL, buildHttpsLink } from '@/utils/config'

export default {
  data() {
    return {
      /** 当前选中的 Token 索引 */
      currentTab: 0,

      /** Token 列表 */
      tokenList: [
        {
          token: 'token_abc123',
          label: '有效Token',
          status: '有效',
          statusType: 'valid',
          desc: '正常可用，无过期时间',
          qrValue: buildHttpsLink('/q/token_abc123', {})
        },
        {
          token: 'token_def456',
          label: '带过期Token',
          status: '有效',
          statusType: 'valid',
          desc: '2026-12-31 过期',
          qrValue: buildHttpsLink('/q/token_def456', {})
        },
        {
          token: 'token_expired',
          label: '已过期Token',
          status: '已过期',
          statusType: 'expired',
          desc: '2025-01-01 已过期',
          qrValue: buildHttpsLink('/q/token_expired', {})
        }
      ],

      /** API 调用示例 */
      apiExample: `// 请求
GET /api/token/token_abc123

// 成功响应
{
  "success": true,
  "data": {
    "route": "/pages/detail/detail",
    "query": { "id": 2001, "from": "token" },
    "desc": "Token二维码示例1",
    "expiresAt": null
  }
}

// 过期响应
{
  "success": false,
  "message": "Token 已过期",
  "expiredAt": "2025-01-01T00:00:00Z"
}`,

      /** 解析结果 */
      resolveResult: ''
    }
  },

  computed: {
    /** 当前选中的 Token 信息 */
    currentToken() {
      return this.tokenList[this.currentTab]
    }
  },

  methods: {
    /**
     * 测试 Token 解析
     * 调用 Express 模拟服务验证 Token
     */
    resolveToken() {
      const token = this.currentToken.token

      uni.request({
        url: `${BASE_URL}/api/token/${token}`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            this.resolveResult = JSON.stringify(res.data.data, null, 2)
          } else {
            this.resolveResult = JSON.stringify({
              error: res.data?.message || '解析失败',
              statusCode: res.statusCode
            }, null, 2)
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
    padding: 20px;
    margin-bottom: 16px;

    .qr-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .qr-tab {
        flex: 1;
        height: 32px;
        border-radius: 16px;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;

        &.active {
          background: #2DC5A0;

          .tab-text {
            color: #fff;
          }
        }

        .tab-text {
          font-size: 12px;
          color: #666;
        }
      }
    }

    .qr-display {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .token-info {
      text-align: center;

      .token-label {
        font-size: 12px;
        color: #999;
      }

      .token-value {
        font-size: 12px;
        color: #2DC5A0;
        font-family: monospace;
      }
    }
  }

  .token-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .section-title {
      display: block;
      font-size: 15px;
      font-weight: bold;
      color: #333;
      margin-bottom: 16px;
    }

    .token-item {
      padding: 12px 0;
      border-bottom: 1px solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .token-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .token-name {
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }

        .token-status {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;

          &.valid {
            background: rgba(45, 197, 160, 0.1);
            color: #2DC5A0;
          }

          &.expired {
            background: rgba(255, 107, 107, 0.1);
            color: #FF6B6B;
          }
        }
      }

      .token-code {
        display: block;
        font-size: 12px;
        color: #2DC5A0;
        font-family: monospace;
        margin-bottom: 4px;
      }

      .token-desc {
        display: block;
        font-size: 11px;
        color: #999;
      }
    }
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
