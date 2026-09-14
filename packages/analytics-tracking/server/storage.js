/**
 * ========================================
 *   内存存储 (教学简化版)
 * ========================================
 *
 * 实际生产环境中，埋点数据会存储到：
 *   - ClickHouse / Doris (OLAP 分析引擎)
 *   - Kafka → Flink → Hive (大数据流水线)
 *   - Elasticsearch (全文检索)
 *
 * 这里用内存数组模拟，方便教学演示。
 */

class EventStore {
  constructor() {
    this.events = []
    this.sessionMap = new Map() // sessionId → 首次访问时间
  }

  /**
   * 存储一条埋点事件
   */
  add(event) {
    const record = {
      id: this.events.length + 1,
      ...event,
      serverTime: new Date().toISOString()
    }
    this.events.push(record)

    // 记录会话
    if (event.sessionId && !this.sessionMap.has(event.sessionId)) {
      this.sessionMap.set(event.sessionId, record.serverTime)
    }

    console.log(`[Store] 事件已存储 #${record.id}: ${record.eventType} / ${record.eventName}`)
    return record
  }

  /**
   * 批量存储
   */
  addBatch(events) {
    return events.map(e => this.add(e))
  }

  /**
   * 查询事件列表
   */
  query({ eventType, eventName, startTime, endTime, limit = 100 } = {}) {
    let result = [...this.events]

    if (eventType) {
      result = result.filter(e => e.eventType === eventType)
    }
    if (eventName) {
      result = result.filter(e => e.eventName === eventName)
    }
    if (startTime) {
      result = result.filter(e => new Date(e.timestamp) >= new Date(startTime))
    }
    if (endTime) {
      result = result.filter(e => new Date(e.timestamp) <= new Date(endTime))
    }

    return result.slice(-limit)
  }

  /**
   * 获取统计数据
   */
  getStats() {
    const byType = {}
    const byName = {}
    const byPage = {}

    for (const event of this.events) {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1
      byName[event.eventName] = (byName[event.eventName] || 0) + 1
      if (event.page) {
        byPage[event.page] = (byPage[event.page] || 0) + 1
      }
    }

    return {
      total: this.events.length,
      sessions: this.sessionMap.size,
      byType,
      byName,
      byPage,
      recentEvents: this.events.slice(-20)
    }
  }
}

export const store = new EventStore()
