<!--
  首页 — 方案选择入口

  教学要点：
  - 展示 6 种 DeepLink 方案的卡片列表
  - 每个卡片包含：方案名称、简述、优缺点标签
  - 点击可查看方案详情（跳转到对应 demo 页）
  - 点击「生成二维码」展示该方案的二维码
-->
<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="header-title">扫码跳 App 路由方案</text>
      <text class="header-subtitle">6 种 DeepLink 技术方案教学 Demo</text>
    </view>

    <!-- 方案卡片列表 -->
    <scroll-view scroll-y class="card-list">
      <view
        class="scheme-card"
        v-for="(item, index) in schemes"
        :key="index"
        @click="goToDemo(item)"
      >
        <view class="card-header">
          <view class="card-index">{{ index + 1 }}</view>
          <view class="card-info">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-subtitle">{{ item.subtitle }}</text>
          </view>
        </view>

        <text class="card-desc">{{ item.desc }}</text>

        <!-- 标签 -->
        <view class="card-tags">
          <view
            class="tag"
            v-for="(tag, tagIdx) in item.tags"
            :key="tagIdx"
            :class="tag.type"
          >
            <text class="tag-text">{{ tag.text }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="card-actions">
          <view class="action-btn primary" @click.stop="showQRCode(item)">
            <text class="action-text">生成二维码</text>
          </view>
          <view class="action-btn secondary" @click.stop="goToDemo(item)">
            <text class="action-text">查看方案</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 二维码弹窗 -->
    <view class="qr-popup" v-if="showPopup" @click="showPopup = false">
      <view class="qr-popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ currentScheme?.title }}</text>
          <view class="popup-close" @click="showPopup = false">
            <text class="close-icon">×</text>
          </view>
        </view>

        <view class="qr-display">
          <qrcode-generator
            :value="currentQRValue"
            :size="250"
          />
        </view>

        <view class="qr-info">
          <text class="qr-label">二维码内容：</text>
          <text class="qr-value">{{ currentQRValue }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 首页数据说明：
 *
 * schemes 数组定义了 6 种方案的展示信息
 * 每个方案包含：
 * - title: 方案名称
 * - subtitle: 副标题
 * - desc: 功能描述
 * - tags: 特性标签（成本/稳定性/推荐度）
 * - demoPath: 对应 demo 页面路径
 * - qrValue: 二维码内容模板
 */
import { buildScheme, buildHttpsLink, BASE_URL } from '@/utils/config'

export default {
  data() {
    return {
      /** 是否显示二维码弹窗 */
      showPopup: false,
      /** 当前选中的方案 */
      currentScheme: null,
      /** 当前二维码内容 */
      currentQRValue: '',

      /**
       * 6 种方案定义
       */
      schemes: [
        {
          id: 'scheme',
          title: '方案一：URL Scheme',
          subtitle: '最简单的自定义协议方案',
          desc: '注册自定义协议（如 scanjump://），扫码直接唤起 App。无需服务器，适合内部工具。',
          tags: [
            { text: '成本：低', type: 'success' },
            { text: '稳定性：中', type: 'warning' },
            { text: '内部使用', type: 'info' }
          ],
          demoPath: '/pages/demo-scheme/demo-scheme',
          qrValue: buildScheme('page/detail', { id: 123 })
        },
        {
          id: 'universal',
          title: '方案二：Universal Link / App Link',
          subtitle: '生产级标准方案',
          desc: 'HTTPS 链接直接唤起 App，未安装时打开网页。需要域名验证和 Apple/Google 配置。',
          tags: [
            { text: '成本：中', type: 'warning' },
            { text: '稳定性：最高', type: 'success' },
            { text: '生产推荐', type: 'primary' }
          ],
          demoPath: '/pages/demo-universal/demo-universal',
          qrValue: buildHttpsLink('/detail', { id: 123 })
        },
        {
          id: 'h5redirect',
          title: '方案三：H5 中转页 + Scheme',
          subtitle: '国内 App 常见方案',
          desc: '二维码链接到 H5 页面，H5 检测环境后尝试 Scheme 唤起，未安装时引导下载。',
          tags: [
            { text: '成本：中', type: 'warning' },
            { text: '兼容性好', type: 'success' },
            { text: '国内主流', type: 'primary' }
          ],
          demoPath: '/pages/demo-h5/demo-h5',
          qrValue: BASE_URL + '/open?id=123&page=detail'
        },
        {
          id: 'unilink',
          title: '方案四：UniLink',
          subtitle: 'DCloud 官方方案',
          desc: 'uni-app 官方提供的深度链接方案，适合 uniCloud 生态，本质也是 Universal Link。',
          tags: [
            { text: '成本：中', type: 'warning' },
            { text: '稳定性：高', type: 'success' },
            { text: 'uniCloud生态', type: 'info' }
          ],
          demoPath: '/pages/demo-unilink/demo-unilink',
          qrValue: 'https://xxx.dcloud.net.cn/ul/abc123'
        },
        {
          id: 'thirdparty',
          title: '方案五：第三方 DeepLink 服务',
          subtitle: '极光/个推等商业服务',
          desc: '使用第三方服务管理 DeepLink，提供数据统计、渠道分析、动态修改目标等能力。',
          tags: [
            { text: '成本：低', type: 'success' },
            { text: '稳定性：高', type: 'success' },
            { text: '商业App', type: 'primary' }
          ],
          demoPath: '/pages/demo-thirdparty/demo-thirdparty',
          qrValue: BASE_URL + '/api/deeplink/resolve'
        },
        {
          id: 'token',
          title: '方案六：Token 二维码',
          subtitle: '企业级安全方案',
          desc: '二维码只含 Token，App 扫码后请求服务端解析真实路由。支持过期、权限控制。',
          tags: [
            { text: '成本：高', type: 'danger' },
            { text: '稳定性：最高', type: 'success' },
            { text: '企业级', type: 'primary' }
          ],
          demoPath: '/pages/demo-token/demo-token',
          qrValue: buildHttpsLink('/q/token_abc123', {})
        }
      ]
    }
  },

  methods: {
    /**
     * 跳转到方案详情页
     */
    goToDemo(item) {
      uni.navigateTo({ url: item.demoPath })
    },

    /**
     * 显示二维码弹窗
     */
    showQRCode(item) {
      this.currentScheme = item
      this.currentQRValue = item.qrValue
      this.showPopup = true
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;

  .header {
    background: linear-gradient(135deg, #2DC5A0, #3EDDB5);
    padding: 60px 20px 30px;
    text-align: center;

    .header-title {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 8px;
    }

    .header-subtitle {
      display: block;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .card-list {
    padding: 16px;
    height: calc(100vh - 140px);
  }

  .scheme-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .card-index {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #2DC5A0;
        color: #fff;
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .card-info {
        flex: 1;

        .card-title {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }

        .card-subtitle {
          display: block;
          font-size: 12px;
          color: #999;
        }
      }
    }

    .card-desc {
      display: block;
      font-size: 13px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;

      .tag {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;

        &.success {
          background: rgba(45, 197, 160, 0.1);
          color: #2DC5A0;
        }

        &.warning {
          background: rgba(255, 154, 108, 0.1);
          color: #FF9A6C;
        }

        &.danger {
          background: rgba(255, 107, 107, 0.1);
          color: #FF6B6B;
        }

        &.info {
          background: rgba(0, 122, 255, 0.1);
          color: #007aff;
        }

        &.primary {
          background: rgba(45, 197, 160, 0.1);
          color: #2DC5A0;
        }
      }
    }

    .card-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        flex: 1;
        height: 36px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.primary {
          background: #2DC5A0;

          .action-text {
            color: #fff;
          }
        }

        &.secondary {
          background: #f5f5f5;

          .action-text {
            color: #666;
          }
        }

        .action-text {
          font-size: 13px;
          font-weight: 500;
        }
      }
    }
  }
}

/* 二维码弹窗 */
.qr-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  .qr-popup-content {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    width: 80%;
    max-width: 340px;

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      .popup-title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
      }

      .popup-close {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;

        .close-icon {
          font-size: 18px;
          color: #999;
        }
      }
    }

    .qr-display {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .qr-info {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 12px;

      .qr-label {
        display: block;
        font-size: 11px;
        color: #999;
        margin-bottom: 4px;
      }

      .qr-value {
        display: block;
        font-size: 12px;
        color: #333;
        word-break: break-all;
        line-height: 1.4;
      }
    }
  }
}
</style>
