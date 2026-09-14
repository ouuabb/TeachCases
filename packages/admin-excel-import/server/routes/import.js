/**
 * ========================================
 *   Excel 导入路由
 * ========================================
 *
 * 核心流程：
 *   1. 前端通过 multipart/form-data 上传 Excel 文件
 *   2. multer 中间件处理文件上传
 *   3. xlsx (SheetJS) 解析 Excel 为 JSON
 *   4. 数据清洗 + 校验
 *   5. 写入 JSON 存储
 */

import { Router } from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { store } from '../storage.js'

export const importRoutes = Router()

// multer 配置：内存存储（文件不大时推荐）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024  // 最大 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/csv'
    ]
    // 也检查文件扩展名（某些浏览器 MIME 类型不准确）
    const ext = file.originalname.split('.').pop().toLowerCase()
    if (allowedTypes.includes(file.mimetype) || ['xlsx', 'xls', 'csv'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 .xlsx、.xls、.csv 文件'))
    }
  }
})

/**
 * POST /api/import/excel
 *
 * 上传并导入 Excel 文件
 *
 * 请求：
 *   - Content-Type: multipart/form-data
 *   - Body: file (Excel 文件), clearExisting (是否清空), skipDuplicates (是否跳过重复)
 *
 * 响应：
 *   {
 *     success: true,
 *     data: {
 *       imported: 10,
 *       skipped: 2,
 *       errors: [],
 *       total: 12,
 *       preview: [...],  // 前几行预览
 *       headers: [...],  // 列名
 *       sheetName: "Sheet1"
 *     }
 *   }
 */
importRoutes.post('/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传 Excel 文件' })
    }

    console.log(`[Import] 收到文件: ${req.file.originalname} (${req.file.size} bytes)`)

    // 1. 解析 Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 2. 转为 JSON（第一行为表头）
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (jsonData.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel 文件为空或格式不正确' })
    }

    // 3. 获取表头（列名）
    const headers = Object.keys(jsonData[0])

    console.log(`[Import] 解析完成: ${sheetName}, ${jsonData.length} 行, 列: ${headers.join(', ')}`)

    // 4. 导入选项
    const clearExisting = req.body.clearExisting === 'true'
    const skipDuplicates = req.body.skipDuplicates !== 'false' // 默认跳过

    // 5. 写入存储
    const result = store.batchImport(jsonData, {
      clearExisting,
      skipDuplicates,
      duplicateKey: headers[0] // 默认用第一列作为去重键
    })

    // 6. 返回结果（含预览）
    res.json({
      success: true,
      data: {
        ...result,
        preview: jsonData.slice(0, 5),  // 前 5 行预览
        headers,
        sheetName
      }
    })
  } catch (err) {
    console.error('[Import] 解析失败:', err)
    res.status(500).json({ success: false, error: '文件解析失败: ' + err.message })
  }
})

/**
 * GET /api/import/preview
 *
 * 预览 Excel 文件（不实际导入）
 * 用于前端展示导入预览弹窗
 */
importRoutes.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传 Excel 文件' })
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    res.json({
      success: true,
      data: {
        headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
        rows: jsonData,
        sheetName,
        sheetNames: workbook.SheetNames,
        totalRows: jsonData.length
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '预览失败: ' + err.message })
  }
})
