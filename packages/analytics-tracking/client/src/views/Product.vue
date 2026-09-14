<template>
  <div class="product">
    <div class="product-layout">
      <div class="product-images">
        <div class="main-image" ref="mainImage">
          <div class="image-placeholder">{{ product.name.charAt(0) }}</div>
        </div>
        <div class="image-thumbs">
          <div
            v-for="(color, idx) in product.colors"
            :key="idx"
            class="thumb"
            :class="{ active: selectedColor === idx }"
            @click="selectColor(idx)"
          >
            {{ color }}
          </div>
        </div>
      </div>

      <div class="product-info">
        <h1>{{ product.name }}</h1>
        <p class="price">¥{{ product.price }}</p>
        <p class="desc">{{ product.description }}</p>

        <div class="specs" ref="specsSection">
          <h3>商品规格</h3>
          <div class="spec-list">
            <div class="spec-item" v-for="spec in product.specs" :key="spec.label">
              <span class="spec-label">{{ spec.label }}:</span>
              <span class="spec-value">{{ spec.value }}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-cart" @click="handleAddToCart">
            加入购物车
          </button>
          <button class="btn btn-buy" @click="handleBuyNow">
            立即购买
          </button>
        </div>

        <div class="tags" ref="tagsSection">
          <span class="tag" v-for="tag in product.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <section class="event-log">
      <h3>事件日志</h3>
      <p class="hint">以下展示本页面触发的埋点事件（控制台也同步输出）</p>
      <div class="log-list">
        <div class="log-item" v-for="(log, idx) in eventLogs" :key="idx">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-type" :class="'type-' + log.type">{{ log.type }}</span>
          <span class="log-name">{{ log.name }}</span>
          <span class="log-props">{{ JSON.stringify(log.props) }}</span>
        </div>
        <div v-if="eventLogs.length === 0" class="log-empty">暂无事件，试试操作页面上的元素</div>
      </div>
    </section>
  </div>
</template>

<script>
import { tracker } from '../sdk/tracker.js'

