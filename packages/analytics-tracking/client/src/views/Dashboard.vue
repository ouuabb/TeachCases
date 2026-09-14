<template>
  <div class="dashboard">
    <h1>数据看板</h1>
    <p class="desc">实时查看后端收到的埋点数据</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ stats.total || 0 }}</div>
        <div class="stat-label">总事件数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.sessions || 0 }}</div>
        <div class="stat-label">会话数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ Object.keys(stats.byType || {}).length }}</div>
        <div class="stat-label">事件类型数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ Object.keys(stats.byPage || {}).length }}</div>
        <div class="stat-label">覆盖页面数</div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <h3>按事件类型分布</h3>
        <div class="bar-chart">
          <div
            v-for="(count, type) in stats.byType"
            :key="type"
            class="bar-row"
          >
            <span class="bar-label">{{ type }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: getBarWidth(count, maxTypeCount) }"
                :class="'bar-' + type"
              ></div>
            </div>
            <span class="bar-count">{{ count }}</span>
          </div>
          <div v-if="Object.keys(stats.byType || {}).length === 0" class="empty-chart">
            暂无数据
          </div>
        </div>
      </div>

      <div class="detail-card">
        <h3>按事件名称分布</h3>
        <div class="bar-chart">
          <div
            v-for="(count, name) in stats.byName"
            :key="name"
            class="bar-row"
          >
            <span class="bar-label">{{ name }}</span>
            <div class="bar-track">
              <div
                class="bar-fill bar-name"
                :style="{ width: getBarWidth(count, maxNameCount) }"
              ></div>
            </div>
            <span class="bar-count">{{ count }}</span>
          </div>
          <div v-if="Object.keys(stats.byName || {}).length === 0" class="empty-chart">
            暂无数据
          </div>
        </div>
      </div>

      <div class="detail-card full-width">
        <h3>最近事件列表</h3>
        <div class="event-table">
          <div class="table-header">
            <span class="col-id">#</span>
            <span class="col-type">类型</span>
            <span class="col-name">事件名</span>
            <span class="col-page">页面</span>
            <span class="col-time">时间</span>
            <span class="col-props">属性</span>
          </div>
          <div
            class="table-row"
            v-for="event in stats.recentEvents"
            :key="event.id"
          >
            <span class="col-id">{{ event.id }}</span>
            <span class="col-type">
              <span class="mini-badge" :class="'badge-' + event.eventType">
                {{ event.eventType }}
              </span>
            </span>
            <span class="col-name">{{ event.eventName }}</span>
            <span class="col-page">{{ event.page }}</span>
            <span class="col-time">{{ formatTime(event.timestamp) }}</span>
            <span class="col-props">{{ JSON.stringify(event.props) }}</span>
          </div>
          <div v-if="(stats.recentEvents || []).length === 0" class="empty-chart">
            暂无数据，请先在其他页面操作触发埋点
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn" @click="refresh">刷新数据</button>
      <button class="btn btn-secondary" @click="clearEvents" v-if="stats.total > 0">清空数据</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardView',
  data() {
    return {
      stats: {},
      refreshTimer: null
    }
  },
  computed: {
    maxTypeCount() {
      const values = Object.values(this.stats.byType || {})
      return Math.max(...values, 1)
    },
    maxNameCount() {
      const values = Object.values(this.stats.byName || {})
      return Math.max(...values, 1)
    }
  },
  mounted() {
    this.refresh()
    // 每 3 秒自动刷新
    this.refreshTimer = setInterval(this.refresh, 3000)
  },
  beforeUnmount() {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
  },
  methods: {
    async refresh() {
      try {
        const res = await fetch('/api/analytics/stats')
        const json = await res.json()
        if (json.success) {
          this.stats = json.data
        }
      } catch (err) {
        console.error('获取统计数据失败:', err)
      }
    },
    async clearEvents() {
      // 简单实现：刷新页面即可（生产环境需要 DELETE 接口）
      alert('内存数据会在服务重启后清空')
    },
    getBarWidth(count, max) {
      return ((count / max) * 100).toFixed(1) + '%'
    },
    formatTime(ts) {
      if (!ts) return '-'
      return new Date(ts).toLocaleTimeString()
    }
  }
}
</script>

<style scoped>
.dashboard h1 {
  margin-bottom: 4px;
}

.desc {
  color: #666;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #4361ee;
}

.stat-label {
  color: #999;
  font-size: 13px;
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h3 {
  margin-bottom: 12px;
  font-size: 15px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  width: 120px;
  font-size: 13px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-click { background: #f72585; }
.bar-exposure { background: #4cc9f0; }
.bar-custom { background: #7209b7; }
.bar-page { background: #4361ee; }
.bar-name { background: #4361ee; }

.bar-count {
  width: 40px;
  font-size: 13px;
  font-weight: 500;
}

.empty-chart {
  text-align: center;
  color: #ccc;
  padding: 30px;
}

.event-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 50px 80px 150px 120px 80px 1fr;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  align-items: center;
}

.table-header {
  border-bottom: 2px solid #eee;
  font-weight: bold;
  color: #666;
}

.table-row {
  border-bottom: 1px solid #f5f5f5;
}

.table-row:hover {
  background: #fafafa;
}

.mini-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.badge-click { background: #f72585; }
.badge-exposure { background: #4cc9f0; color: #333; }
.badge-custom { background: #7209b7; }
.badge-page { background: #4361ee; }

.col-props {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #999;
  font-family: monospace;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  background: #4361ee;
  color: white;
}

.btn-secondary {
  background: #e9ecef;
  color: #333;
}
</style>
