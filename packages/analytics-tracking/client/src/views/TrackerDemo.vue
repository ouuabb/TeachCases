<template>
  <div class="tracker-demo">
    <h1>埋点 SDK 交互式演示</h1>
    <p class="desc">在控制台打开 <code>window.$tracker</code> 可以直接操作 SDK</p>

    <div class="demo-grid">
      <!-- 左侧：操作面板 -->
      <div class="panel">
        <h3>基本事件上报</h3>

        <div class="form-group">
          <label>事件名称 (eventName)</label>
          <input v-model="form.eventName" placeholder="例: button_click" />
        </div>

        <div class="form-group">
          <label>事件类型 (eventType)</label>
          <select v-model="form.eventType">
            <option value="custom">custom (自定义)</option>
            <option value="click">click (点击)</option>
            <option value="page">page (页面)</option>
            <option value="exposure">exposure (曝光)</option>
          </select>
        </div>

        <div class="form-group">
          <label>自定义属性 (JSON)</label>
          <textarea v-model="form.propsJson" rows="3" placeholder='{"key": "value"}'></textarea>
        </div>

        <button class="btn btn-primary" @click="sendEvent">发送事件</button>
        <button class="btn btn-secondary" @click="sendBatch">批量发送 5 条</button>

        <hr />

        <h3>预设场景</h3>
        <div class="preset-list">
          <button
            v-for="preset in presets"
            :key="preset.name"
            class="btn btn-preset"
            @click="runPreset(preset)"
          >
            {{ preset.icon }} {{ preset.name }}
          </button>
        </div>

        <hr />

        <h3>SDK 配置</h3>
        <div class="form-group">
          <label>用户 ID</label>
          <input v-model="userId" placeholder="设置用户 ID" @change="setUserId" />
        </div>

        <div class="form-group">
          <label>采样率: {{ sampleRate }}</label>
          <input type="range" min="0" max="1" step="0.1" v-model.number="sampleRate" @change="setSampleRate" />
          <span class="range-label">{{ (sampleRate * 100).toFixed(0) }}%</span>
        </div>

        <div class="sdk-info">
          <h4>SDK 运行状态</h4>
          <div class="info-row">
            <span>Session ID:</span>
            <code>{{ sessionId }}</code>
          </div>
          <div class="info-row">
            <span>离线缓存:</span>
            <code>{{ offlineCount }} 条</code>
          </div>
        </div>
      </div>

      <!-- 右侧：事件流 -->
      <div class="panel event-stream">
        <h3>事件流 (实时) <span class="count">{{ events.length }} 条</span></h3>
        <div class="stream-list" ref="streamList">
          <div class="stream-item" v-for="(e, idx) in events" :key="idx">
            <div class="stream-header">
              <span class="stream-type" :class="'type-' + e.eventType">{{ e.eventType }}</span>
              <span class="stream-name">{{ e.eventName }}</span>
              <span class="stream-time">{{ e.displayTime }}</span>
            </div>
            <pre class="stream-detail">{{ formatEvent(e) }}</pre>
          </div>
          <div v-if="events.length === 0" class="empty">
            发送一个事件试试 ↑
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tracker } from '../sdk/tracker.js'