export default {
  name: 'ProductView',
  data() {
    return {
      selectedColor: 0,
      eventLogs: [],
      product: {
        id: 1,
        name: '智能手表 Pro',
        price: 1299,
        description: '一款功能强大的智能手表，支持心率监测、GPS定位、NFC支付等功能。',
        colors: ['曜石黑', '星空蓝', '玫瑰金'],
        specs: [
          { label: '屏幕', value: '1.5 英寸 AMOLED' },
          { label: '电池', value: '450mAh，续航 7 天' },
          { label: '防水', value: '5ATM 防水' },
          { label: '连接', value: '蓝牙 5.2 + WiFi' },
        ],
        tags: ['热销', '新品', '包邮']
      }
    }
  },
  mounted() {
    // 设置公共属性，后续所有事件都会携带 productId
    tracker.setCommonProps({ productId: this.product.id })

    // 使用 IntersectionObserver 实现曝光埋点
    this._setupExposureTracking()
  },
  beforeUnmount() {
    // 清理 observer
    if (this._observer) {
      this._observer.disconnect()
    }
  },
  methods: {
    /**
     * 选择颜色 — 手动埋点示例
     */
    selectColor(idx) {
      this.selectedColor = idx
      this.logEvent('click', 'color_select', {
        color: this.product.colors[idx],
        colorIndex: idx
      })

      tracker.trackClick('color_option', {
        color: this.product.colors[idx],
        colorIndex: idx
      })
    },

    /**
     * 加入购物车 — 自定义事件埋点
     */
    handleAddToCart() {
      this.logEvent('custom', 'add_to_cart', {
        productId: this.product.id,
        productName: this.product.name,
        price: this.product.price,
        color: this.product.colors[this.selectedColor]
      })

      tracker.trackEvent('add_to_cart', {
        productId: this.product.id,
        productName: this.product.name,
        price: this.product.price,
        color: this.product.colors[this.selectedColor],
        quantity: 1
      })
    },

    /**
     * 立即购买 — 自定义事件埋点
     */
    handleBuyNow() {
      this.logEvent('custom', 'buy_now_click', {
        productId: this.product.id,
        price: this.product.price
      })

      tracker.trackEvent('buy_now_click', {
        productId: this.product.id,
        productName: this.product.name,
        price: this.product.price,
        color: this.product.colors[this.selectedColor]
      })
    },

    /**
     * 使用 IntersectionObserver 实现元素曝光埋点
     * 当元素进入可视区域时自动上报
     */
    _setupExposureTracking() {
      if (!window.IntersectionObserver) return

      this._observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target
            const name = el.dataset.trackExposure || 'unknown'

            this.logEvent('exposure', name, { visible: true })

            tracker.trackExposure(name, {
              ratio: entry.intersectionRatio
            })

            // 曝光一次后取消观察（避免重复上报）
            this._observer.unobserve(el)
          }
        })
      }, { threshold: 0.5 })

      // 观察需要曝光追踪的元素
      this.$nextTick(() => {
        if (this.$refs.specsSection) {
          this.$refs.specsSection.dataset.trackExposure = 'specs_section'
          this._observer.observe(this.$refs.specsSection)
        }
        if (this.$refs.tagsSection) {
          this.$refs.tagsSection.dataset.trackExposure = 'tags_section'
          this._observer.observe(this.$refs.tagsSection)
        }
        if (this.$refs.mainImage) {
          this.$refs.mainImage.dataset.trackExposure = 'main_product_image'
          this._observer.observe(this.$refs.mainImage)
        }
      })
    },

    /**
     * 记录事件到页面日志
     */
    logEvent(type, name, props) {
      const time = new Date().toLocaleTimeString()
      this.eventLogs.unshift({ time, type, name, props })
      // 最多保留 20 条
      if (this.eventLogs.length > 20) {
        this.eventLogs.pop()
      }
    }
  }
}
</script>

<style scoped>
.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.main-image {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.image-placeholder {
  width: 100%;
  height: 360px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  color: white;
}

.image-thumbs {
  display: flex;
  gap: 8px;
}

.thumb {
  padding: 8px 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.thumb.active {
  border-color: #4361ee;
  color: #4361ee;
  background: #f0f3ff;
}

.product-info h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.price {
  font-size: 28px;
  color: #f72585;
  font-weight: bold;
  margin-bottom: 12px;
}

.desc {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.specs {
  margin-bottom: 20px;
}

.specs h3 {
  margin-bottom: 10px;
  font-size: 16px;
}

.spec-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.spec-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.spec-label {
  color: #999;
  margin-right: 4px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cart {
  background: #ff6b35;
  color: white;
}

.btn-cart:hover {
  background: #e55a2b;
}

.btn-buy {
  background: #4361ee;
  color: white;
}

.btn-buy:hover {
  background: #3651d4;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: #fff3e0;
  color: #ff6b35;
  border-radius: 4px;
  font-size: 12px;
}

.event-log {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.event-log h3 {
  margin-bottom: 4px;
}

.hint {
  color: #999;
  font-size: 13px;
  margin-bottom: 12px;
}

.log-list {
  max-height: 240px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  align-items: center;
}

.log-time {
  color: #999;
  font-family: monospace;
  min-width: 70px;
}

.log-type {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  color: white;
  min-width: 50px;
  text-align: center;
}

.type-click { background: #f72585; }
.type-exposure { background: #4cc9f0; color: #333; }
.type-custom { background: #7209b7; }
.type-page { background: #4361ee; }

.log-name {
  font-weight: 500;
  min-width: 120px;
}

.log-props {
  color: #999;
  font-family: monospace;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.log-empty {
  color: #ccc;
  text-align: center;
  padding: 20px;
}
</style>
