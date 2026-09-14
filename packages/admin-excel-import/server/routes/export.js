/**
 * ========================================
 *   Excel 导出路由
 * ========================================
 *
 * 核心流程：
 *   1. 从 JSON 存储读取数据
 *   2. xlsx (SheetJS) 将 JSON 转为工作簿
 *   3. 生成 Excel 文件流返回给前端
 *   4. 前端触发文件下载
 */

import { Router } from 'express'
import * as XLSX from 'xlsx'
import { store } from '../storage.js'

export const exportRoutes = Router()

/**
 * GET /api/export/excel
 *
 * 导出数据为 Excel 文件
 *
 * 查询参数：
 *   - keyword: 搜索关键词（可选）
 *   - sheetName: 工作表名称（默认 "数据"）
 *   - filename: 导出文件名（默认 "export.xlsx"）
 *
 * 响应：Excel 文件流
 */
exportRoutes.get('/excel', (req, res) => {
  try {
    const { keyword, sheetName = '数据', filename = 'export.xlsx' } = req.query

    // 1. 获取数据
    const { list: records } = store.query({ keyword, pageSize: 10000 })

    if (records.length === 0) {
      return res.status(404).json({ success: false, error: '没有可导出的数据' })
    }

    console.log(`[Export] 导出 ${records.length} 条数据`)

    // 2. 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 3. 将 JSON 转为工作表
    //    注意：xlsx 会自动将对象的 key 作为表头
    const worksheet = XLSX.utils.json_to_sheet(records)

    // 4. 自动设置列宽（根据内容长度）
    const colWidths = Object.keys(records[0]).map(key => {
      const maxLen = Math.max(
        key.length,
        ...records.map(r => String(r[key] || '').length)
      )
      return { wch: Math.min(maxLen + 2, 50) }
    })
    worksheet['!cols'] = colWidths

    // 5. 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 6. 生成 Excel 文件并返回
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 设置响应头，触发浏览器下载
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  } catch (err) {
    console.error('[Export] 导出失败:', err)
    res.status(500).json({ success: false, error: '导出失败: ' + err.message })
  }
})

/**
 * GET /api/export/template
 *
 * 下载导入模板（空表 + 表头 + 示例数据）
 *
 * 这是一个教学常用功能：给用户一个标准模板填写数据
 */
exportRoutes.get('/template', (req, res) => {
  try {
    const { sheetName = '导入模板' } = req.query

    // 模板示例数据（教学用途）
    const templateData = [
      { 姓名: '张三', 部门: '技术部', 职位: '前端工程师', 邮箱: 'zhangsan@example.com', 手机: '13800138001' },
      { 姓名: '李四', 部门: '产品部', 职位: '产品经理',   邮箱: 'lisi@example.com',   手机: '13800138002' },
      { 姓名: '王五', 部门: '设计部', 职位: 'UI设计师',   邮箱: 'wangwu@example.com',  手机: '13800138003' }
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 10 }, // 姓名
      { wch: 10 }, // 部门
      { wch: 15 }, // 职位
      { wch: 25 }, // 邮箱
      { wch: 15 }  // 手机
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"')
    res.send(buffer)
  } catch (err) {
    res.status(500).json({ success: false, error: '模板下载失败: ' + err.message })
  }
})