export default {
  name: 'TrackerDemo',
  data() {
    return {
      form: {
        eventName: 'button_click',
        eventType: 'custom',
        propsJson: '{"buttonName": "test", "page": "demo"}'
      },
      userId: '',
      sampleRate: 1,
      sessionId: '',
      offlineCount: 0,
      events: [],
      presets: [
        {
          name: '页面浏览',
          icon: '📄',
          fn: () => tracker.trackPageView('/demo/pv-test', { source: 'manual' })
        },
        {
          name: '按钮点击',
          icon: '👆',
          fn: () => tracker.trackClick('demo_button', { buttonType: 'primary' })
        },
        {
          name: '元素曝光',
          icon: '👁',
          fn: () => tracker.trackExposure('demo_section', { section: 'main' })
        },
        {
          name: '加入购物车',
          icon: '🛒',
          fn: () => tracker.trackEvent('add_to_cart', { productId: 42, quantity: 1 })
        },
        {
          name: '视频播放',
          icon: '▶️',
          fn: () => tracker.trackEvent('video_play', { videoId: 'v_001', duration: 120 })
        },
        {
          name: '搜索',
          icon: '🔍',
          fn: () => tracker.trackEvent('search', { keyword: '手机', resultCount: 15 })
        },
        {
          name: '登录',
          icon: '🔐',
          fn: () => tracker.trackEvent('login', { method: 'wechat', success: true })
        },
        {
          name: '分享',
          icon: '🔗',
          fn: () => tracker.trackEvent('share', { platform: '朋友圈', contentType: 'article' })
        }
      ]
    }
  },
  mounted() {
    this.sessionId = tracker.sessionId || 'N/A'
    this._pollOffline()
  },
  beforeUnmount() {
    if (this._pollTimer) clearInterval(this._pollTimer)
  },
  methods: {
    sendEvent() {
      let props = {}
      try {
        props = JSON.parse(this.form.propsJson || '{}')
      } catch (e) {
        alert('JSON 格式错误: ' + e.message)
        return
      }

      const msgId = tracker.track(this.form.eventName, props, {
        eventType: this.form.eventType
      })

      this._pushEvent({
        eventType: this.form.eventType,
        eventName: this.form.eventName,
        props,
        messageId: msgId,
        displayTime: this._nowStr()
      })
    },

    sendBatch() {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const name = `batch_event_${i + 1}`
          tracker.trackEvent(name, { batchIndex: i + 1, total: 5 })
          this._pushEvent({
            eventType: 'custom',
            eventName: name,
            props: { batchIndex: i + 1 },
            displayTime: this._nowStr()
          })
        }, i * 200)
      }
    },

    runPreset(preset) {
      preset.fn()
      this._pushEvent({
        eventType: 'custom',
        eventName: preset.name,
        props: { preset: true },
        displayTime: this._nowStr()
      })
    },

    setUserId() {
      tracker.setUserId(this.userId)
    },

    setSampleRate() {
      tracker.sampler = { shouldSample: () => Math.random() < this.sampleRate }
    },

    formatEvent(e) {
      return JSON.stringify({
        eventType: e.eventType,
        eventName: e.eventName,
        props: e.props,
        messageId: e.messageId
      }, null, 2)
    },

    _pushEvent(event) {
      this.events.unshift(event)
      if (this.events.length > 50) this.events.pop()
    },

    _nowStr() {
      return new Date().toLocaleTimeString()
    },

    _pollOffline() {
      this._pollTimer = setInterval(() => {
        this.offlineCount = tracker.offlineQueue ? tracker.offlineQueue.size : 0
        this.sessionId = tracker.sessionId || 'N/A'
      }, 1000)
    }
  }
}
</script>

<style scoped>
.tracker-demo h1 {
  margin-bottom: 4px;
}

.desc {
  color: #666;
  margin-bottom: 20px;
}

.desc code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.panel h3 {
  margin-bottom: 12px;
  font-size: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
}

.form-group textarea {
  resize: vertical;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.btn-primary {
  background: #4361ee;
  color: white;
}

.btn-secondary {
  background: #e9ecef;
  color: #333;
}

.btn-preset {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.btn-preset:hover {
  background: #e9ecef;
}

hr {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #eee;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sdk-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.sdk-info h4 {
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.info-row code {
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-stream .count {
  font-weight: normal;
  color: #999;
  font-size: 13px;
}

.stream-list {
  max-height: 500px;
  overflow-y: auto;
}

.stream-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 0;
}

.stream-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stream-type {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.type-click { background: #f72585; }
.type-exposure { background: #4cc9f0; color: #333; }
.type-custom { background: #7209b7; }
.type-page { background: #4361ee; }

.stream-name {
  font-weight: 500;
}

.stream-time {
  margin-left: auto;
  color: #999;
  font-size: 12px;
  font-family: monospace;
}

.stream-detail {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #555;
  overflow-x: auto;
  margin: 0;
}

.empty {
  text-align: center;
  color: #ccc;
  padding: 40px;
}
</style>
