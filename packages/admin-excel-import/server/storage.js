/**
 * ========================================
 *   JSON 文件存储 (替代数据库)
 * ========================================
 *
 * 使用 JSON 文件模拟数据库操作。
 * 生产环境中应替换为 MySQL / PostgreSQL / MongoDB 等。
 *
 * 文件格式：
 * {
 *   "records": [ ... ],
 *   "meta": { "lastId": 0, "updatedAt": "..." }
 * }
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'records.json')

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

/**
 * 读取数据
 */
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('[Store] 读取数据失败:', err)
  }
  return { records: [], meta: { lastId: 0, updatedAt: null } }
}

/**
 * 写入数据
 */
function writeData(data) {
  data.meta.updatedAt = new Date().toISOString()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export const store = {
  /**
   * 获取所有记录
   */
  getAll() {
    return readData()
  },

  /**
   * 获取记录列表（支持分页和搜索）
   */
  query({ page = 1, pageSize = 20, keyword = '' } = {}) {
    const data = readData()
    let records = data.records

    // 关键词搜索（模糊匹配所有字段）
    if (keyword) {
      const kw = keyword.toLowerCase()
      records = records.filter(r =>
        Object.values(r).some(v =>
          String(v).toLowerCase().includes(kw)
        )
      )
    }

    const total = records.length
    const start = (page - 1) * pageSize
    const list = records.slice(start, start + pageSize)

    return { list, total, page, pageSize }
  },

  /**
   * 根据 ID 获取单条记录
   */
  getById(id) {
    const data = readData()
    return data.records.find(r => r.id === id) || null
  },

  /**
   * 新增单条记录
   */
  add(record) {
    const data = readData()
    data.meta.lastId++
    const newRecord = { id: data.meta.lastId, ...record }
    data.records.push(newRecord)
    writeData(data)
    return newRecord
  },

  /**
   * 批量导入记录（Excel 导入核心）
   *
   * @param {Array} records - 要导入的记录数组
   * @param {Object} options - 导入选项
   * @param {boolean} options.clearExisting - 是否清空已有数据
   * @param {boolean} options.skipDuplicates - 是否跳过重复数据
   * @param {string} options.duplicateKey - 判断重复的字段名
   * @returns {Object} 导入结果统计
   */
  batchImport(records, options = {}) {
    const { clearExisting = false, skipDuplicates = false, duplicateKey = 'id' } = options
    const data = readData()

    let imported = 0
    let skipped = 0
    let errors = []

    // 是否清空已有数据
    if (clearExisting) {
      data.records = []
      data.meta.lastId = 0
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      try {
        // 数据清洗：去除首尾空格
        const cleaned = {}
        for (const [key, value] of Object.entries(record)) {
          cleaned[key] = typeof value === 'string' ? value.trim() : value
        }

        // 跳过完全空的行
        if (Object.values(cleaned).every(v => v === '' || v === null || v === undefined)) {
          skipped++
          continue
        }

        // 重复检测
        if (skipDuplicates && duplicateKey && cleaned[duplicateKey]) {
          const exists = data.records.some(
            r => String(r[duplicateKey]) === String(cleaned[duplicateKey])
          )
          if (exists) {
            skipped++
            continue
          }
        }

        // 自动生成 ID
        data.meta.lastId++
        cleaned.id = data.meta.lastId

        data.records.push(cleaned)
        imported++
      } catch (err) {
        errors.push({ row: i + 1, error: err.message })
      }
    }

    writeData(data)

    return { imported, skipped, errors, total: records.length }
  },

  /**
   * 删除单条记录
   */
  deleteById(id) {
    const data = readData()
    const idx = data.records.findIndex(r => r.id === id)
    if (idx === -1) return false
    data.records.splice(idx, 1)
    writeData(data)
    return true
  },

  /**
   * 清空所有数据
   */
  clearAll() {
    writeData({ records: [], meta: { lastId: 0, updatedAt: null } })
  }
}
