# Excel 导入导出教学文档

## 一、Excel 文件格式基础

### 1.1 常见格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| **Excel 2007+** | .xlsx | 基于 XML 的开放格式，最常用 |
| **Excel 97-2003** | .xls | 旧版二进制格式 |
| **CSV** | .csv | 纯文本，逗号分隔，通用性最强 |

### 1.2 Excel 文件结构

```
工作簿 (Workbook)
  ├── 工作表 (Sheet)  "Sheet1"
  │     ├── 行 (Row)  第1行、第2行...
  │     └── 列 (Column)  A列、B列...
  │           └── 单元格 (Cell)  A1, B2...
  ├── 工作表 (Sheet)  "Sheet2"
  └── ...
```

在 SheetJS 中对应的结构：
```javascript
workbook = {
  SheetNames: ['Sheet1', 'Sheet2'],
  Sheets: {
    'Sheet1': { 'A1': { v: '姓名', t: 's' }, ... }
  }
}
```

---

## 二、SheetJS (xlsx) 核心 API

### 2.1 安装

```bash
npm install xlsx
# 前后端通用，无需区分
```

### 2.2 读取 Excel（导入）

```javascript
import * as XLSX from 'xlsx'

// 从文件读取
const workbook = XLSX.readFile(filePath)

// 从 Buffer 读取（后端接收上传文件时）
const workbook = XLSX.read(buffer, { type: 'buffer' })

// 从二进制字符串读取
const workbook = XLSX.read(binaryString, { type: 'binary' })
```

### 2.3 工作表转 JSON（导入核心）

```javascript
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]

// 方式1：第一行作为表头（最常用）
const data = XLSX.utils.sheet_to_json(worksheet)
// 结果: [{ 姓名: '张三', 年龄: 25 }, ...]

// 方式2：保留空值
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

// 方式3：自定义表头位置
const data = XLSX.utils.sheet_to_json(worksheet, { range: 2 }) // 从第3行开始
```

### 2.4 JSON 转工作表（导出核心）

```javascript
// 从 JSON 创建工作表
const worksheet = XLSX.utils.json_to_sheet(data)

// 设置列宽
worksheet['!cols'] = [
  { wch: 10 },  // A列宽10字符
  { wch: 20 },  // B列宽20字符
]

// 手动写入单元格
XLSX.utils.sheet_add_aoa(worksheet, [['标题1', '标题2']], { origin: 'A1' })
```

### 2.5 生成 Excel 文件（导出）

```javascript
// 创建工作簿
const workbook = XLSX.utils.book_new()

// 添加工作表
XLSX.utils.book_append_sheet(workbook, worksheet, '数据')

// 写入文件（Node.js）
XLSX.writeFile(workbook, 'output.xlsx')

// 生成 Buffer（用于 HTTP 响应）
const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

// 生成二进制字符串（用于浏览器 Blob）
const binary = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' })
```

---

## 三、导入流程详解

### 3.1 前端流程

```
用户选择文件
    ↓
前端校验（扩展名、大小）
    ↓
可选：前端预览（用 xlsx 解析，不上传）
    ↓
FormData 封装文件
    ↓
POST 到后端 /api/import/excel
    ↓
显示导入结果
```

### 3.2 前端文件上传代码

```javascript
// 使用 FormData 上传
const formData = new FormData()
formData.append('file', file)           // Excel 文件
formData.append('clearExisting', false) // 是否清空
formData.append('skipDuplicates', true) // 是否跳过重复

const res = await fetch('/api/import/excel', {
  method: 'POST',
  body: formData  // 注意：不要设置 Content-Type，浏览器会自动加 boundary
})
```

### 3.3 后端处理流程

```
接收上传文件 (multer)
    ↓
xlsx 解析 Excel 为 JSON 数组
    ↓
数据清洗（去空格、类型转换）
    ↓
数据校验（必填项、格式、范围）
    ↓
重复检测（可选）
    ↓
写入存储
    ↓
返回导入结果
```

### 3.4 multer 文件上传中间件

```javascript
import multer from 'multer'

const upload = multer({
  storage: multer.memoryStorage(),  // 存到内存（文件不大时）
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx')) {
      cb(null, true)
    } else {
      cb(new Error('只支持 Excel 文件'))
    }
  }
})

// 使用：upload.single('file') 表示接收单个文件字段 'file'
```

---

## 四、导出流程详解

### 4.1 后端生成 Excel

```javascript
// 1. 查询数据
const records = store.getAll()

// 2. JSON → 工作表
const worksheet = XLSX.utils.json_to_sheet(records)

// 3. 自动列宽
const colWidths = Object.keys(records[0]).map(key => ({
  wch: Math.max(key.length, ...records.map(r => String(r[key]).length)) + 2
}))
worksheet['!cols'] = colWidths

// 4. 创建工作簿
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, '数据')

// 5. 生成文件流
const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

// 6. 设置响应头
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
res.setHeader('Content-Disposition', 'attachment; filename="export.xlsx"')
res.send(buffer)
```

### 4.2 前端触发下载

```javascript
async function downloadExcel() {
  const res = await fetch('/api/export/excel')
  const blob = await res.blob()

  // 创建临时下载链接
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.xlsx'
  a.click()

  // 释放内存
  URL.revokeObjectURL(url)
}
```

---

## 五、数据校验与清洗

### 5.1 常见校验规则

```javascript
const rules = {
  姓名: { required: true, maxLength: 50 },
  邮箱: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  手机: { pattern: /^1[3-9]\d{9}$/ },
  年龄: { type: 'number', min: 0, max: 150 }
}
```

### 5.2 数据清洗

```javascript
// 去除首尾空格
value = String(value).trim()

// 类型转换
age = Number(age)

// 默认值
status = status || 'active'

// 枚举校验
if (!['male', 'female'].includes(gender)) {
  throw new Error(`性别值无效: ${gender}`)
}
```

---

## 六、前端预览 Excel（不上传）

使用 xlsx 在浏览器端解析文件，实现预览功能：

```javascript
import * as XLSX from 'xlsx'

function previewExcel(file) {
  const reader = new FileReader()

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 转为 JSON 用于表格展示
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    console.log('预览数据:', jsonData)
  }

  reader.readAsArrayBuffer(file)
}
```

---

## 七、文件上传安全注意事项

| 风险 | 防护措施 |
|------|---------|
| 文件类型伪造 | 后端校验 MIME + 文件头(magic number) |
| 超大文件攻击 | multer limits.fileSize 限制 |
| 路径穿越 | multer 自动处理文件名 |
| 内存溢出 | 使用 diskStorage 替代 memoryStorage |
| 恶意内容 | 数据清洗 + 类型转换 + 长度限制 |

---

## 八、生产环境优化

| 场景 | 教学版 | 生产版 |
|------|--------|--------|
| 大文件(>1MB) | 内存处理 | 流式处理 / Web Worker |
| 超大数据(>10万行) | 全量导出 | 分片导出 / 异步任务 |
| 并发导入 | 串行处理 | 队列 + 并发控制 |
| 数据库 | JSON 文件 | MySQL / PostgreSQL |
| 文件存储 | 内存 | 磁盘 / OSS |

---

## 九、动手练习

1. **修改模板**：在后端修改模板的列和示例数据
2. **添加校验**：在 `storage.js` 的 `batchImport` 中增加邮箱格式校验
3. **多 Sheet 导入**：修改导入逻辑，支持选择导入哪个 Sheet
4. **导出样式**：给导出的 Excel 添加表头背景色（需要 xlsx-style 库）
5. **前端预览优化**：在预览表格中高亮显示可能有问题的单元格
