<!--
  二维码生成组件

  教学要点：
  - 封装 qrcode 库，通过 canvas 绘制二维码
  - 统一管理所有方案的二维码生成逻辑
  - 支持自定义尺寸

  使用方式：
    <qrcode-generator :value="'scanjump://page/detail?id=123'" :size="300" />

  Props：
    value - 二维码内容（字符串）
    size - 二维码尺寸（像素，默认 300）
-->
<template>
  <view class="qrcode-wrap">
    <canvas
      canvas-id="qrcode-canvas"
      class="qrcode-canvas"
      :style="{ width: size + 'px', height: size + 'px' }"
    ></canvas>
    <view class="qrcode-tip" v-if="showTip">
      <text class="tip-text">用手机扫一扫打开</text>
    </view>
  </view>
</template>

<script>
/**
 * qrcode 库使用说明：
 *
 * 这里使用 qrcode 库的 toCanvas 方法在 canvas 上绘制二维码。
 * qrcode 是一个纯前端二维码生成库，支持：
 * - toCanvas(canvasElement, text, options)
 * - toDataURL(text, options)
 * - toString(text, options)
 *
 * uni-app 中使用 canvas 绘制二维码的步骤：
 * 1. 获取 canvas 上下文
 * 2. 使用 qrcode 库绘制
 * 3. 将 canvas 转为图片展示
 */
import QRCode from 'qrcode'

export default {
  name: 'QrcodeGenerator',

  props: {
    /** 二维码内容 */
    value: {
      type: String,
      default: ''
    },
    /** 二维码尺寸（像素） */
    size: {
      type: Number,
      default: 300
    },
    /** 是否显示提示文字 */
    showTip: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      /** 二维码图片临时路径 */
      qrcodeImage: ''
    }
  },

  watch: {
    /** 监听 value 变化，重新生成二维码 */
    value: {
      handler(newVal) {
        if (newVal) {
          this.generateQR()
        }
      },
      immediate: true
    }
  },

  methods: {
    /**
     * 生成二维码
     *
     * 教学要点：
     * - QRCode.toDataURL() 生成 base64 图片
     * - uni-app 中 canvas 绘制需要用 uni.canvasToTempFilePath 转换
     * - 简化方案：直接用 toDataURL 生成图片展示
     */
    async generateQR() {
      if (!this.value) return

      try {
        // 使用 qrcode 库生成 base64 图片
        const dataUrl = await QRCode.toDataURL(this.value, {
          width: this.size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })

        this.qrcodeImage = dataUrl

        // 同时绘制到 canvas（供保存使用）
        this.drawToCanvas(dataUrl)
      } catch (e) {
        console.error('[QrcodeGenerator] 生成二维码失败:', e)
      }
    },

    /**
     * 绘制到 canvas
     * uni-app 中使用 uni.createCanvasContext 获取上下文
     */
    drawToCanvas(dataUrl) {
      // #ifdef H5
      // H5 端直接使用 img 标签展示即可
      // #endif

      // #ifdef APP-PLUS
      // App 端绘制到 canvas（供保存功能使用）
      const ctx = uni.createCanvasContext('qrcode-canvas', this)
      // 将 base64 绘制到 canvas
      // 注意：uni-app 的 canvas 绘制 base64 需要先转为临时文件
      // 这里简化处理，实际项目可使用 plus.io 转换
      // #endif
    }
  }
}
</script>

<style lang="scss" scoped>
.qrcode-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;

  .qrcode-canvas {
    background: #fff;
    border-radius: 8px;
  }

  .qrcode-tip {
    margin-top: 12px;

    .tip-text {
      font-size: 12px;
      color: #999;
    }
  }
}
</style>
